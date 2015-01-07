'use strict';

describe('Filter: timespan', function () {

  // load the filter's module
  beforeEach(module('blacktiger-app'));

  // initialize a new instance of the filter before each test
  var timespan;
  beforeEach(inject(function ($filter) {
    timespan = $filter('timespan');
  }));

  it('should return the input prefixed with "timespan filter:"', function () {
    var text = 'angularjs';
    expect(timespan(text)).toBe('timespan filter: ' + text);
  });

});
