describe('SettingsCtrl', function () {
    var scope,
    controller;
    window.BLACKTIGER_VERSION = null;
    beforeEach(module(function ($provide) {
        $provide.constant('CONFIG', {});
    }));
    
    beforeEach(module('blacktiger-app', function($provide) {
        $provide.constant('CONFIG', {});
    }));

    beforeEach(inject(function ($rootScope, $controller) {
        scope = $rootScope.$new();
        controller = $controller(SettingsCtrl, {
            '$scope': scope
        });
    }));
    
    it('has logout function', function() {
        expect(scope.logout).toBeDefined();
    });
    
    
});