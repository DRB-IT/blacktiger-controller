'use strict';

describe('Filter: filterByRoles', function () {

    // load the filter's module
    beforeEach(module('blacktiger-filters'));

    // initialize a new instance of the filter before each test
    var filterByRoles;
    beforeEach(inject(function ($filter) {
        filterByRoles = $filter('filterByRoles');
    }));

    it('should return 2 entries from the array only"', function () {
        var entries = [
            {requiredRole: 'Admin'},
            {requiredRole: 'Dufus'},
            {requiredRole: 'Admin'},
            {requiredRole: 'Dufus'}
        ];
        var roles = ['Admin', 'Nerd'];
        expect(filterByRoles(entries, roles).length).toBe(2);
    });

});
