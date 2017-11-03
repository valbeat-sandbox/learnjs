learnjs.formatCode = function (obj) {
    return obj;
};

function formatProblems() {
    return learnjs.problems.map(learnjs.formatCode);
}

describe('formatProblems', function () {
    beforeEach(function () {
        spyOn(learnjs, 'formatCode').and.callFake(function(problem){
            return {
                code: 'formatted',
                name: problem.name
            };
        });
    });

    it('aplies a formatter to all the problems', function () {
        expect(formatProblems()[0].code).toEqual('formatted');
    });
});