'use strict';

var learnjs = {
    poolId: 'us-east-1:9106a7ca-fcda-4498-9e70-7bd017037aea'
};

/**
 * Promise経由でアクセスできるidentity
 * identityはどのログインプロパイダに依存することなくアクセスできる
 */
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

/**
 * DOMが全て読み込まれたら呼び出されるコールバック
 */
learnjs.appOnReady = function () {
    // attach listener to window object's onhashchange event
    window.onhashchange = function() {
        learnjs.showView(window.location.hash);
    };
    // always executed the first one
    learnjs.showView(window.location.hash);
};

/**
 * ルーテング
 * @param hash
 */
learnjs.showView = function(hash) {
    var routes = {
        '': learnjs.landingView,
        '#': learnjs.landingView,
        '#problem': learnjs.problemView,
        '#profile': learnjs.profileView
    };
    // [0] => #action, [1] => problemNumber
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
        learnjs.triggerEvent('removingView',[]);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
};

/**
 * ランディングページ
 * @returns {*|jQuery}
 */
learnjs.landingView = function() {
    return learnjs.template('landing-view');
};

/**
 * 問題ページ
 * @param data
 * @returns {*|jQuery}
 */
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

/**
 * プロフィールページ
 * @returns {*|jQuery}
 */
learnjs.profileView = function() {
    var view = learnjs.template('profile-view');
    learnjs.identitiy.done(function(identity){
        view.find('.email').text(identity.email);
    });
    return view;
};

/**
 * 正解かどうかを判定する
 * @param problemData
 * @param answer
 * @returns {Object}
 */
learnjs.checkAnswer = function (problemData,answer) {
    // change the space to enter response and add code to call problem function
    var test = problemData.code.replace('__',answer) + '; problem();';
    return eval(test);
};

/**
 * データオブジェクトをエレメントに反映
 * @param obj
 * @param elm
 */
learnjs.applyObject = function(obj, elm) {
    for (var key in obj) {
        elm.find('[data-name="'+ key + '"]').text(obj[key]);
    }
};

/**
 * フラッシュエフェクト
 * @param elm
 * @param content
 */
learnjs.flashElement = function(elm, content) {
    elm.fadeOut('fast', function () {
        elm.html(content);
        elm.fadeIn();
    });
};

/**
 * 問題正解時に生成するフラッシュメッセージを生成
 * @param problemNum
 * @returns {*|jQuery}
 */
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

/**
 * viewに指定したイベントをトリガー
 * @param name
 * @param args
 */
learnjs.triggerEvent = function (name,args) {
    $('.view-container>*').trigger(name, args);
};

/**
 * テンプレート取得メソッド
 * @param name
 * @returns {*|jQuery}
 */
learnjs.template = function (name) {
    return $('.templates .' + name).clone();
};

/**
 * AWS設定を更新
 * credentials.refreshのWrapper
 * @returns {*}
 */
learnjs.awsRefresh = function() {
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function (err) {
        if(err) {
            deferred.reject(err);
        } else {
            // リクエストが成功した場合はCognitoのIDを渡す
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
};

/**
 * google sign in callback
 * cognitoでidentityを作成し、アプリケーション側にidentityDeferredを作成する
 * @param googleUser
 */
function googleSignIn(googleUser) {
    console.log(arguments);

    // AWSの設定を更新
    AWS.config.update({
        // アベイラビリティリージョンの指定
        region: 'us-east-1',
        // googleのid tokenを使い、認証オブジェクトを生成
        credentials: new AWS.CognitoIdentityCredentials({
            // identityのpoolIdはname space objectに保持
            IdentityPoolId: learnjs.poolId,
            Logins: {
                // get id token by response object
                'accounts.google.com': googleUser.getAuthResponse().id_token
            }
        })
    });

    // Googleから取得したトークンは1時間後には期限切れになるため、更新する関数
    // トークン期限が切れても、リロードすること無く再認証ができる
    function refresh() {
        // signInを実行し、GoogleAPIが返すオブジェクトを返す
        return gapi.auth2.getAuthInstance().signIn({
            // promptにloginを指定するとサインイン済みの場合は無駄に再認証しない
            prompt: 'login'
        }).then(function (userUpdate) {
            // リクエストが成功した場合はAWS認証オブジェクトを更新する
            // 最初のサインインで既に生成しているため、credentialsを取得する
            var creds = AWS.config.credentials;
            // 新しいトークンを設定
            var newToken = userUpdate.getAuthResponse().id_token;
            creds.params.Logins['accounts.google.com'] = newToken;
            // アプリケーション側でAWS設定を更新する
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