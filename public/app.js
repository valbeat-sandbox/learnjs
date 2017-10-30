'use strict'

var learnjs = {};

learnjs.appOnReady = function () {
    // attach listener to window object's onhashchange event
    window.onhashchange = function() {
        learnjs.showView(window.location.hash);
    };
    // always executed the first one
    learnjs.showView(window.location.hash);
};

learnjs.problemView = function(problemNumber) {
    var view = $('.templates .problem-view').clone();
    var title = 'Problem #' + problemNumber + ' Coming soon!';
    view.find('.title').text(title);
    return view;
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
