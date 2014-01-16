describe('Unit testing btIconifiednumber', function() {
    var $compile;
    var $rootScope;
 
    // Load the myApp module, which contains the directive
    beforeEach(module('blacktiger-ui'));
 
    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function(_$compile_, _$rootScope_){
      // The injector unwraps the underscores (_) from around the parameter names when matching
      $compile = _$compile_;
      $rootScope = _$rootScope_; 
    }));
    
    it('Adds a computer icon for computer numbers', function() {
        // Compile a piece of HTML containing the directive
        var element = $compile('<bt-iconifiednumber number="PC-+4512341234"></bt-iconifiednumber>')($rootScope);
        // fire all the watches, so the scope expression {{1 + 1}} will be evaluated
        $rootScope.$digest();
        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<span class="glyphicon glyphicon-hdd"></span> +4512341234');
    });
});

