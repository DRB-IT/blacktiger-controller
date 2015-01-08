'use strict';

describe('Directive: roomStatus', function () {

  // load the directive's module
  beforeEach(module('blacktiger-app'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<bt-room-status></bt-room-status>');
    element = $compile(element)(scope);
    //expect(element.text()).toBe('this is the roomStatus directive');
  }));
});
