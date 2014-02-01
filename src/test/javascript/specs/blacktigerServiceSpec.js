describe('Unit testing blacktiger service', function() {
    var $compile;
    var $rootScope;
    var LoginSvc;
    var $httpBackend;
    var $cookieStore;
    var SystemSvc;

    beforeEach(module('blacktiger-service'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _LoginSvc_, _$httpBackend_, _$cookieStore_, _SystemSvc_){
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        LoginSvc = _LoginSvc_;
        $httpBackend = _$httpBackend_;
        $cookieStore = _$cookieStore_;
        SystemSvc = _SystemSvc_;
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

    it('retreives system information.', function() {
        $httpBackend.expectGET('system/information').respond({
            cores: 24,
            load: {
                disk: 25.0,
                memory: 22.0,
                cpu: 0.3,
                net: 4.9
            },
            averageCpuLoad: {
                oneMinute: 0.1,
                fiveMinutes: 0.3,
                tenMinutes: 2.0
            }
        });

        var info = null;

        runs(function() {
            SystemSvc.getSystemInfo().then(function(_info_) {
                console.log('Got system info.');
                info = _info_;
            });
        });

        waitsFor(function() {
            $httpBackend.flush();
            return info != null;
        }, 'The info should be set.', 100);

        runs(function() {
            expect(info).not.toBe(null);
        });
    });



});

