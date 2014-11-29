describe('SettingsCtrl', function () {
    var scope, controller, localStorageService, $httpBackend;
    window.BLACKTIGER_VERSION = null;
    beforeEach(module(function ($provide) {
        $provide.constant('CONFIG', {});
    }));
    
    beforeEach(module('blacktiger-app', function($provide) {
        $provide.constant('CONFIG', {});
    }));

    beforeEach(inject(function ($rootScope, $controller, _localStorageService_, _$httpBackend_) {
        scope = $rootScope.$new();
        localStorageService = _localStorageService_;
        $httpBackend = _$httpBackend_;
        controller = $controller(SettingsCtrl, {
            '$scope': scope
        });
    }));
    
    it('has logout function', function() {
        expect(scope.logout).toBeDefined();
    });
    
    it('has information about whether device can disconnect calls', function() {
        expect(scope.canDisconnectCalls).toBeDefined();
    });
    
    it('can save information about whether device can disconnect calls', function() {
        $httpBackend.whenGET(function() {return true;}).respond({});
        scope.canDisconnectCalls = "True";
        scope.$digest();
        
        expect(localStorageService.get('CanDisconnectCalls')).toEqual("True");
    });
    
});