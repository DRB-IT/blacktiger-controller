'use strict';

describe('Directive: btNumberIcon', function () {
    var $compile;
    var $rootScope;

    // Load the myApp module, which contains the directive
    beforeEach(module('blacktiger-directives'));

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$compile_, _$rootScope_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    it('Adds a computer icon for computer numbers', function () {
        // Compile a piece of HTML containing the directive
        var element = $compile('<bt-number-icon type="Sip"></bt-iconifiednumber>')($rootScope);
        $rootScope.$digest();

        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<span class="glyphicon glyphicon-hdd"></span>');
    });

    it('Adds a phone icon for non-computer numbers', function () {
        // Compile a piece of HTML containing the directive
        var element = $compile('<bt-number-icon type="Phone"></bt-iconifiednumber>')($rootScope);
        $rootScope.$digest();

        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<span class="glyphicon glyphicon-earphone"></span>');
    });
});