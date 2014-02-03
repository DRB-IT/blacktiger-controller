describe('Unit testing RoomSvc', function() {
    var RoomSvc;
    var $httpBackend;

    beforeEach(module('blacktiger-service'));

    beforeEach(inject(function(_RoomSvc_, _$httpBackend_){
        RoomSvc = _RoomSvc_;
        $httpBackend = _$httpBackend_;
    }));

    it('retreives roomids', function() {
        $httpBackend.expectGET('rooms').respond(['09991', '09992']);

        var ids = null;

        runs(function() {
            RoomSvc.getRoomIds().then(function(data) {
                console.log('Got room ids.');
                ids = data;
            }, function(reason) {
                console.log(reason);
            });
        });

        waitsFor(function() {
            $httpBackend.flush();
            return ids != null;
        }, 'The ids should be set.', 100);

        runs(function() {
            expect(ids[0]).toBe('09991');
            expect(ids[1]).toBe('09992');
            expect(ids.length).toBe(2);
        });
    });

    it('retreives room objects', function() {
        $httpBackend.expectGET('rooms?mode=full').respond([{
                id: 'DK-9000-2',
                name: 'DK-9000-1 Aalborg, sal 2',
                contact: {
                    name: 'John Doe',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                participants: [
                ]
            }]);

        var rooms = null;

        runs(function() {
            RoomSvc.getRooms().then(function(data) {
                console.log('Got rooms.');
                rooms = data;
            }, function(reason) {
                console.log(reason);
            });
        });

        waitsFor(function() {
            $httpBackend.flush();
            return rooms != null;
        }, 'The rooms should be set.', 100);

        runs(function() {
            expect(rooms[0].id).toBe('DK-9000-2');
            expect(rooms[0].name).toBe('DK-9000-1 Aalborg, sal 2');
            expect(rooms[0].contact.name).toBe('John Doe');
            expect(rooms[0].participants.length).toBe(0);
            expect(rooms.length).toBe(1);
        });
    });

    it('retreives specific room object', function() {
        $httpBackend.expectGET('rooms/DK-9000-2').respond({
                id: 'DK-9000-2',
                name: 'DK-9000-1 Aalborg, sal 2',
                contact: {
                    name: 'John Doe',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                participants: [
                ]
            });

        var room = null;

        runs(function() {
            RoomSvc.getRoom('DK-9000-2').then(function(data) {
                console.log('Got room.');
                room = data;
            }, function(reason) {
                console.log(reason);
            });
        });

        waitsFor(function() {
            $httpBackend.flush();
            return room != null;
        }, 'The room should be set.', 100);

        runs(function() {
            expect(room.id).toBe('DK-9000-2');
            expect(room.name).toBe('DK-9000-1 Aalborg, sal 2');
            expect(room.contact.name).toBe('John Doe');
            expect(room.participants.length).toBe(0);
        });
    });


});

