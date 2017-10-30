'use strict'

var learnjs = {};

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
        '#problem' : learnjs.problemView
    };
    // [0] => #action, [1] => problemNumber
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
};

learnjs.problemView = function(data) {
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var title = 'Problem #' + problemNumber + ' Coming soon!';
    view.find('.title').text(title);
    learnjs.applyObject(learnjs.problems[problemNumber - 1], view);
    return view;
};

learnjs.applyObject = function(obj, elm) {
    for (var key in obj) {
        elm.find('[data-name="'+ key + '"]').text(obj[key]);
    }
};