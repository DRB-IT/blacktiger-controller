describe('Unit testing btMeeting', function() {
    var $compile;
    var $rootScope;

    beforeEach(module('blacktiger-templates'));
    beforeEach(module('blacktiger-ui'));

    beforeEach(inject(function(_$compile_, _$rootScope_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    }));

   
    it('shows warning that no participants are in the room when empty', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.WARNINGS.NO_PARTICIPANTS_AND_TRANSMITTERS')
        console.log(element.html());
        expect(index).toBeGreaterThan(0);
    });
    
    it('has an information in the first line of the table about no participants when empty.', function() {
        var element = $compile('<bt-meeting-room room="H45-0000"></bt-meeting-room>')($rootScope);
        $rootScope.$digest();

        var index = element.html().indexOf('PARTICIPANTS.INFO.NO_PARTICIPANTS')
        expect(index).toBeGreaterThan(0);
    });

});
