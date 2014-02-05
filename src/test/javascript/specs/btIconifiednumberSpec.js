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
        var element = $compile('<bt-iconifiednumber number="#1234"></bt-iconifiednumber>')($rootScope);
        $rootScope.$digest();

        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<span class="glyphicon glyphicon-hdd"></span> #1234');
    });
    
    it('Adds a phone icon for non-computer numbers', function() {
        // Compile a piece of HTML containing the directive
        var element = $compile('<bt-iconifiednumber number="+4512341234"></bt-iconifiednumber>')($rootScope);
        $rootScope.$digest();

        // Check that the compiled element contains the templated content
        expect(element.html()).toContain('<span class="glyphicon glyphicon-earphone"></span> +4512341234');
    });
});

