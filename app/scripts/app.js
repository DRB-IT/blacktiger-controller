'use strict';

/**
 * @ngdoc overview
 * @name blacktiger-app
 * @description
 * # blacktiger-app
 *
 * Main module of the application.
 */
var blacktigerApp = angular.module('blacktiger-app', [
    'blacktiger-controllers',
    'blacktiger-directives',
    'blacktiger-filters',
    'blacktiger-services',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMessages',
    'pascalprecht.translate',
    'ui.bootstrap',
    'blacktiger',
    'teljs'
]);

blacktigerApp.config(function ($locationProvider, $routeProvider, $httpProvider, $translateProvider, blacktigerProvider, CONFIG) {
    var mode = 'normal',
            token, params = [],
            search, list, elements;

    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('!');

    // SECURITY (forward to login if not authorized)
    $httpProvider.interceptors.push(function ($location, $q) {
        return {
            'responseError': function (rejection) {
                if (rejection.status === 401 && CONFIG.serviceUrl && rejection.config.url.substr(0, CONFIG.serviceUrl.length) === CONFIG.serviceUrl) {
                    $location.path('/login');
                }
                
                return $q.reject(rejection);
            }
        };
    });

    // Find params
    search = window.location.search;
    if (search.length > 0 && search.charAt(0) === '?') {
        search = search.substring(1);
        list = search.split('&');
        angular.forEach(list, function (entry) {
            elements = entry.split('=');
            if (elements.length > 1) {
                params[elements[0]] = elements[1];
            }
        });
    }

    if (CONFIG.serviceUrl) {
        blacktigerProvider.setServiceUrl(CONFIG.serviceUrl);
    }

    if (angular.isDefined(params.token)) {
        mode = 'token';
        token = params.token;
    }

    if (mode === 'normal') {
        $routeProvider.
                when('/', {
                    controller: 'RoomCtrl',
                    templateUrl: 'views/room.html'
                }).
                when('/login', {
                    controller: 'LoginCtrl',
                    templateUrl: 'views/login.html'
                }).
                when('/request_password', {
                    controller: 'RequestPasswordCtrl',
                    templateUrl: 'views/request-password.html'
                }).
                when('/settings', {
                    controller: 'SettingsCtrl',
                    templateUrl: 'views/settings-general.html'
                }).
                when('/settings/contact', {
                    controller: 'ContactCtrl',
                    templateUrl: 'views/settings-contact.html'
                }).
                when('/settings/create-listener', {
                    controller: 'CreateSipAccountCtrl',
                    templateUrl: 'views/settings-create-listener.html'
                }).
                when('/admin/realtime', {
                    controller: 'RealtimeCtrl',
                    templateUrl: 'views/realtime-status.html'
                }).
                when('/admin/history', {
                    controller: 'HistoryCtrl',
                    templateUrl: 'views/system-history.html'
                }).
                otherwise({
                    redirectTo: '/'
                });
    }

    if (mode === 'token') {
        $routeProvider.
                when('/', {
                    controller: 'SipAccountRetrievalCtrl',
                    templateUrl: 'views/sipaccount-retrieve.html',
                    resolve: {
                        token: function () {
                            return token;
                        }
                    }
                }).
                otherwise({
                    redirectTo: '/'
                });
    }

    // Prepare data for translateProvider
    var languageKeys = Object.keys(CONFIG.i18n.languages);
    var languageMapping = {};
    angular.forEach(CONFIG.i18n.languages, function(value, key) {
        if(value !== CONFIG.i18n.fallbackLanguage) {
            if(angular.isArray(value.aliases)) {
                angular.forEach(value.aliases, function(alias) {
                   languageMapping[alias+'*', value] 
                });
            }

            languageMapping[value+'*', value];
        }
    });
    
    if(angular.isDefined(CONFIG.i18n.fallbackLanguage)) {
        languageMapping['*', CONFIG.i18n.fallbackLanguage];
    }

    $translateProvider.useStaticFilesLoader({
        prefix: 'scripts/i18n/blacktiger-locale-',
        suffix: '.json'
    });

    $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
    $translateProvider.registerAvailableLanguageKeys(languageKeys, languageMapping);
    /*$translateProvider.registerAvailableLanguageKeys(['en', 'da', 'es', 'no', 'sv', 'is', 'fo', 'kl'], {
        'no*': 'no',
        'nb*': 'no',
        'nn*': 'no',
        'da*': 'dk',
        'es*': 'es',
        'sv*': 'sv',
        'is*': 'is',
        'fo*': 'fo',
        'kl*': 'kl',
        '*': 'en'
    });*/
    $translateProvider.determinePreferredLanguage(function () {
        var language;
        if (navigator && navigator.languages) {
            language = navigator.languages[0];
        } else {
            language = window.navigator.userLanguage || window.navigator.language;
            language = language.split('-');
            language = language[0];
        }
        return language;
    });
});

