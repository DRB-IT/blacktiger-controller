/*jslint browser: true*/
/*global angular, BLACKTIGER_VERSION, $*/

/*************************************** MODULE ********************************************/

var blacktigerApp = angular.module('blacktiger-app', ['ngRoute', 'pascalprecht.translate', 'ui.bootstrap', 'blacktiger-service', 'blacktiger-ui', 'teljs'])
    .config(function ($locationProvider, $routeProvider, $httpProvider, $translateProvider, blacktigerProvider, CONFIG) {
        var mode = "normal",
            token, params = [],
            search, list, url, elements, language, langData;

        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix('!');

        // SECURITY (forward to login if not authorized)
        $httpProvider.interceptors.push(function ($location) {
            return {
                'responseError': function (rejection) {
                    if (rejection.status === 401) {
                        $location.path('/login');
                    }
                    return rejection;
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
            mode = "token";
            token = params.token;
        }

        if (mode === 'normal') {
            $routeProvider.
            when('/', {
                templateUrl: 'assets/templates/room.html'
            }).
            when('/login', {
                controller: LoginCtrl,
                templateUrl: 'assets/templates/login.html'
            }).
            when('/request_password', {
                controller: RequestPasswordCtrl,
                templateUrl: 'assets/templates/request-password.html'
            }).
            when('/settings', {
                controller: SettingsCtrl,
                templateUrl: 'assets/templates/settings-general.html'
            }).
            when('/settings/contact', {
                controller: ContactCtrl,
                templateUrl: 'assets/templates/settings-contact.html'
            }).
            when('/settings/create-listener', {
                controller: CreateSipAccountCtrl,
                templateUrl: 'assets/templates/settings-create-listener.html'
            }).
            when('/admin/realtime', {
                controller: RealtimeCtrl,
                templateUrl: 'assets/templates/realtime-status.html'
            }).
            when('/admin/history', {
                controller: HistoryCtrl,
                templateUrl: 'assets/templates/system-history.html'
            }).
            otherwise({
                redirectTo: '/'
            });
        }

        if (mode === 'token') {
            $routeProvider.
            when('/', {
                controller: SipAccountRetrievalCtrl,
                templateUrl: 'assets/templates/sipaccount-retrieve.html',
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
        

        // REMARK: If BLACKTIGER_VERSION has been set, we will load from a yui-compressed file
        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/js/i18n/blacktiger-locale-',
            suffix: BLACKTIGER_VERSION ? '-' + BLACKTIGER_VERSION + '.json' : '.json'
        });

        language = window.navigator.userLanguage || window.navigator.language;
        langData = language.split("-");
        $translateProvider.preferredLanguage(langData[0]);
        $translateProvider.fallbackLanguage('en');

    }).run(ApplicationBoot)
    .filter('filterByRoles', filterByRoles)
    .controller('MenuCtrl', MenuCtrl)
    .controller('RoomDisplayCtrl', RoomDisplayCtrl)

/*************************************** BOOT ********************************************/
function ApplicationBoot(CONFIG, blacktiger, $location, LoginSvc, $rootScope, PushEventSvc, MeetingSvc, AutoCommentRequestCancelSvc, $log) {
    // The context object is a holder of information for the current session
    $rootScope.context = {};
    
    if (CONFIG.serviceUrl) {
        blacktiger.setServiceUrl(CONFIG.serviceUrl);
    }

    LoginSvc.authenticate().then(angular.noop, function () {
        $location.path('login');
    });

    $rootScope.$on("afterLogout", function () {
        $rootScope.rooms = null;
        $rootScope.updateCurrentRoom();
        $location.path('login');
    });

    $rootScope.$on("login", function (event, user) {
        if (user.roles.indexOf('ROLE_HOST') >= 0) {
           $location.path('');
        } else if (user.roles.indexOf('ROLE_ADMIN') >= 0) {
            $location.path('/admin/realtime');
        }
        
        PushEventSvc.connect().then($rootScope.updateCurrentRoom);
    });
    
    $rootScope.updateCurrentRoom = function () {
        var ids = MeetingSvc.findAllIds();
        if ($rootScope.currentUser && $rootScope.currentUser.roles.indexOf('ROLE_HOST') >= 0 && ids.length > 0) {
            $rootScope.context.room = MeetingSvc.findRoom(ids[0]);
        } else {
            $rootScope.context.room = null;
        }
    };

    $rootScope.$on('MeetingSvc.Initialized', $rootScope.updateCurrentRoom);

    $rootScope.$watch('context.room', function (room) {
        if (room && (!room.contact.name || room.contact.name === '' ||
            !room.contact.email || room.contact.email === '' ||
            !room.contact.phoneNumber || room.contact.phoneNumber === '')) {
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
}

/*************************************** FILTERS ********************************************/
function filterByRoles() {
    return function (input, roles) {
        var out = [];
        angular.forEach(input, function (entry) {
            if (!entry.requiredRole || (roles && roles.indexOf(entry.requiredRole) >= 0)) {
                out.push(entry);
            }
        });
        return out;
    };
}

/*************************************** CONTROLLERS ********************************************/
function MenuCtrl(CONFIG, $scope, LoginSvc, $rootScope, $translate, blacktiger, $filter, $location) {
    $scope.links = [
        {
            url: "#!/",
            name: 'NAVIGATION.PARTICIPANTS',
            icon: 'user',
            requiredRole: 'ROLE_HOST'
        },
        {
            url: "#!/settings",
            name: 'NAVIGATION.SETTINGS',
            icon: 'cog',
            requiredRole: 'ROLE_HOST'
        },
        {
            url: function () {
                var url = CONFIG.RootHelp;
                url = url.replace("{%1}", $scope.language);
                return url;
            },
            name: 'NAVIGATION.HELP',
            icon: 'question-sign',
            requiredRole: 'ROLE_HOST',
            target: '_blank'
        },
        {
            url: "#!/admin/realtime",
            name: 'NAVIGATION.ADMIN.REALTIME',
            icon: 'transfer',
            requiredRole: 'ROLE_ADMIN'
        },
        {
            url: "#!/admin/history",
            name: 'NAVIGATION.ADMIN.HISTORY',
            icon: 'calendar',
            requiredRole: 'ROLE_ADMIN'
        }
    ];

    $scope.getUrl = function (link) {
        if (angular.isFunction(link.url)) {
            return link.url();
        } else {
            return link.url;
        }
    };
    
    $scope.isActiveLink = function(link) {
        var url = $scope.getUrl(link);
        var linkPath = url.substring(2);
        var currentPath = $location.path();
        
        if("/" === currentPath && "/" === linkPath) {
            return true; 
        } else if("/" !== linkPath){
            return linkPath === (currentPath.length > linkPath.length ? currentPath.substring(0, linkPath.length) : currentPath);
        } else {
            return false;
        }
    };

    $scope.languages = [{
        locale: 'da',
        'localizedLanguage': 'Dansk'
    }];

    $scope.$watch('language', function () {
        if ($scope.language !== undefined && $scope.language !== $translate.use()) {
            $translate.use($scope.language);
        }
    });

    $rootScope.$on('$translateChangeSuccess', function () {
        $scope.language = $translate.use();
        $scope.languages = [];
        angular.forEach(['da', 'en', 'fo', 'kl', 'no', 'sv', 'is', 'es'], function (entry) {
            $translate('GENERAL.LANGUAGE.' + entry.toUpperCase()).then(function (translation) {
                $scope.languages.push({
                    locale: entry,
                    localizedLanguage: translation,
                    language: blacktiger.getLanguageNames()[entry]
                });
            });
        });

    });

    $rootScope.$on('PushEventSvc.Lost_Connection', function () {
        alert($filter('translate')('GENERAL.LOST_CONNECTION'));
    });
}

function RoomDisplayCtrl($scope, $location) {
  
    $scope.goToTechContact = function () {
        $location.path("/settings/contact");
    };

}

function LoginCtrl($scope, LoginSvc) {
    $scope.username = "";
    $scope.password = "";
    $scope.rememberMe = false;
    $scope.status = null;

    $scope.login = function () {
        LoginSvc.authenticate($scope.username, $scope.password, $scope.rememberMe).then(function () {
            $scope.status = 'success';
        }, function (reason) {
            $scope.status = "invalid";
        });
    };

}

function RequestPasswordCtrl($scope, $http, blacktiger, $filter, $log, $rootScope) {
    $scope.reset = function () {
        $scope.request = {
            phoneNumber: '',
            phoneNumberOfHall: '',
            emailTextUser: $filter('translate')('REQUEST_PASSWORD.EMAIL_TEXT_USER'),
            emailSubject: $filter('translate')('REQUEST_PASSWORD.EMAIL_SUBJECT'),
            emailTextManager: $filter('translate')('REQUEST_PASSWORD.EMAIL_TEXT_MANAGER')
        };
        $scope.status = null;
    };


    $scope._countryCodeToAreaCode = function (countryCode) {
        var data = i18n.phonenumbers.metadata.countryToMetadata[countryCode.toUpperCase()];
        if (!data) {
            return null;
        } else {
            return data[10];
        }
    };

    $scope._resolveCountryCode = function () {
        var host, hostData, isoCountryCode;

        host = location.host;
        hostData = host.split('.');

        if (hostData.length < 3 || !$scope._countryCodeToAreaCode(hostData[hostData.length - 3])) {
            $log.debug("Unable to resolve countrycode from url. Falling back to 'DK'");
            isoCountryCode = 'dk';
        } else {
            isoCountryCode = hostData[hostData.length - 3];
        }
        $scope.countryCode = $scope._countryCodeToAreaCode(isoCountryCode);

    };

    $scope.send = function () {
        $http.post(blacktiger.getServiceUrl() + 'system/passwordRequests', $scope.request).then(function (response) {
            if (response.status !== 200) {
                $scope.status = 'error';
            } else {
                $scope.status = 'ok';
            }
        });
    };

    $scope.cancel = function () {
        window.location.hash = '/login';
        //$location.path('/login');
    };

    $scope.reset();
    $rootScope.$on('$translateChangeSuccess', $scope.reset);
    $scope._resolveCountryCode();
}

function CreateSipAccountCtrl($scope, SipUserSvc, blacktiger, $translate, $rootScope) {
    $scope.user = {};
    $scope.mailText = '';
    $scope.innerMailTextPattern = /.*/;
    $scope.mailTextPattern = (function () {
        return {
            test: function (value) {
                var result = $scope.innerMailTextPattern.test(value);
                return result;
            }
        };
    })();

    $scope.reset = function () {
        $scope.user.name = '';
        $scope.user.phoneNumber = '';
        $scope.user.email = '';
        $scope.mailText = $translate.instant('SETTINGS.CREATE_SIP_ACCOUNT.DEFAULT_MAILTEXT');
    };

    $rootScope.$on('$translateChangeSuccess', $scope.reset);

    $scope.createUser = function () {
        var data = {
            account: $scope.user,
            mailText: $scope.mailText
        };
        SipUserSvc.create(data).then(function () {
            $scope.created = angular.copy(data);
            $scope.reset();
            $scope.status = 'success';
        }, function (reason) {
            $scope.reset();
            $scope.status = 'error (reason: ' + reason + ')';
        });
    };

    $scope.onPhoneNumberChanged = function () {
        var number = $scope.user.phoneNumber ? $scope.user.phoneNumber.replace(/[\+\s\-\(\)]/, '') : '',
            noOfCharsToPull = Math.min(4, number.length),
            pattern, i;

        if (noOfCharsToPull === 0) {
            $scope.innerMailTextPattern = '/.*/';
        } else {
            number = number.substr(number.length - noOfCharsToPull, number.length);
            pattern = "^((?!(" + number.charAt(0) + ")";
            for (i = 1; i < number.length; i++) {
                pattern += "[\\s\\w\\W]{0,1}(" + number.charAt(i) + ")";
            }
            pattern += ").)*$";
            $scope.innerMailTextPattern = new RegExp(pattern);
        }

    };

    $scope.reset();

}

function ContactCtrl($scope, RoomSvc) {
    $scope.contact = angular.copy($scope.context.room.contact);
    $scope.contact_status = null;
    
    $scope.updateContact = function () {
        $scope.contact_status = "Saving";
        $scope.context.room.contact = angular.copy($scope.contact);
        RoomSvc.save($scope.context.room).$promise.then(function () {
            $scope.contact_status = "Saved";
        });
    };
}

function SettingsCtrl($scope, LoginSvc) {

    $scope.logout = function () {
        LoginSvc.deauthenticate();
    };
}

function RealtimeCtrl($scope, SystemSvc, MeetingSvc, $timeout) {
    $scope.system = {};

    $scope.getNoOfRooms = function() {
        return MeetingSvc.getTotalRooms();
    };
    
    $scope.getNoOfParticipantsPerRoom = function () {
        var noParticipants = $scope.getNoOfParticipants();
        var noRooms = $scope.getNoOfRooms();
        if (noParticipants === 0 || noRooms === 0) {
            return 0;
        } else {
            return $scope.getNoOfParticipants() / noRooms;
        }
    };

    $scope.getNoOfParticipants = function () {
        return MeetingSvc.getTotalParticipants();
    };

    $scope.getSipPercentage = function () {
        var count = MeetingSvc.getTotalParticipantsByType('Sip');
        if (count === 0) {
            return 0.0;
        } else {
            return (count / $scope.getNoOfParticipants()) * 100;
        }
    };

    $scope.getPhonePercentage = function () {
        if ($scope.getNoOfParticipants() === 0) {
            return 0.0;
        } else {
            return 100 - $scope.getSipPercentage();
        }
    };

    $scope.getNoOfCommentRequests = function () {
        return MeetingSvc.getTotalParticipantsByCommentRequested(true);
    };

    $scope.getNoOfOpenMicrophones = function () {
        return MeetingSvc.getTotalParticipantsByMuted(false);
    };

    $scope.updateSystemInfo = function () {
        SystemSvc.getSystemInfo().then(function (data) {
            $scope.system = data;
        });
    };

    $scope.$on('$destroy', function cleanup() {
        $timeout.cancel($scope.systemInfoTimerPromise);
    });

    $scope.updateSystemInfo();
}

function HistoryCtrl($scope, ReportSvc) {
    $scope.searchHistory = function () {
        ReportSvc.getReport().then(function (data) {
            $scope.historyData = data;
            $scope.summaryHistory();
        });
    };
    $scope.summaryHistory = function () {
        $scope.sumHalls = 0;
        $scope.sumParticipants = 0;
        $scope.sumPhones = 0;
        $scope.sumCalls = 0;
        var countDuration = 0;
        angular.forEach($scope.historyData, function (entry) {
            if (entry.type === "Host") {
                $scope.sumHalls++;
            } else {
                $scope.sumParticipants++;
                $scope.sumCalls += entry.numberOfCalls;
                countDuration += entry.totalDuration;
                if (entry.type == "Phone") {
                    $scope.sumPhones++;
                }
            }
        });
        $scope.sumAverage = $scope.sumParticipants / $scope.sumHalls;
        $scope.sumDuration = countDuration / $scope.sumParticipants;
        $scope.minDuration = $scope.duration;
        $scope.predicate = 'firstCallTimestamp';
    };
}

function SipAccountRetrievalCtrl(CONFIG, $scope, SipUserSvc, token, $rootScope, $translate, $filter) {

    $scope.cleanNumber = function (number) {
        return number.replace(/[\+\-\/\(\) ]/g, '');
    };

    $scope.getSip = function () {
        $scope.status = 'loading';
        $scope.statusMessage = $filter('translate')('GENERAL.LOADING') + '...';
        $scope.sipinfo = null;
        SipUserSvc.get(token, $scope.cleanNumber($scope.phoneNumber)).then(function (data) {
            $scope.status = null;
            $scope.sipinfo = data;
        }, function (reason) {
            $scope.status = 'error';
            $scope.statusMessage = $filter('translate')('SIP_ACCOUNT_RETRIEVAL.ERROR_MESSAGE');
            $scope.sipinfo = null;
        });
    };

    $scope.getSipHelpURL = function () {
        var url = CONFIG.SIPHelp;
        url = url.replace("{%1}", $scope.language);
        return url;
    };

    $scope.language = $translate.use();
}

/** BOOTSTRAP **/
angular.element(document).ready(function () {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');
    $http.get('config.json').then(
        function (response) {
            var config = response.data;
            blacktigerApp.constant('CONFIG', config);
            angular.bootstrap(document, ['blacktiger-app']);
        }
    );

});