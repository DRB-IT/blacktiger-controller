'use strict';

describe('Directive: input[name]', function () {
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

    it('It validates valid names', function () {
        var validNames = [
            'Jens Jensen',
            'Jens la Cour',
            'Milton Madsen jr.',
            'Milton jr. Madsen',
            'Jens bo',
            'Jørgen årup',
            'Günther von Larsen',
            'JOSÉ Gonzáles'];
        
        angular.forEach(validNames, function(currentName) {
            $rootScope.name = currentName;
            var element = $compile('<form name="myform"><input name="name" type="name" ng-model="name"></form>')($rootScope);
            element = element.find('input');
            $rootScope.$digest();

            expect(element.val()).toContain(currentName);
            expect($rootScope.myform.name.$valid).toEqual(true);

            element.val(currentName);
            element.triggerHandler('change');
            $rootScope.$digest();

            expect($rootScope.myform.name.$valid).toEqual(true);
            expect($rootScope.name).toEqual(currentName);
        });
        
    });
    
    it('It invalidates invalid names', function () {
        var invalidNames = [
            'Jens J.',
            'Jens J',
            'Jens',
            'Mr. Milton Madsen'];
        
        angular.forEach(invalidNames, function(currentName) {
            $rootScope.name = currentName;
            var element = $compile('<form name="myform"><input name="name" type="name" ng-model="name"></form>')($rootScope);
            element = element.find('input');
            $rootScope.$digest();

            expect(element.val()).toContain(currentName);
            expect($rootScope.myform.name.$valid).toEqual(false);

            element.val(currentName);
            element.triggerHandler('change');
            $rootScope.$digest();

            expect($rootScope.myform.name.$valid).toEqual(false);
            expect($rootScope.name).toEqual(currentName);
        });
        
    });
    
        

});