blacktigerApp.run(function (CONFIG, blacktiger, $location, LoginSvc, $rootScope, PushEventSvc, MeetingSvc, AutoCommentRequestCancelSvc, $log, $interval, $window, translateFilter) {
    
    // Make sure we have a digest at least once a minute - it will make things like minute counters update
    $interval(angular.noop, 60000);
    
    // The context object is a holder of information for the current session
    $rootScope.context = {};
    $rootScope.context.hasContactInformation = function () {
        var room = $rootScope.context.room;
        return room && !(!room.contact.name || room.contact.name === '' ||
                !room.contact.email || room.contact.email === '' ||
                !room.contact.phoneNumber || room.contact.phoneNumber === '');
    };

    if (CONFIG.serviceUrl) {
        blacktiger.setServiceUrl(CONFIG.serviceUrl);
    }

    LoginSvc.authenticate().then(angular.noop, function () {
        $location.path('login');
    });

    $rootScope.$on('afterLogout', function () {
        $rootScope.rooms = null;
        $rootScope.updateCurrentRoom();
        PushEventSvc.disconnect();
        $location.path('login');
    });

    $rootScope.$on('login', function (event, user) {
        var targetPath = '';
        if (user.roles.indexOf('ROLE_ADMIN') >= 0) {
            targetPath = '/admin/realtime';
        }
        
        PushEventSvc.connect({enforcedHeartbeatInterval:30000, keepAlive:true}).then(function() {
            $rootScope.updateCurrentRoom();
            $location.path(targetPath);
        }, function() {
            $window.alert(translateFilter('GENERAL.UNABLE_TO_CONNECT'));
        });
    });

    $rootScope.updateCurrentRoom = function () {
        var ids = MeetingSvc.findAllIds();
        if ($rootScope.currentUser && $rootScope.currentUser.roles.indexOf('ROLE_HOST') >= 0 && ids.length > 0) {
            $rootScope.context.room = MeetingSvc.findRoom(ids[0]);
        } else {
            $rootScope.context.room = null;
        }
    };

    $rootScope.$on('PushEventSvc.Lost_Connection', function () {
        $log.info(translateFilter('GENERAL.LOST_CONNECTION'));
    });
    
    $rootScope.$on('PushEventSvc.Reconnecting', function () {
        $log.info('Reconnecting');
    });
    
    $rootScope.$on('PushEventSvc.ReconnectingFailed', function () {
        $log.info('Reconnecting failed.');
    });

    $rootScope.$watch('context.room', function (room) {
        if (room && !$rootScope.context.hasContactInformation()) {
            $location.path('/settings/contact');
        }
    });

    $rootScope.$on('$locationChangeStart', function () {
        $log.debug('location change started', $location.url());
    });
    $rootScope.$on('$locationChangeSuccess', function () {
        $log.debug('location change ended', $location.url());
    });
    
    AutoCommentRequestCancelSvc.start();
});

/** BOOTSTRAP **/
angular.element(document).ready(function () {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');
    var languageNames = {
        'da': 'Dansk',
        'en': 'English',
        'fo': 'Føroyskt',
        'kl': 'Kalaallisut',
        'sv': 'Svenska',
        'no': 'Norsk',
        'is': 'Íslenska',
        'es': 'Español'
    };
    var defaultConfig = {
        serviceUrl: 'http://192.168.87.104:8084/blacktiger',
        RootHelp: 'http://help.txxxxx.org/{%1}',
        SIPHelp: 'http://help.txxxxx.org/{%1}/homesetup',
        commentRequestTimeout: 60000,
        hightlightTimeout: 15000
    };
                
    var initApp = function(config) {
        blacktigerApp.constant('CONFIG', config);
        blacktigerApp.constant('languages', languageNames);
        angular.bootstrap(document, ['blacktiger-app']);
    };
    $http.get('config.json').then(
            function (response) {
                initApp(response.data);
            },
            function(reason) {
                console.info('Could not load config. Using default config. ' + reason.data);
                initApp(defaultConfig);
            }
    );

});