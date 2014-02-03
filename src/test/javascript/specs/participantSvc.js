describe('Unit testing ParticipantSvc', function() {
    var $rootScope;
    var $httpBackend;
    var Participant;

    beforeEach(module('blacktiger-service'));

    beforeEach(inject(function(_$rootScope_, _$httpBackend_, _ParticipantSvc_){
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        ParticipantSvc = _ParticipantSvc_;
        
        var room = {
                id: 'DK-9000-2',
                name: 'DK-9000-1 Aalborg, sal 2',
                contact: {
                    name: 'John Doe',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                participants: [
                    {
                        userId: 1,
                        muted: false,
                        host: true,
                        phoneNumber: 'PC-xxxxxxxx',
                        dateJoined: 1349333576093,
                        name: 'Testsal',
                        commentRequested: false
                    }
                ]
            };
        
        $rootScope.$broadcast('roomChanged', room);
        
        
    }));

    it('retreives participants.', function() {
        
        waitsFor(function() {
            //$httpBackend.flush();
            
            return ParticipantSvc.getParticipants().length > 0;
        }, 'The participants should have been registered.', 200);

        runs(function() {
           expect(ParticipantSvc.getParticipants().length).toBe(1);
        });
        

    });
});

