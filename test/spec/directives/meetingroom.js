'use strict';

describe('Directive: btMeetingRoom', function () {
    var $compile;
    var $rootScope;
    var meetingSvc;
    var historySvc;
    var localStorageService;
    
    beforeEach(module('blacktiger-templates'));
    beforeEach(module('blacktiger-directives', function($provide) {
        $provide.constant('CONFIG', {});
    }));

    beforeEach(inject(function(_$compile_, _$rootScope_, _MeetingSvc_, _HistorySvc_, _localStorageService_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      meetingSvc = _MeetingSvc_;
      historySvc = _HistorySvc_;
      localStorageService = _localStorageService_;
    }));

    it('shows warning that no participants are in the room when empty', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.WARNINGS.NO_PARTICIPANTS_AND_TRANSMITTERS');
        expect(index).toBeGreaterThan(0);
    });
    
    it('has an information in the first line of the table about no participants when empty.', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.INFO.NO_PARTICIPANTS');
        expect(index).toBeGreaterThan(0);
    });
    
    it('has info about participants when there are some in the room', function() {
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

        var index = element.html().indexOf('PARTICIPANTS.INFO.NO_PARTICIPANTS');
        expect(index).toBeLessThan(0);
        
        var tbody = element.find('tbody');
        var tds = tbody.find('td');
        var number = tds[0].textContent.trim();
        var name = tds[1].textContent.trim();
        var calls = parseInt(tds[2].textContent.trim());
        var minutes = parseInt(tds[3].textContent.trim());
        
        expect(number).toEqual('+45 22 33 44 55');
        expect(name.indexOf('John Doe')).toBe(0);
        expect(calls).toEqual(1);
        expect(minutes).toEqual(0);
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
    
    it('can get total number of minutes for a participant', function() {
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
        var scope = element.isolateScope();
        
        expect(scope.getTotalDuration(participant)).toBeGreaterThan(0);
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
        
        var index = element.html().indexOf('PARTICIPANTS.WARNINGS.PARTICIPANTS_BUT_NO_TRANSMITTER_TITLE');
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
        var index = element.html().indexOf('<!-- HOST INFO -->');
        expect(index).toBeGreaterThan(0);
    });
    
    it('shows host disconnect link when devices is allowed to disconnect calls', function() {
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
        
        localStorageService.add('CanDisconnectCalls', 'True');
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        $rootScope.$broadcast('PushEvent.Join', room.id, participant);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var index = element.html().indexOf('<!-- DISCONNECT HOST LINK -->');
        expect(index).toBeGreaterThan(0);
    });
    
    it('does not show host disconnect link when devices is NOT allowed to disconnect calls', function() {
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
        
        localStorageService.add('CanDisconnectCalls', 'False');
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        $rootScope.$broadcast('PushEvent.Join', room.id, participant);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var index = element.html().indexOf('<!-- DISCONNECT HOST LINK -->');
        expect(index).toBeLessThan(0);
    });
    
    it('shows disconnect participant link when devices is allowed to disconnect calls', function() {
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
        
        localStorageService.add('CanDisconnectCalls', 'True');
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        $rootScope.$broadcast('PushEvent.Join', room.id, participant);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var index = element.html().indexOf('<!-- DISCONNECT PARTICIPANT LINK -->');
        expect(index).toBeGreaterThan(0);
    });
    
    it('does NOT show disconnect participant link when devices is NOT allowed to disconnect calls', function() {
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
        
        localStorageService.add('CanDisconnectCalls', 'False');
        
        $rootScope.$broadcast('PushEvent.ConferenceStart', room);
        $rootScope.$broadcast('PushEvent.Join', room.id, participant);
        
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var index = element.html().indexOf('<!-- DISCONNECT PARTICIPANT LINK -->');
        expect(index).toBeLessThan(0);
    });
    
    it('shows decent information event when room does not exist', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();
        var scope = element.isolateScope();
        
        expect(scope.room).not.toBe(null);
        expect(scope.room).not.toBe(undefined);
        expect(scope.room.participants.length).toBe(0);
    });
    

});

