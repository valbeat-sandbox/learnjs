'use strict';

var learnjs = {
    poolId: 'us-east-1:9106a7ca-fcda-4498-9e70-7bd017037aea'
};

learnjs.identitiy = new $.Deferred();

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() { return __; }"
    },
    {
        description: "Simple Math",
        code: "function problem() { return 42 === 6 * __; }"
    }
];

learnjs.appOnReady = function () {
    // attach listener to window object's onhashchange event
    window.onhashchange = function() {
        learnjs.showView(window.location.hash);
    };
    // always executed the first one
    learnjs.showView(window.location.hash);
};

learnjs.showView = function(hash) {
    var routes = {
        '': learnjs.landingView,
        '#': learnjs.landingView,
        '#problem' : learnjs.problemView,
    };
    // [0] => #action, [1] => problemNumber
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
        learnjs.triggerEvent('removingView',[]);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
};

learnjs.landingView = function() {
    return learnjs.template('landing-view');
};

learnjs.problemView = function(data) {
    var problemNumber = parseInt(data, 10);
    var view = learnjs.template('problem-view');
    var problemData = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');

    function checkAnswerClick() {
        var answer = view.find('.answer').val();
        if (learnjs.checkAnswer(problemData,answer)) {
            var correctFlash =learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(resultFlash,correctFlash);
        } else {
            learnjs.flashElement(resultFlash,'Incorrect!');
        }
        return false;
    }

    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber + ' Coming soon!');

    if (problemNumber < learnjs.problems.length) {
        // skip button
        var buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function () {
            buttonItem.remove();
        });
    }

    learnjs.applyObject(problemData, view);
    return view;
};

learnjs.checkAnswer = function (problemData,answer) {
    // change the space to enter response and add code to call problem function
    var test = problemData.code.replace('__',answer) + '; problem();';
    return eval(test);
};

learnjs.applyObject = function(obj, elm) {
    for (var key in obj) {
        elm.find('[data-name="'+ key + '"]').text(obj[key]);
    }
};

learnjs.flashElement = function(elm, content) {
    elm.fadeOut('fast', function () {
        elm.html(content);
        elm.fadeIn();
    });
};

learnjs.buildCorrectFlash = function(problemNum) {
    var correctFlash = learnjs.template('correct-flash');
    var link = correctFlash.find('a');
    if (problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;
};

learnjs.triggerEvent = function (name,args) {
    $('.view-container>*').trigger(name, args);
};

learnjs.template = function (name) {
    return $('.templates .' + name).clone();
};

learnjs.awsRefresh = function() {
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function (err) {
        if(err) {
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
};

// google sign in callback
function googleSignIn(googleUser) {
    // get id token by response object
    var id_token = googleUser.getAuthResponse().id_token;
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentitiyPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    });

    function refresh() {
        return gapi.auth2.getAuthInstance().signIn({
            prompt: 'login'
        }).then(function (userUpdate) {
            var creds = AWS.config.credentials;
            var newToken = userUpdate.getAuthResponse().id_token;
            creds.params.Logins['accounts.google.com'] = newToken;
            return learnjs.awsRefresh();
        })
    }
    // call awsRefresh method and resolve deferred
    learnjs.awsRefresh().then(function(id){
        learnjs.identitiy.resolve({
            id: id,
            email: googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        });
    });
}