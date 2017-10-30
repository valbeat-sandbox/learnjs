'use strict'

var learnjs = {};

learnjs.appOnReady = function () {
    learnjs.showView(window.location.hash);
};

learnjs.problemView = function(problemNumber) {
    var title = 'Problem #' + problemNumber + ' Coming soon!';
    return $('<div class="problem-view">').text(title);
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
