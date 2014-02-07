describe('angularjs homepage', function() {
  it('should greet the named user', function() {
    browser.get('http://drb-it.github.io/blacktiger-web');

    var p = protractor.getInstance();
    element(by.model('username')).sendKeys('admin');
    element(by.model('password')).sendKeys('admin');
    p.actions().sendKeys(protractor.Key.TAB).perform();
    p.actions().sendKeys(protractor.Key.TAB).perform();
    p.actions().sendKeys(protractor.Key.ENTER).perform();
    var h3 = element(by.tagName('h3')).getText();
      waits(200);
    expect(h3).toContain('Realtid oversigt');
  });
});