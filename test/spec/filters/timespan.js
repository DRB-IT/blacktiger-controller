'use strict';

describe('Filter: timespan', function () {

    // load the filter's module
    beforeEach(module('blacktiger-filters'), function ($provide) {
        $provide.value('CONFIG', {});
    });

    // initialize a new instance of the filter before each test
    var timespan;
    beforeEach(inject(function ($filter) {
        timespan = $filter('timespan');
    }));

    it('should show the timespan specified as 60000 milliseconds as 0:01)', function () {
        expect(timespan(60000)).toBe('0:01');
    });

    it('should show the timespan specified as 120000 milliseconds as 0:02', function () {
        expect(timespan(120000)).toBe('0:02');
    });

    it('should show the timespan specified as 600000 milliseconds as 0:10', function () {
        expect(timespan(600000)).toBe('0:10');
    });

    it('should show the timespan specified as 3600000 milliseconds as 1:00', function () {
        expect(timespan(3600000)).toBe('1:00');
    });

    it('should show the timespan specified as 36000000 milliseconds as 10:00', function () {
        expect(timespan(36000000)).toBe('10:00');
    });

});
