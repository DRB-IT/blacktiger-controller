describe('Unit testing LoginSvc', function() {
    var $compile;
    var $rootScope;
    var LoginSvc;
    var $httpBackend;
    var $cookieStore;

    beforeEach(module('blacktiger-service'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _LoginSvc_, _$httpBackend_, _$cookieStore_){
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        LoginSvc = _LoginSvc_;
        $httpBackend = _$httpBackend_;
        $cookieStore = _$cookieStore_;
    }));

    it('sends an authentication request with username and password', function() {
        $httpBackend.expectPOST('system/authenticate', {username: 'johndoe', password: 'doe'}).respond({
            username: 'johndoe',
            authtoken: 'qwerty',
            roles: ['ROLE_USER']
        });

        var user = null;

        runs(function() {
            LoginSvc.authenticate('johndoe', 'doe').then(function(_user_) {
                console.log('Got user after authentication.');
                user = _user_;
            }, function(reason) {
                console.log(reason);
            });
        });

        waitsFor(function() {
            $httpBackend.flush();
            return user != null;
        }, 'The user should be set.', 100);

        runs(function() {
            expect(user).not.toBe(null);
        });
    });

    /*it('sends an authentication request with token from cookieStore', function() {
        $httpBackend.expectPOST('system/authenticate', {authtoken: 'qwerty'}).respond({
            username: 'johndoe',
            authtoken: 'qwerty',
            roles: ['ROLE_USER']
        });

        var user = null;
        var cookieUser = {username:"johndoe", authtoken:"qwerty"};
        $cookieStore.put('user', cookieUser);

        runs(function() {
            console.log("Calling authenticate without arguments");
            LoginSvc.authenticate().then(function(_user_) {
                console.log('Got user after authentication.');
                user = _user_;
            }, function(reason) {
                console.log(reason);
            });
        });

        waitsFor(function() {
            $httpBackend.flush();
            return user != null;
        }, 'The user should be set.', 100);

        runs(function() {
            expect(user).not.toBe(null);
        });
    });*/



});

