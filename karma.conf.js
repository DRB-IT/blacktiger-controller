// Karma configuration
// Generated on Thu Jan 16 2014 16:52:53 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'src/main/webapp/assets/js/**/angular.js',
      'src/main/webapp/assets/js/**/angular-cookies.js',
      'src/main/webapp/assets/js/**/angular-resource.js',
      'src/main/webapp/assets/js/**/angular-local-storage.js',
      'src/main/webapp/assets/js/**/angular-route.js',
      'src/main/webapp/assets/js/**/angular-translate.js',
      'src/main/webapp/assets/js/**/angular-translate-loader-static-files.min.js',
      'src/main/webapp/assets/js/messageformat/messageformat.js',
      'src/main/webapp/assets/js/messageformat/locale/*.js',
      'src/main/webapp/assets/js/**/angular-translate-interpolation-messageformat.js',
      'src/main/webapp/assets/js/**/ui-bootstrap.js',
      'src/main/webapp/assets/js/**/ui-bootstrap-tpls.js',
      'src/main/webapp/assets/js/**/angular-mocks.js',
      'src/main/webapp/assets/js/blacktiger-app.js',
      'src/main/webapp/assets/js/blacktiger-ui.js',
      'src/main/webapp/assets/js/blacktigerjs/dist/blacktiger.js',
      'src/main/webapp/assets/js/**/sockjs.js',
      'src/main/webapp/assets/js/**/stomp.js',
      'src/main/webapp/assets/js/**/tel.js',
      'src/main/webapp/assets/js/**/metadatalite.js',
      'src/test/javascript/specs/*.js',
      'src/main/webapp/assets/templates/*.html'
    ],


    // list of files to exclude
    exclude: [
      '**/angular-websocket.js'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],

    preprocessors : {
      'src/main/webapp/assets/templates/*.html': ['ng-html2js']
      
    },

    // optionally, configure the reporter
    coverageReporter: {
      type : 'html',
      dir : 'target/coverage/'
    },
    
    ngHtml2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'src/main/webapp/',
      //stripSufix: '.ext',
      // prepend this to the
      //prependPrefix: 'assets/templates',

      // or define a custom transform function
      /*cacheIdFromPath: function(filepath) {
        return cacheId;
      },*/

      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('foo')
      moduleName: 'blacktiger-templates'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
