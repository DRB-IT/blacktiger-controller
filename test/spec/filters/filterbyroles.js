'use strict';

describe('Filter: filterByRoles', function () {

  // load the filter's module
  beforeEach(module('blacktiger-app'));

  // initialize a new instance of the filter before each test
  var filterByRoles;
  beforeEach(inject(function ($filter) {
    filterByRoles = $filter('filterByRoles');
  }));

  it('should return the input prefixed with "filterByRoles filter:"', function () {
    var text = 'angularjs';
    expect(filterByRoles(text)).toBe('filterByRoles filter: ' + text);
  });

});
