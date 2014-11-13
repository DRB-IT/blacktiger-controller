describe('Unit testing btMeeting', function() {
    var $compile;
    var $rootScope;
    var meetingSvc;
    
    beforeEach(module('blacktiger-templates'));
    beforeEach(module('blacktiger-ui', function($provide) {
        $provide.constant('CONFIG', {});
    }));

    beforeEach(inject(function(_$compile_, _$rootScope_, _MeetingSvc_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      meetingSvc = _MeetingSvc_;
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
   
    it('shows warning that no participants are in the room when empty', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.WARNINGS.NO_PARTICIPANTS_AND_TRANSMITTERS')
        expect(index).toBeGreaterThan(0);
    });
    
    it('has an information in the first line of the table about no participants when empty.', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.INFO.NO_PARTICIPANTS')
        expect(index).toBeGreaterThan(0);
    });
    
    it('has room in scope when conference has started before directive is initialized', function() {
        var room = {
            id:'H45-0000'
        };
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var scope = element.isolateScope();
        expect(scope.room).toEqual(room);
    });
    
    it('has room in scope when conference has started after directive is initialized', function() {
        var room = {
            id:'H45-0000'
        };
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var scope = element.isolateScope();
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        expect(scope.room).toEqual(room);
    });
    
    
    it('shows a warning when there are participants but no host', function() {
        var room = {
            id:'H45-0000'
        };
        var participant = {
            type: 'Sip',
            callerId: 'L00000000',
            phoneNumber: '4522334455',
            name: 'John Doe',
            channel: 'SIP__1234',
            host:false
        };
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        $rootScope.$broadcast('PushEvent.Join', room.id, participant);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.WARNINGS.PARTICIPANTS_BUT_NO_TRANSMITTER_TITLE')
            expect(index).toBeGreaterThan(0);
    });
    
    it('shows host info when conference has one', function() {
        var room = {
            id:'H45-0000'
        };
        var participant = {
            type: 'Sip',
            callerId: 'L00000000',
            phoneNumber: '4522334455',
            name: 'John Doe',
            channel: 'SIP__1234',
            host:true
        };
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        $rootScope.$broadcast('PushEvent.Join', room.id, participant);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('<!-- HOST INFO -->')
        console.log(element.html());
        expect(index).toBeGreaterThan(0);
    });
    

});
