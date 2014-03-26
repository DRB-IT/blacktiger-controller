/*************************************** MODULE ********************************************/

var blacktigerApp = angular.module('blacktiger-app', ['ngRoute', 'pascalprecht.translate', 'ui.bootstrap', 'blacktiger-service', 'blacktiger-ui'])
    .config(function ($locationProvider, $routeProvider, $httpProvider, $translateProvider, blacktigerProvider) {
        $httpProvider.interceptors.push(function($location) {
            return {
                'responseError': function(rejection) {
                    if(rejection.status === 401) {
                        $location.path('/login');
                    }
                    return rejection;
                }
            };
        });

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
            templateUrl: 'assets/templates/settings.html'
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

        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/js/i18n/blacktiger-locale-',
            suffix: '.json'
        });

        var language = window.navigator.browserLanguage || window.navigator.language;
        var langData = language.split("-");
        $translateProvider.preferredLanguage(langData[0]);
        $translateProvider.fallbackLanguage('en');
        
        var search = window.location.search;
        if(search.indexOf('?server=') === 0) {
            blacktigerProvider.setServiceUrl(search.substr(8));
        }

    }).run(function($location, LoginSvc) {
        LoginSvc.authenticate().then(angular.noop, function() {
            $location.path('login');
        });
    })
    .filter('filterByRoles', function() {
        return function(input, roles) {
            var out = [];
            angular.forEach(input, function(entry) {
                if(!entry.requiredRole || (roles && roles.indexOf(entry.requiredRole) >= 0)) {
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

                $scope.isCommentRequested = function() {
                    
                    var commentRequested = false;
                    
                    angular.forEach($scope.participants, function(p) {
                        if(p.commentRequested) {
                            commentRequested = true;
                            return false;
                        }
                    });
                    return commentRequested;

                };

                $scope.$watch('isCommentRequested()', function(value) {
                    if(value === true) {
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
                    var numbers = [];
                    for (var i = 1; i <= RemoteSongSvc.getNumberOfSongs(); i++) {
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
                    var nameArray = [];
                    for (var i = 1; i <= RemoteSongSvc.getNumberOfSongs(); i++) {
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

function MenuCtrl($scope, $location) {
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
            requiredRole: 'ROLE_HOST'
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
}

function RoomDisplayCtrl($scope, RoomSvc, LoginSvc, $rootScope, MeetingSvc) {
    $scope.rooms = null;
    
    $scope.$watch('rooms', function () {
        if ($scope.currentUser && $scope.currentUser.roles.indexOf('ROLE_HOST') >= 0 && 
            $scope.rooms !== null && $scope.rooms.length > 0) {
            $rootScope.currentRoom = $scope.rooms[0];
            MeetingSvc.setRoom($rootScope.currentRoom);
        }
    }, true);

    $scope.$on("login", function() {
        $scope.rooms = RoomSvc.query();
        $scope.currentUser = LoginSvc.getCurrentUser();
    });

}

function LoginCtrl($scope, $location, LoginSvc) {
    $scope.username = "";
    $scope.password = "";
    $scope.rememberMe = false;

    $scope.login = function() {
        LoginSvc.authenticate($scope.username, $scope.password, $scope.rememberMe).then(function(user) {
            if(user.roles.indexOf('ROLE_HOST') >= 0) {
                $location.path('');
            } else if(user.roles.indexOf('ROLE_ADMIN') >= 0) {
                $location.path('/admin/realtime');
            }
        }, function(reason) {
            alert(reason);
        });
    }
}

function RoomCtrl($scope, $cookieStore, $modal, MeetingSvc, PhoneBookSvc, ReportSvc, $log) {
    $scope.participants = MeetingSvc.getParticipantList();
    $scope.historyCookieName = 'meetingHistory';
    $scope.translationData = {
        phoneNumber: $scope.currentRoom
    };
    $scope.history = [];
    $cookieStore.put($scope.historyCookieName, []);
    
    $scope.isHostInConference = function() {
        var value = false;
        angular.forEach($scope.participants, function(p) {
            if(p.host === true) {
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
        if(muted) {
            MeetingSvc.mute(channel);
        } else {
            MeetingSvc.unmute(channel);
        }
    };

    $scope.changeName = function(phoneNumber, currentName) {
        var modalInstance = $modal.open({
        templateUrl: 'assets/templates/modal-edit-name.html',
        controller: ModalEditNameCtrl,
        resolve: {
            phoneNumber: function() {
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

    $scope.$on('PhoneBookSvc.update', function(event, phone, name) {
        // Make sure names in participantlist are update.
        angular.forEach($scope.participants, function(p) {
            if (p.phoneNumber === phone) {
                p.name = name;
            }
        });

        // Make sure names in historylist are update.
        angular.forEach($scope.history, function(e) {
            if (e.phoneNumber === phone) {
                e.name = name;
            }
        });
    });

    $scope.updateHistory = function() {
        var history = $cookieStore.get($scope.historyCookieName),
            participants = MeetingSvc.getParticipantList(),
            cleansedHistory = [];

        angular.forEach(history, function(number) {
            var stillParticipating = false;
            angular.forEach(participants, function(participant) {
                if (participant.phoneNumber === number) {
                    stillParticipating = true;
                    return false;
                }
            });

            if (!stillParticipating) {
                cleansedHistory.push(number);
            }
        });

        if(cleansedHistory.length ===0) {
            $scope.history = [];
        } else {
            ReportSvc.findByNumbers($scope.currentRoom.id, cleansedHistory).then(function (data) {
                $scope.history = data;
            });
        }
    };
    
    $scope.$on('MeetingSvc.Join', function(event, participant) {
        $log.debug('New participants - adding to history.');
        var history = $cookieStore.get($scope.historyCookieName);
        if (history.indexOf(participant.phoneNumber)<0) {
            history.push(participant.phoneNumber);
            $cookieStore.put($scope.historyCookieName, history);
        }
        //$scope.updateHistory();
    });

    $scope.$on('MeetingSvc.Leave', function(event, participant) {
        $log.debug('MeetingSvc.leave event received - updating history.');
        $scope.updateHistory();
    });

}

function ModalEditNameCtrl($scope, $modalInstance, phoneNumber, currentName) {
    $scope.data =  {
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

function SettingsCtrl($scope, SipUserSvc) {
    $scope.selectedView='settings';
    $scope.user = {};

    $scope.reset = function() {
        $scope.user.name = '';
        $scope.user.phoneNumber = '';
        $scope.user.email = '';

    };

    $scope.createUser = function() {
        SipUserSvc.create($scope.user).then(function() {
            $scope.reset();
            $scope.status = 'success';
        }, function(reason) {
            $scope.reset();
            $scope.status = 'error';
        });
    };

    $scope.updateContact = function() {
        /*Update contact*/
    };

}

function RealtimeCtrl($scope, SystemSvc, RealtimeSvc, $timeout) {
    $scope.system = {};
    $scope.systemInfoTimerPromise;

    $scope.rooms = RealtimeSvc.getRoomList();

    $scope.getNoOfParticipants = function() {
        var count = 0;
        angular.forEach($scope.rooms, function(room) {
            angular.forEach(room.participants, function(p) {
                if(!p.host) {
                    count++;
                }
            });
        });
        return count;
    };

    $scope.getSipPercentage = function() {
        var count = 0;
        angular.forEach($scope.rooms, function(room) {
            angular.forEach(room.participants, function(p) {
                if(!p.host && p.phoneNumber.indexOf('#') === 0) {
                    count++;
                }
            });
        });
        if(count === 0) {
            return 0.0;
        } else {
            return (count / $scope.getNoOfParticipants()) * 100;
        }
    };

    $scope.getNoOfCommentRequests = function() {
        var count = 0;
        angular.forEach($scope.rooms, function(room) {
            angular.forEach(room.participants, function(p) {
                if(p.commentRequested) {
                    count++;
                }
            });
        });
        return count;
    };

    $scope.getNoOfOpenMicrophones = function() {
        var count = 0;
        angular.forEach($scope.rooms, function(room) {
            angular.forEach(room.participants, function(p) {
                if(!p.host && !p.muted) {
                    count++;
                }
            });
        });
        return count;
    };

    $scope.updateSystemInfo = function() {
        SystemSvc.getSystemInfo().then(function(data) {
            $scope.system = data;
        });
        $scope.systemInfoTimerPromise = $timeout($scope.updateSystemInfo, 1000);
    };
    
    $scope.$on('$destroy', function cleanup() {
        $timeout.cancel($scope.systemInfoTimerPromise);
    });

    $scope.updateSystemInfo();
}

function HistoryCtrl($scope, ReportSvc) {
    $scope.searchHistory = function () {
        ReportSvc.getReport().then(function(data) {
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

/** BOOTSTRAP **/
angular.element(document).ready(function () {
    angular.bootstrap(document, ['blacktiger-app']);
});
