describe('Unit testing SystemSvc', function() {
    var $rootScope;
    var $httpBackend;
    var SystemSvc;

    beforeEach(module('blacktiger-service'));

    beforeEach(inject(function(_$rootScope_, _$httpBackend_, _SystemSvc_){
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        SystemSvc = _SystemSvc_;
    }));

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

