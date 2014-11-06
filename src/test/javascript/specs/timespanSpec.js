describe('Unit testing timespan filter', function() {
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
    
    it('should show the timespan specified as 60000 milliseconds as 0:01)', function() {
       inject(function(timespanFilter) {
           expect(timespanFilter(60000)).toBe('0:01');
       });
    });
    
    it('should show the timespan specified as 120000 milliseconds as 0:02', function() {
       inject(function(timespanFilter) {
           expect(timespanFilter(120000)).toBe('0:02');
       });
    });
    
    it('should show the timespan specified as 600000 milliseconds as 0:10', function() {
       inject(function(timespanFilter) {
           expect(timespanFilter(600000)).toBe('0:10');
       });
    });
    
    it('should show the timespan specified as 3600000 milliseconds as 1:00', function() {
       inject(function(timespanFilter) {
           expect(timespanFilter(3600000)).toBe('1:00');
       });
    });
    
    it('should show the timespan specified as 36000000 milliseconds as 10:00', function() {
       inject(function(timespanFilter) {
           expect(timespanFilter(36000000)).toBe('10:00');
       });
    });
});

