describe('Unit testing MeetingSvc', function() {
    var $rootScope;
    var $httpBackend;
    var MeetingSvc;
    var RoomSvc;
    var $timeout;

    beforeEach(module('blacktiger-service'));
    beforeEach(module(function($logProvider, blacktigerProvider) {
        blacktigerProvider.setForceLongPolling(true);
        $logProvider.debugEnabled = true;
    }));
    
    beforeEach(inject(function(_$rootScope_, _$httpBackend_, _MeetingSvc_, _RoomSvc_, _$timeout_, blacktiger){
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        MeetingSvc = _MeetingSvc_;
        RoomSvc = _RoomSvc_;
        $timeout = _$timeout_;
        
    }));

    
    
    it('accepts Join event.', function() {
        var room = {
                id: 'DK-9000-2',
                name: 'DK-9000-1 Aalborg, sal 2',
                contact: {
                    name: 'John Doe',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                
            };
        
        var participants = [];
        
        var participant = {
                        userId: 1,
                        muted: false,
                        host: true,
                        phoneNumber: 'PC-xxxxxxxx',
                        dateJoined: 1349333576093,
                        name: 'Testsal',
                        commentRequested: false
                    };
        
        var eventQueue = [];
        var onEventRequest = function() {
            var events = eventQueue;
            eventQueue = [];
            console.log('Events request [' + events.length + ']');
            
            return [200, {timestamp:new Date().getTime(),events:events}];
        };
        
        var event = null;
        
        $rootScope.$on('MeetingSvc.Join', function(e, participant){
            event = e;
        });
        
        $httpBackend.expectGET("http://localhost:8080/rooms/DK-9000-2/participants").respond(participants);
        $httpBackend.expectGET(/http:\/\/localhost:8080\/events\?room=DK-9000-.?/).respond(onEventRequest);
        
        console.log("Setting room on MeetingSvc");
        MeetingSvc.setRoom(room);
        $httpBackend.flush();
        
        console.log("Pushing Join event");
        eventQueue.push({type:'Join', participant:participant});
        
        $httpBackend.expectGET(/http:\/\/localhost:8080\/events\?room=DK-9000-.?/).respond(onEventRequest);
        $timeout.flush();
        $httpBackend.flush();
            
        expect(MeetingSvc.getParticipantList().length).toBe(1);
        expect(event).not.toBe(null);
        
    });
    
    it('accepts Leave event.', function() {
        var room = {
                id: 'DK-9000-2',
                name: 'DK-9000-1 Aalborg, sal 2',
                contact: {
                    name: 'John Doe',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                
            };
        
        var participants = [{
                        userId: 1,
                        muted: false,
                        host: true,
                        phoneNumber: 'PC-xxxxxxxx',
                        dateJoined: 1349333576093,
                        name: 'Testsal',
                        commentRequested: false
                    }];
        
        var eventQueue = [];
        var onEventRequest = function() {
            var events = eventQueue;
            eventQueue = [];
            console.log('Events request [' + events.length + ']');
            
            return [200, {timestamp:new Date().getTime(),events:events}];
        };
        
        var event = null;
        
        $rootScope.$on('MeetingSvc.Leave', function(e, participant){
            event = e;
        });
        
        $httpBackend.expectGET("http://localhost:8080/rooms/DK-9000-2/participants").respond(participants);
        $httpBackend.expectGET(/http:\/\/localhost:8080\/events\?room=DK-9000-.?/).respond(onEventRequest);
        
        console.log("Setting room on MeetingSvc");
        MeetingSvc.setRoom(room);
        $httpBackend.flush();
        
        console.log("Pushing Leave event");
        eventQueue.push({type:'Leave', participantId:participants[0].userId});
        
        $httpBackend.expectGET(/http:\/\/localhost:8080\/events\?room=DK-9000-.?/).respond(onEventRequest);
        $timeout.flush();
        $httpBackend.flush();
            
        expect(MeetingSvc.getParticipantList().length).toBe(0);
        expect(event).not.toBe(null);
        
    });
});

