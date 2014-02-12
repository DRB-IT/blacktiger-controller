/*************************************** MODULE ********************************************/

var blacktigerApp = angular.module('blacktiger-app', ['ngRoute', 'pascalprecht.translate', 'ui.bootstrap', 'blacktiger-service', 'blacktiger-ui'])
    .config(function ($locationProvider, $routeProvider, $httpProvider, $translateProvider) {
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
            controller: SettingsCtrl,
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
    
    $scope.kickParticipant = function (userId) {
        MeetingSvc.kick(userId);
    };

    $scope.muteParticipant = function (userId, muted) {
        if(muted) {
            MeetingSvc.mute(userId);
        } else {
            MeetingSvc.unmute(userId);
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

        ReportSvc.findByNumbers($scope.currentRoom, cleansedHistory).then(function (data) {
            $scope.history = data;
        });
    };
    
    $scope.$on('MeetingSvc.Join', function(event, participant) {
        $log.debug('New participants - adding to history.');
        var history = $cookieStore.get($scope.historyCookieName);
        if (history.indexOf(participant.phoneNumber)<0) {
            history.push(participant.phoneNumber);
            $cookieStore.put($scope.historyCookieName, history);
        }
        $scope.updateHistory();
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

angular.module('blacktiger-app-mocked', ['blacktiger-app', 'ngMockE2E'])
    .factory('mockinfo', function() {
        var events = [];

        this.getEvents = function() {
            return events;
        };

        this.setEvents = function(newEvents) {
            events = newEvents;
        };

        var self = this;

        return {
            getEvents : self.getEvents,
            setEvents: self.setEvents
        };
    })
    .config(function($httpProvider, mockinfoProvider) {

        $httpProvider.interceptors.push(function($q, $timeout, mockinfo) {
            var token = null;
            return {
                'request': function(config) {
                    var token = config.headers['X-Auth-Token'];
                    if(config.url.indexOf('events') >= 0) {
                        var count = 0;
                        var deferred = $q.defer();
                        var delayedRequest = function() {
                            $timeout(function() {
                                if(count === 60 || mockinfo.getEvents().length > 0) {
                                    deferred.resolve(config);
                                    count = 0;
                                } else {
                                    delayedRequest();
                                }
                                count++;
                            }, 1000);
                        };
                    delayedRequest();
                        return deferred.promise;
                    } else {
                        return config;
                    }
                },
                'response': function(response) {
                    var token = response.config.headers['X-Auth-Token'];
                    if(!angular.isDefined(token) && response.config.url.indexOf('assets/') !== 0 && response.config.url.indexOf('system/authenticate') !== 0) {
                        response.status = 401;
                        return $q.reject(response);
                    }
                    return response;
                }
            };
        });
    })
    .run(function ($httpBackend, mockinfo, $q) {
        var rooms = [
            {
                id: 'DK-9000-1',
                name: 'DK-9000-1 Aalborg, sal 1',
                contact: {
                    name: 'Michael Stenner',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                participants: [
                ]
            },
            {
                id: 'DK-9000-2',
                name: 'DK-9000-2 Aalborg, sal 2',
                contact: {
                    name: 'Michael Stenner',
                    phoneNumber: '+4512345678',
                    email: 'example@mail.dk'
                },
                participants: [
                ]
            }
        ];
        var persons = [
            {name: 'Michael Krog', phoneNumber: '+4512345670'},
            {name: 'Hannah Krog', phoneNumber: '+4512345671'},
            {name: 'Kasper Dyrvig', phoneNumber: '#654321'},
            {name: 'Peter Almer Frederiksen', phoneNumber: '#123456'},
            {name: 'Thomas Fredriksen', phoneNumber: '+4512345674'},
            {name: 'Dan Cosmus', phoneNumber: '+4512345675'},
            {name: 'Carit Stypinsky', phoneNumber: '+4512345676'},
            {name: 'Bjarne Jensen', phoneNumber: '+4512345677'},
            {name: 'Børge Lund', phoneNumber: '#956677'},
            {name: 'Åse Nielsen', phoneNumber: '+4512345679'}

        ], nextUserId = 0, i, date = new Date();
        var users = {
            admin: ['ROLE_USER', 'ROLE_ADMIN'],
            90001: ['ROLE_USER', 'ROLE_HOST', 'ROLE_HOST_DK-9000-1'],
            90002: ['ROLE_USER', 'ROLE_HOST', 'ROLE_HOST_DK-9000-2']
        };
            

        var getPersonByPhoneNumber = function(phoneNumber) {
            var person = null;
            angular.forEach(persons, function(p) {
                if(p.phoneNumber === phoneNumber) {
                    person = p;
                }
            });
            return person;
        };

        var getRoom = function(roomId) {
            var val = null;
            angular.forEach(rooms, function(room) {
                if(roomId === room.id) {
                    val = room;
                }
            });
            return val;
        }

        var addParticipant = function(room, addEvent) {
            var hasHost = false, participant = null;
            angular.forEach(room.participants, function(p) {
                if (p.host === true) {
                   hasHost = true;
                }
            });


            if(!hasHost) {
                participant = {
                    userId: String(nextUserId++),
                    muted: false,
                    host: true,
                    phoneNumber: '#45-9000-2',
                    dateJoined: date.getTime(),
                    name: 'Rigssal'
                };

            } else {
                
                for(var i = 0;i < persons.length; i++) {
                    var index = Math.floor((Math.random()*persons.length));
                    var currentPerson = persons[index];
                    var alreadyAdded = false;
                    
                    angular.forEach(room.participants, function(currentParticipant) {
                        if(currentPerson.phoneNumber === currentParticipant.phoneNumber) {
                            alreadyAdded = true;
                            return false;
                        }
                    });

                    if(!alreadyAdded) {
                        participant = {
                            userId: String(nextUserId++),
                            muted: true,
                            host: false,
                            phoneNumber: currentPerson.phoneNumber,
                            dateJoined: date.getTime(),
                            name: currentPerson.name
                        };
                        break;
                    }
                }
                
            }

            if(participant !== null) {
                room.participants.push(participant);
                if(addEvent) {
                    mockinfo.getEvents().push({type:'Join', room: room.id, participant:participant});
                }
            }

        };

        var handleCommentRequested = function(room, participant, value) {
            if(participant.host !== true) {
                participant.commentRequested = value;
                mockinfo.getEvents().push({type:'Change', room: room.id, participant:participant});
            }
        };

        var maintainCount = 0;

        var maintainParticipantList = function() {
            
            setTimeout(function() {

                maintainCount ++;
                var index = Math.floor(Math.random()*rooms.length);
                var room = rooms[index];
                //angular.forEach(rooms, function(room) {
                    if(room.participants.length < persons.length + 1) {
                        addParticipant(room, true);
                    }

                    if(maintainCount % 10 === 2) {
                        var index = Math.floor((Math.random()*(room.participants.length-1)) + 1);
                        console.log(index);
                        var participant = room.participants[index];
                        handleCommentRequested(room, participant, true);
                        setTimeout(function() {
                            handleCommentRequested(room, participant, false);
                        }, 15000);
                    }
                    maintainParticipantList();
                //});
            }, Math.min(45000, 3000 * (maintainCount + 1)));
        };

        angular.forEach(rooms, function(room) {
                addParticipant(room);
        });

        maintainParticipantList();

        var onRequestRooms = function(method, url, data, headers) {
            var data = [];
            
            var user = headers['X-Auth-Token'];
            var roles = users[user];
            
            angular.forEach(rooms, function(room) {
                var roomRole = 'ROLE_HOST_' + room.id;
                if(roles.indexOf('ROLE_ADMIN') >= 0 || roles.indexOf(roomRole) >= 0) {
                    data.push(room);
                }
            });
            return [200, data];
        };
        $httpBackend.whenGET("rooms").respond(onRequestRooms);
        $httpBackend.whenGET("rooms?mode=full").respond(onRequestRooms);

        var onRequestRoom = function(method, url, data, headers) {
            var data = null;
            var leafs = url.split('/');
            var id = leafs[leafs.length-1];

            angular.forEach(rooms, function(room) {
                if(room.id === id) {
                    data = room;
                }
            });
            return [data === null ? 404 : 200, data];
        };
        $httpBackend.whenGET('rooms/DK-9000-1').respond(onRequestRoom);
        $httpBackend.whenGET('rooms/DK-9000-2').respond(onRequestRoom);
        
        var onRequestParticipants = function(method, url) {
            var data;
            var branch = url.split('/');
            var roomId = branch[branch.length-2];
            
            angular.forEach(rooms, function(room) {
                if(room.id === roomId) {
                    data = room.participants;
                }
            });
            return [200, data];
        };
        $httpBackend.whenGET(/^rooms\/DK-9000-1\/participants/).respond(onRequestParticipants);
        $httpBackend.whenGET(/^rooms\/DK-9000-2\/participants/).respond(onRequestParticipants);
        
        var onDeleteParticipant = function(method, url) {
            var branch = url.split('/');
            var roomId = branch[branch.length-3];
            var userId = branch[branch.length-1];
            var room = getRoom(roomId);
            angular.forEach(room.participants, function(p, index) {
                if(p.userId === userId) {
                    room.participants.splice(index, 1);
                    mockinfo.getEvents().push({type:'Leave', room: roomId, participant:p});
                    return false;
                }
            });
            return [200];
        };
        $httpBackend.whenDELETE(/^rooms\/DK-9000-1\/participants\/.+/).respond(onDeleteParticipant);
        $httpBackend.whenDELETE(/^rooms\/DK-9000-2\/participants\/.+/).respond(onDeleteParticipant);

        var onMutingParticipant = function(method, url, data) {
            var branch = url.split('/');
            var roomId = branch[branch.length-3];
            var userId = branch[branch.length-1];
            var room = getRoom(roomId);
            angular.forEach(room.participants, function(p, index) {
                if(p.userId === userId) {
                    room.participants[index].muted = data;
                    mockinfo.getEvents().push({type:'Change', room: roomId, participant:p});
                    return false;
                }
            });
            return [200];
        };
        $httpBackend.whenPOST(/^rooms\/DK-9000-1\/participants\/.+\/muted/).respond(onMutingParticipant);
        $httpBackend.whenPOST(/^rooms\/DK-9000-2\/participants\/.+\/muted/).respond(onMutingParticipant);

        $httpBackend.whenGET('system/information').respond(function() {
            var data = {
                cores: 24,
                load: {
                    disk: 25.0 + (Math.random() * 4) - 2,
                    memory: 22.0 + (Math.random() * 10) - 5,
                    cpu: 20.0 + (Math.random() * 94) - 15,
                    net: 20.0 + (Math.random() * 94) - 15
                },
                averageCpuLoad: {
                    oneMinute: 0.1,
                    fiveMinutes: 0.3,
                    tenMinutes: 2.0
                }
            };
            return [200, data];
        });
        
        $httpBackend.whenPOST('system/authenticate').respond(function(method, url, data) {
            
            var user;
            data = JSON.parse(data);
            var roles = users[data.username.toLowerCase()];
            
            if(roles) {
                user = {
                    username: data.username,
                    authtoken: data.username,
                    roles: roles
                };
                return [200, user];
            } else {
                return [401, "Invalid username"];
            }
            
            
        });
        $httpBackend.whenGET(/^events.?/).respond(function(method, url) {
            var data;
            if(url.indexOf("since=") > 0) {
                data = {timestamp:new Date().getTime(),events:mockinfo.getEvents()};
            } else {
                data = {timestamp:new Date().getTime(),events:[]};
            }
            mockinfo.setEvents([]);
            return [200, data];
        });


        $httpBackend.whenGET(/^reports\/.+/).respond(function(method, url) {
            var data = [];

            var numberString = url.substr(url.indexOf('?numbers=') + 9);
            var numbers = numberString === '' ? [] : numberString.split(',');
            angular.forEach(numbers, function(number) {
                var person = getPersonByPhoneNumber(number);
                data.push({
                    phoneNumber: number,
                    name: person.name,
                    numberOfCalls: Math.floor((Math.random()*6)+1),
                    totalDuration: Math.floor((Math.random()*30000)+1) + 50,
                    firstCallTimestamp: 1387400000 + Math.floor((Math.random()*100000000))
                });
            });
            return [200, data];
        });

        $httpBackend.whenPOST(/^phonebook\/.?/).respond(function(method, url, data) {
            var branch = url.split('/');
            var phoneNumber = branch[branch.length-1];
            var person = getPersonByPhoneNumber(phoneNumber);
            person.name = data;
            return [200];
        });

        $httpBackend.whenPOST(/^users/).respond();

        $httpBackend.whenGET(/^assets\/.?/).passThrough();
        $httpBackend.whenGET(/^http:\/\/telesal.s3.amazonaws.com\/.?/).passThrough();
    });


/** BOOTSTRAP **/
var mocked = false;

function isTest() {
    var loc = window.location.toString();
    return loc.indexOf('http://localhost') === 0 ||
        loc.indexOf('file://') === 0 ||
        loc.indexOf('http://drb-it.github.io') === 0 ||
        loc.indexOf('http://127.0.0.1') === 0;
}

if (isTest() && window.location.search !== '?prod') {
    var mocked = true;
    document.write("<" + "script type='text/javascript' src='assets/js/angular-1.2.10/angular-mocks.js'><" + "/script>");

}
angular.element(document).ready(function () {
    angular.bootstrap(document, ['blacktiger-app' + (mocked ? '-mocked' : '')]);
});
