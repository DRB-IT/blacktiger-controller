/*************************************** MODULE ********************************************/

var blacktigerApp = angular.module('blacktiger-app', ['ngRoute', 'pascalprecht.translate', 'ui.bootstrap', 'blacktiger-service', 'blacktiger-ui'])
    .config(function ($locationProvider, $routeProvider, $httpProvider, $translateProvider, blacktigerProvider) {
        var mode = "normal", token, params = [], search, list, url, elements, language, langData;

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
        if(search.length > 0 && search.charAt(0) === '?') {
            search = search.substring(1);
            list = search.split('&');
            angular.forEach(list, function(entry) {
                elements = entry.split('=');
                if(elements.length > 1) {
                    params[elements[0]] = elements[1];
                }
            });
        }

        if(angular.isDefined(params['server'])) {
            url = params['server'];
            if(url.charAt(url.length-1) !== '/') {
                url = url + '/';
            }
            blacktigerProvider.setServiceUrl(url);
        }

        if (angular.isDefined(params['token'])) {
            mode = "token";
            token = params['token'];
        }

        if(mode === 'normal') {
            $routeProvider.
            when('/', {
                controller: RoomCtrl,
                templateUrl: 'assets/templates/room.html'
            }).
            when('/login', {
                controller: LoginCtrl,
                templateUrl: 'assets/templates/login.html'
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

        if(mode === 'token') {
            $routeProvider.
            when('/', {
                controller: SipAccountRetrievalCtrl,
                templateUrl: 'assets/templates/sipaccount-retrieve.html',
                resolve: {
                    token: function() {
                        return token;
                    }
                }
            }).
            otherwise({
                redirectTo: '/'
            })
        }

        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/js/i18n/blacktiger-locale-',
            suffix: '.json'
        });

        language = window.navigator.userLanguage || window.navigator.language;
        language = 'en';
        langData = language.split("-");
        $translateProvider.preferredLanguage(langData[0]);
        $translateProvider.fallbackLanguage('en');

    }).run(function ($location, LoginSvc, $rootScope) {
        LoginSvc.authenticate().then(angular.noop, function () {
            $location.path('login');
        });

        $rootScope.$on("logout", function(user) {
            $location.path('login');
        });
    })
    .filter('filterByRoles', function () {
        return function (input, roles) {
            var out = [];
            angular.forEach(input, function (entry) {
                if (!entry.requiredRole || (roles && roles.indexOf(entry.requiredRole) >= 0)) {
                    out.push(entry);
                }
            });
            return out;
        }
    })
    .directive('btCommentAlert', function () {
        return {
            restrict: 'E',
            controller: function ($scope, MeetingSvc) {
                $scope.participants = MeetingSvc.getParticipantList();
                $scope.forcedHidden = false;

                $scope.isCommentRequested = function () {

                    var commentRequested = false;

                    angular.forEach($scope.participants, function (p) {
                        if (p.commentRequested) {
                            commentRequested = true;
                            return false;
                        }
                    });
                    return commentRequested;

                };

                $scope.$watch('isCommentRequested()', function (value) {
                    if (value === true) {
                        $scope.forcedHidden = false;
                    }
                });
            },
            templateUrl: 'assets/templates/bt-commentalert.html'
        };
    }).directive('musicplayer', function () {
        return {
            restrict: 'E',
            scope: {

            },
            controller: function ($rootScope, $q, $scope, RemoteSongSvc, StorageSvc, AudioPlayerSvc) {
                $scope.currentSong = 0;
                $scope.progress = 0;
                $scope.state = AudioPlayerSvc.getState();
                $scope.maxNumber = RemoteSongSvc.getNumberOfSongs();
                $scope.downloadState = "Idle";
                $scope.hasSongsLocally = false;
                $scope.random = false;

                $scope.downloadFile = function (deferred, number, until) {
                    RemoteSongSvc.readBlob(number).then(function (blob) {
                        StorageSvc.writeBlob("song_" + number + ".mp3", blob).then(function () {
                            if (number < until) {
                                number++;
                                $scope.progress = (number / until) * 100;
                                $scope.downloadFile(deferred, number, until);
                            } else {
                                deferred.resolve();
                            }
                        });

                    });
                };

                $scope.startDownload = function () {
                    StorageSvc.init().then(function () {
                        var deferred = $q.defer(),
                            promise = deferred.promise;
                        $scope.downloadState = "Downloading";
                        $scope.downloadFile(deferred, 1, RemoteSongSvc.getNumberOfSongs());
                        promise.then(function () {
                            $scope.downloadState = "Idle";
                            $scope.hasSongsLocally = true;
                            $scope.currentSong = 1;
                            $scope.progress = 0;
                        });
                    });


                };

                $scope.getSongNumbers = function () {
                    var numbers = [], i;
                    for (i = 1; i <= RemoteSongSvc.getNumberOfSongs(); i++) {
                        numbers[numbers.length] = i;
                    }
                    return numbers;
                };
                $scope.getProgressStyle = function () {
                    return {
                        width: $scope.progress + '%'
                    };
                };

                $scope.play = function () {
                    AudioPlayerSvc.play();
                };

                $scope.stop = function () {
                    AudioPlayerSvc.stop();
                };

                $scope.toggleRandom = function () {
                    random = !random;
                };

                $scope.$watch('currentSong', function () {
                    if ($scope.hasSongsLocally) {
                        $scope.stop();
                        StorageSvc.readBlob("song_" + $scope.currentSong + ".mp3").then(function (blob) {
                            AudioPlayerSvc.setUrl(URL.createObjectURL(blob));
                        });
                    }
                });

                $scope.updateProgress = function () {
                    $scope.state = AudioPlayerSvc.getState();
                    $scope.progress = AudioPlayerSvc.getProgressPercent();
                    if ($scope.state === 'playing') {
                        window.setTimeout(function () {
                            $scope.$apply(function () {
                                $scope.updateProgress();
                            });


                        }, 100);
                    }
                };

                $scope.isSupported = function () {
                    return AudioPlayerSvc.isSupported();
                };

                $rootScope.$on('audioplayer.playing', $scope.updateProgress);
                $rootScope.$on('audioplayer.stopped', $scope.updateProgress);

                StorageSvc.init().then(function () {
                    var nameArray = [], i;
                    for (i = 1; i <= RemoteSongSvc.getNumberOfSongs(); i++) {
                        nameArray[i - 1] = "song_" + i + ".mp3";
                    }
                    StorageSvc.hasBlobs(nameArray).then(function () {
                        $scope.hasSongsLocally = true;
                        $scope.currentSong = 1;
                    });
                }, 100);

            },
            templateUrl: 'assets/templates/bt-musicplayer.html'
        };
    });

/*************************************** CONTROLLERS ********************************************/

function MenuCtrl($scope, $location, LoginSvc) {
    $scope.location = $location;
    $scope.links = [
        {
            url: "#/",
            name: 'NAVIGATION.PARTICIPANTS',
            icon: 'user',
            requiredRole: 'ROLE_HOST'
        },
        {
            url: "#/settings",
            name: 'NAVIGATION.SETTINGS',
            icon: 'cog',
            requiredRole: 'ROLE_HOST'
        },
        {
            url: "http://telesal.dk/wiki",
            name: 'NAVIGATION.HELP',
            icon: 'question-sign',
            requiredRole: 'ROLE_HOST',
            target: '_blank'
        },
        {
            url: "#/admin/realtime",
            name: 'NAVIGATION.ADMIN.REALTIME',
            icon: 'transfer',
            requiredRole: 'ROLE_ADMIN'
        },
        {
            url: "#/admin/history",
            name: 'NAVIGATION.ADMIN.HISTORY',
            icon: 'calendar',
            requiredRole: 'ROLE_ADMIN'
        }
    ];

    $scope.logout = function() {
        LoginSvc.deauthenticate();
    };
}

function RoomDisplayCtrl($scope, RoomSvc, LoginSvc, $rootScope, MeetingSvc) {
    $scope.rooms = null;

    $scope.updateCurrentRoom = function () {
        if ($scope.currentUser && $scope.currentUser.roles.indexOf('ROLE_HOST') >= 0 &&
            $scope.rooms !== null && $scope.rooms.length > 0) {
            $rootScope.currentRoom = $scope.rooms[0];
            MeetingSvc.setRoom($rootScope.currentRoom);
        }
    };

    $scope.$on("login", function () {
        $scope.rooms = RoomSvc.query();
        $scope.rooms.$promise.then($scope.updateCurrentRoom);
    });

}

function LoginCtrl($scope, $location, LoginSvc) {
    $scope.username = "";
    $scope.password = "";
    $scope.rememberMe = false;
    $scope.status = null;

    $scope.login = function () {
        LoginSvc.authenticate($scope.username, $scope.password, $scope.rememberMe).then(function (user) {
            $scope.status = 'success';
            if (user.roles.indexOf('ROLE_HOST') >= 0) {
                $location.path('');
            } else if (user.roles.indexOf('ROLE_ADMIN') >= 0) {
                $location.path('/admin/realtime');
            }
        }, function (reason) {
            $scope.status = "invalid";
        });
    }
}

function RoomCtrl($scope, $cookieStore, $modal, MeetingSvc, PhoneBookSvc, ReportSvc, $log) {
    $scope.participants = MeetingSvc.getParticipantList();
    $scope.historyCookieName = 'meetingHistory';
    $scope.translationData = {
        noOfParticipants: 0,
        noOfCompletedCalls: 0
    };
    $scope.history = [];
    $cookieStore.put($scope.historyCookieName, {});

    $scope.isHostInConference = function () {
        var value = false;
        angular.forEach($scope.participants, function (p) {
            if (p.host === true) {
                value = true;
                return false;
            }
        });
        return value;
    };

    $scope.kickParticipant = function (channel) {
        MeetingSvc.kick(channel);
    };

    $scope.muteParticipant = function (channel, muted) {
        if (muted) {
            MeetingSvc.mute(channel);
        } else {
            MeetingSvc.unmute(channel);
        }
    };

    $scope.changeName = function (phoneNumber, currentName) {
        var modalInstance = $modal.open({
            templateUrl: 'assets/templates/modal-edit-name.html',
            controller: ModalEditNameCtrl,
            resolve: {
                phoneNumber: function () {
                    return phoneNumber;
                },
                currentName: function () {
                    return currentName;
                }
            }
        });

        modalInstance.result.then(function (newName) {
            PhoneBookSvc.updateEntry(phoneNumber, newName);
        });
    }

    $scope.$on('PhoneBookSvc.update', function (event, phone, name) {
        // Make sure names in participantlist are update.
        angular.forEach($scope.participants, function (p) {
            if (p.phoneNumber === phone) {
                p.name = name;
            }
        });

        // Make sure names in historylist are update.
        angular.forEach($scope.history, function (e) {
            if (e.phoneNumber === phone) {
                e.name = name;
            }
        });
    });

    $scope.calculateTotalDuration = function (entry) {
        var duration = 0;
        angular.forEach(entry.calls, function (call) {
            if (call.end !== null) {
                duration += call.end - call.start;
            }
        });
        return duration;
    };

    $scope.noOfCallsForPhoneNumber = function(phoneNumber) {
        var count = 0, history = $cookieStore.get($scope.historyCookieName);
        angular.forEach(history, function (entry) {
            if (phoneNumber === entry.phoneNumber) {
                count = entry.calls.length;
            }
        });

        return count;
    };

    $scope.updateHistory = function () {
        var history = $cookieStore.get($scope.historyCookieName),
            participants = MeetingSvc.getParticipantList(),
            cleansedHistory = [];

        angular.forEach(history, function (entry) {
            var stillParticipating = false;
            angular.forEach(participants, function (participant) {
                if (participant.phoneNumber === entry.phoneNumber) {
                    stillParticipating = true;
                    return false;
                }
            });

            if (!stillParticipating && !entry.host) {
                cleansedHistory.push(entry);
            }
        });

        $scope.history = cleansedHistory;

        $scope.translationData.noOfParticipants = participants.length;
        $scope.translationData.noOfCompletedCalls = $scope.history.length;
    };

    $scope.deleteHistory = function() {
        $cookieStore.put($scope.historyCookieName, []);
        $scope.updateHistory();
    };

    $scope.$on('MeetingSvc.Join', function (event, participant) {
        //Ignore the host. It will not be part of the history.
        if(participant.host) {
            return;
        }

        $log.debug('New participants - adding to history.');
        var entry, call, history = $cookieStore.get($scope.historyCookieName);
        if (history[participant.phoneNumber] === undefined) {
            entry = {
                phoneNumber: participant.phoneNumber,
                name: participant.name,
                firstCall: new Date().getTime(),
                calls: []
            };
            history[participant.phoneNumber] = entry;
        } else {
            entry = history[participant.phoneNumber];
        }

        call = {
            start: new Date().getTime(),
            end: null
        };
        entry.calls.push(call);

        $cookieStore.put($scope.historyCookieName, history);
        $scope.updateHistory();

    });

    $scope.$on('MeetingSvc.Leave', function (event, participant) {
        $log.debug('MeetingSvc.leave event received - updating history.');
        var history = $cookieStore.get($scope.historyCookieName), entry;
        entry = history[participant.phoneNumber];
        if (entry) {
            angular.forEach(entry.calls, function (call) {
                if (call.end === null) {
                    call.end = new Date().getTime();
                    $cookieStore.put($scope.historyCookieName, history);
                    return false;
                }
            });
        }
        $scope.updateHistory();
    });

}

function ModalEditNameCtrl($scope, $modalInstance, phoneNumber, currentName) {
    $scope.data = {
        name: currentName,
        phoneNumber: phoneNumber
    }

    $scope.ok = function () {
        $modalInstance.close($scope.data.name);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function CreateSipAccountCtrl($scope, SipUserSvc, blacktiger) {
    $scope.user = {};
    $scope.e164Pattern = blacktiger.getE164Pattern();


    $scope.reset = function () {
      $scope.user.name = '';
      $scope.user.phoneNumber = '+' + $scope.currentRoom.countryCallingCode;
      $scope.user.email = '';

    };

    $scope.createUser = function () {
      SipUserSvc.create($scope.user).then(function () {
          $scope.created = angular.copy($scope.user);
          $scope.reset();
          $scope.status = 'success';
      }, function (reason) {
          $scope.reset();
          $scope.status = 'error';
      });
    };

    $scope.reset();

}

function ContactCtrl($scope, SipUserSvc, RoomSvc, blacktiger) {
    $scope.contact = angular.copy($scope.currentRoom.contact);
    $scope.contact_status = null;
    $scope.e164Pattern = blacktiger.getE164Pattern();

    $scope.updateContact = function () {
        $scope.contact_status = "Saving";
        $scope.currentRoom.contact = angular.copy($scope.contact);
        RoomSvc.save($scope.currentRoom).$promise.then(function() {
            $scope.contact_status = "Saved";
        });
    };
}

function SettingsCtrl($scope, SipUserSvc, RoomSvc, blacktiger) {


}

function RealtimeCtrl($scope, SystemSvc, RealtimeSvc, $timeout) {
    $scope.system = {};
    $scope.systemInfoTimerPromise;

    $scope.rooms = RealtimeSvc.getRoomList();

    $scope.getNoOfParticipants = function () {
        var count = 0;
        angular.forEach($scope.rooms, function (room) {
            angular.forEach(room.participants, function (p) {
                if (!p.host) {
                    count++;
                }
            });
        });
        return count;
    };

    $scope.getSipPercentage = function () {
        var count = 0;
        angular.forEach($scope.rooms, function (room) {
            angular.forEach(room.participants, function (p) {
                if (!p.host && p.phoneNumber.indexOf('#') === 0) {
                    count++;
                }
            });
        });
        if (count === 0) {
            return 0.0;
        } else {
            return (count / $scope.getNoOfParticipants()) * 100;
        }
    };

    $scope.getNoOfCommentRequests = function () {
        var count = 0;
        angular.forEach($scope.rooms, function (room) {
            angular.forEach(room.participants, function (p) {
                if (p.commentRequested) {
                    count++;
                }
            });
        });
        return count;
    };

    $scope.getNoOfOpenMicrophones = function () {
        var count = 0;
        angular.forEach($scope.rooms, function (room) {
            angular.forEach(room.participants, function (p) {
                if (!p.host && !p.muted) {
                    count++;
                }
            });
        });
        return count;
    };

    $scope.updateSystemInfo = function () {
        SystemSvc.getSystemInfo().then(function (data) {
            $scope.system = data;
        });
        //$scope.systemInfoTimerPromise = $timeout($scope.updateSystemInfo, 1000);
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
    }
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
    }
}

function SipAccountRetrievalCtrl($scope, SipUserSvc, token) {

    $scope.cleanNumber = function(number) {
        return number.replace(/[\+\-\/\(\) ]/g, '');
    };

    $scope.getSip = function() {
        $scope.status="Henter oplysninger."
        $scope.sipinfo = null;
        SipUserSvc.get(token, $scope.cleanNumber($scope.phoneNumber)).then(function(data) {
            $scope.status=null;
            $scope.sipinfo = data;
        }, function(reason) {
            $scope.status="Vi kender ikke det nummer du tastede, måske tastede du forkert? Eller har du et andet telefonnummer, så prøv det. Kontakt evt. din lokale teknisk ansvarlige og bed ham oprette dig igen med dit korrekte telefonnummer.";
            $scope.sipinfo = null;
        });
    };
}

/** BOOTSTRAP **/
angular.element(document).ready(function () {
    angular.bootstrap(document, ['blacktiger-app']);
});
