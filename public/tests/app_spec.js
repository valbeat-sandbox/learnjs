describe('LearnJS', function() {
    describe('changing views', function () {
        it('can show the landing view when there is no hash', function(){
            learnjs.showView('');
            expect($('.view-container .landing-view').length).toEqual(1);
        });
        it('can show a problem view', function(){
            learnjs.showView('#problem-1');
            expect($('.view-container .problem-view').length).toEqual(1);
        });
        it('can show the profile view',function () {
            learnjs.showView('#profile');
            expect($('.view-container .profile-view').length).toEqual(1);
        });
        // if add routes, then add test here

        it('triggers removingView event when removing the view', function() {
            spyOn(learnjs, 'triggerEvent');
            learnjs.showView('#problem-1');
            expect(learnjs.triggerEvent).toHaveBeenCalledWith('removingView',[]);
        });
    });
    describe('problem View',function () {
        it('passes the hash view parameter to the view function', function(){
            spyOn(learnjs, 'problemView');
            learnjs.showView('#problem-42');
            expect(learnjs.problemView).toHaveBeenCalledWith('42');
        });
        it('has a title that include the problem number', function(){
            var view = learnjs.problemView('1');
            expect(view.find('.title').text()).toEqual('Problem #1 Coming soon!');
        });
        it('show the description', function() {
            var view = learnjs.problemView('1');
            expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
        });
        it('shows the problem code', function () {
            var view = learnjs.problemView('1');
            expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
        });
        it('invoke the router when loaded',function() {
            spyOn(learnjs, 'showView');
            learnjs.appOnReady();
            expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
        });
        it('subscribes to the hash change event', function() {
            learnjs.appOnReady();
            spyOn(learnjs, 'showView');
            $(window).trigger('hashchange');
            expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
        });
    });

    describe('answer section', function(){
        it('can check a correct answer', function () {
            var problemData = learnjs.problems[0];
            expect(learnjs.checkAnswer(problemData,'true')).toEqual(true);
        });
        it('show final problem link to randing page', function () {
            var problemNum = learnjs.problems.length;
            var view = learnjs.buildCorrectFlash(problemNum);
            expect(view.find('a').attr('href')).toEqual('');
        });
        it('can check a correct answer by hitting a button', function () {
            var view = learnjs.problemView('1');
            view.find('.answer').val('true');
            view.find('.check-btn').click();
            expect(view.find('.result span').text()).toEqual('Correct!');
            expect(view.find('.result a').attr('href')).toEqual('#problem-2');
        });
        it('rejects an incorrect answer', function() {
            var view = learnjs.problemView('1');
            view.find('.answer').val('false');
            view.find('.check-btn').click();
            expect(view.find('.result').text()).toEqual('Incorrect!');
        });
    });

    describe('awsRefresh',function() {
        var callbackArg, fakeCredentials;
        beforeEach(function () {
            fakeCredentials = jasmine.createSpyObj('creds', ['refresh']);
            fakeCredentials.identityId = 'COGNITO_ID';
            AWS.config.credentials = fakeCredentials;
            fakeCredentials.refresh.and.callFake(function (cb) {
                cb(callbackArg);
            });
        });

        it('returns a promise that resolves on success', function (done) {
            learnjs.awsRefresh().then(function (id) {
                expect(fakeCredentials.identityId).toEqual('COGNITO_ID');
            }).then(done, fail);
        });

        it('rejects the promise on a fail', function (done) {
            callbackArg = 'error';
            learnjs.awsRefresh().fail(function (err) {
                expect(err).toEqual('error');
                done();
            });
        });
    });
});

