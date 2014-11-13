    describe('Unit testing AutoCommentRequestCancelSvc', function() {
    var $rootScope;
    var autoCommentRequestCancelSvc;
    var $timeout;
    var timeout = 100;

    beforeEach(module('blacktiger-service', function($provide) {
        $provide.value('CONFIG', {
            commentRequestTimeout: timeout
        });
    }));
    
    beforeEach(inject(function(_$rootScope_, _AutoCommentRequestCancelSvc_, _$timeout_){
        autoCommentRequestCancelSvc = _AutoCommentRequestCancelSvc_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        
        autoCommentRequestCancelSvc.start();
    }));
    
    afterEach(inject(function ($log) {
        // dump log output in case of test failure
        if (this.results().failedCount) {
            var out = [];
            angular.forEach(["log", "info", "warn", "error", "debug"], function (logLevel) {
                var logs = $log[logLevel].logs;
                if (!logs.length)
                    return;
                out.push(["*** " + logLevel + " ***"]);
                out.push.apply(out, logs);
                out.push(["*** /" + logLevel + " ***"]);
            });
            if (out.length) {
                console.log("*** logs for: " + this.description + " ***");
                angular.forEach(out, function (items) {
                    console.log.apply(console, items);
                });
            }
        }
        $log.reset();
    }));

    it('emits a CommentRequestCancelEvent after timeout', function() {
        var room = 'H45-0000';
        var channel = 'SIP___1234';
        var cancelReceived = false;
        
        $rootScope.$on("PushEvent.CommentRequestCancel", function() {
           cancelReceived = true; 
        });
        
        $rootScope.$broadcast('PushEvent.CommentRequest', room, channel);
        $timeout.flush();
        
        expect(cancelReceived).toBe(true);
        
    });

});
