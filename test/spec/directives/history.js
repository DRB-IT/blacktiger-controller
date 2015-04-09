'use strict';

describe('Directive: btHistory', function () {
    var $compile;
    var $rootScope;

    beforeEach(module('blacktiger-templates'));
    beforeEach(module('blacktiger-directives'));

    beforeEach(inject(function (_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));


    it('creates an empty table when no data', function () {
        var element = $compile('<bt-history></bt-history>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('REPORT.NO_ENTRIES');
        expect(index).toBeGreaterThan(0);
    });

    it('contains data when callers hang up', function () {
        var roomId = 'H45-0000';
        var participant = {
            type: 'Sip',
            callerId: 'L00000000',
            phoneNumber: '4522334455',
            name: 'John Doe',
            channel: 'SIP__1234'
        };
        var element = $compile('<bt-history room="H45-0000"></bt-history>')($rootScope);
        $rootScope.$digest();
        var scope = element.isolateScope();
        scope.deleteHistory();

        $rootScope.$broadcast('PushEvent.ConferenceStart', {id: roomId});
        $rootScope.$broadcast('PushEvent.Join', roomId, participant);
        $rootScope.$digest();
        var index = element.html().indexOf('REPORT.NO_ENTRIES');
        expect(index).toBeGreaterThan(0);

        $rootScope.$broadcast('PushEvent.Leave', roomId, participant.channel);
        $rootScope.$digest();
        index = element.html().indexOf('REPORT.NO_ENTRIES');
        expect(index).toBeLessThan(0);

    });

    it('is empty again after history is deleted', function () {
        var room = 'H45-0000';
        var participant = {
            type: 'Sip',
            callerId: 'L00000000',
            phoneNumber: '4522334455',
            name: 'John Doe',
            channel: 'SIP__1234'
        };
        var element = $compile('<bt-history room="H45-0000"></bt-history>')($rootScope);
        $rootScope.$digest();

        $rootScope.$broadcast('PushEvent.ConferenceStart', {id: room});
        $rootScope.$broadcast('PushEvent.Join', room, participant);
        $rootScope.$broadcast('PushEvent.Leave', 'H45-0000', participant.channel);
        var scope = element.isolateScope();
        scope.deleteHistory();
        $rootScope.$digest();

        var index = element.html().indexOf('REPORT.NO_ENTRIES');
        expect(index).toBeGreaterThan(0);

    });

    it('can handle many entries', function () {
        var room = 'H45-0000';
        var participant = {
            type: 'Sip',
            callerId: 'L00000000',
            phoneNumber: '4522334455',
            name: 'John Doe',
            channel: 'SIP__1234'
        };
        var count = 100;

        var element = $compile('<bt-history room="H45-0000"></bt-history>')($rootScope);
        $rootScope.$digest();

        $rootScope.$broadcast('PushEvent.ConferenceStart', {id: room});
        for (var i = 0; i < count; i++) {
            participant = angular.copy(participant);
            participant.callerId = 'L000000' + i;
            participant.channel = 'SIP__' + i;
            $rootScope.$broadcast('PushEvent.Join', room, participant);
            $rootScope.$broadcast('PushEvent.Leave', room, participant.channel);
        }
        $rootScope.$digest();

        var tbody = element.find('tbody');
        expect(tbody.children().length).toBe(count);


    });
});
