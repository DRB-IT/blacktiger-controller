/*************************************** MODULE ********************************************/

var blacktigerApp = angular.module('blacktiger-app', ['ngRoute', 'pascalprecht.translate', 'blacktiger'])
    .config(function ($locationProvider, $routeProvider, $translateProvider) {
        $routeProvider.
        when('/', {
            controller: angular.noop,
            templateUrl: 'assets/templates/room.html'
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

    })
    .filter('cleannumber', function () {
        return function (input) {
            //Retrieve and return last part.
            var data = input.split("-");
            return data[data.length - 1];
        };
    }).directive('btIconifiednumber', function () {
        return {
            restrict: 'E',
            scope: {
                number: '@'
            },
            controller: function ($scope, $element, $attrs) {
                if ($scope.number.indexOf("PC-") === 0) {
                    $scope.iconclass = 'hdd';
                    $scope.cleannumber = $scope.number.substring(3);
                } else {
                    $scope.iconclass = 'earphone';
                    $scope.cleannumber = $scope.number;
                }
            },
            template: '<span class="glyphicon glyphicon-{{iconclass}}"></span> {{cleannumber}}'
        };
    }).directive('btChangenamebutton', function () {
        return {
            restrict: 'E',
            scope: {
                phone: '@',
                name: '@'
            },
            controller: function ($scope, PhoneBookSvc) {
                $scope.changeName = function (phoneNumber, currentName) {
                    if(phoneNumber !== undefined && phoneNumber !== null) {
                        var newName = window.prompt("Type in new name", currentName);
                        if (newName !== null) {
                            PhoneBookSvc.updateEntry(phoneNumber, newName);
                        }
                    }
                };
            },
            template: '<button ng-click="changeName(phone, name)" title="{{\'PARTICIPANTS.EDIT\' | translate}}"><span class="glyphicon glyphicon-pencil"></span></button>'

        };
    }).directive('btParticipants', function () {
        return {
            restrict: 'E',
            scope: {
            },
            controller: function ($scope, ParticipantSvc, RoomSvc) {
                $scope.participants = ParticipantSvc.getParticipants();
                $scope.currentRoom = RoomSvc.getCurrent();
                $scope.translationData = {
                    phoneNumber: $scope.currentRoom
                };

                $scope.kickParticipant = function (userId) {
                    ParticipantSvc.kickParticipant(userId);
                };

                $scope.muteParticipant = function (userId, muted) {
                    if(muted) {
                        ParticipantSvc.muteParticipant(userId);
                    } else {
                        ParticipantSvc.unmuteParticipant(userId);
                    }
                };

                
                $scope.$on('PhoneBookSvc.update', function(event, phone, name) {
                    angular.forEach($scope.participants, function(p) {
                        if (p.phoneNumber === phone) {
                            p.name = name;
                        }
                    });
                });

            },
            templateUrl: 'assets/templates/bt-participants.html'
        };
    }).directive('btHistory', function () {
        return {
            restrict: 'E',
            scope: {
            },
            controller: function ($scope, $cookieStore, ReportSvc, ParticipantSvc) {
                $scope.history = null;
                $cookieStore.put("participanthistory", []);

                $scope.update = function() {
                    var history = $cookieStore.get("participanthistory"),
                        participants = ParticipantSvc.getParticipants(),
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

                    ReportSvc.findByNumbers(cleansedHistory).then(function (data) {
                        $scope.history = data;
                    });


                };

                $scope.$on('ParticipantSvc.join', function(event, participant) {
                    var history = $cookieStore.get("participanthistory");
                    if (history.indexOf(participant.phoneNumber)<0) {
                        history.push(participant.phoneNumber);
                        $cookieStore.put("participanthistory", history);
                    }
                    $scope.update();
                });

                $scope.$on('ParticipantSvc.leave', function(event, participant) {
                    $scope.update();
                });

                $scope.$on('PhoneBookSvc.update', function(event, phone, name) {
                    angular.forEach($scope.history, function(e) {
                        if (e.phoneNumber === phone) {
                            e.name = name;
                        }
                    });
                });
            },
            templateUrl: 'assets/templates/bt-history.html'
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
            icon: 'user'
        },
        {
            url: "#/settings",
            name: 'NAVIGATION.SETTINGS',
            icon: 'cog'
        },
        {
            url: "http://telesal.dk/wiki",
            name: 'NAVIGATION.HELP',
            icon: 'question-sign'
        }
    ];
}

function RoomDisplayCtrl($scope, RoomSvc) {
    $scope.rooms = null;
    $scope.currentRoom = null;

    $scope.$watch('currentRoom', function () {
        if (RoomSvc.getCurrent() != $scope.currentRoom) {
            RoomSvc.setCurrent($scope.currentRoom);
        }
    });

    $scope.$watch('rooms', function () {
        if ($scope.rooms !== null && $scope.rooms.length > 0 && $scope.currentRoom === null) {
            $scope.currentRoom = $scope.rooms[0];
        }
    });

    $scope.$on("roomChanged", function (event, args) {
        $scope.currentRoom = RoomSvc.getCurrent();
    });

    RoomSvc.getRoomIds().then(function (data) {
        $scope.rooms = data;
    });
}


angular.module('blacktiger-app-mocked', ['blacktiger-app', 'ngMockE2E'])
    .factory('mockinfo', function() {
        var events = [];
        
        this.getEvents = function() {
            return events;
        }
        
        this.setEvents = function(newEvents) {
            events = newEvents;
        }
        
        var self = this;
        
        return {
            getEvents : self.getEvents,
            setEvents: self.setEvents
        }
    })
    .run(function ($httpBackend, mockinfo, $q) {
        var persons = [
            {name: 'Michael Krog', phoneNumber: '+4512345670'},
            {name: 'Hannah Krog', phoneNumber: '+4512345671'},
            {name: 'Kasper Dyrvig', phoneNumber: 'PC-+4512345672'},
            {name: 'Peter Almer Frederiksen', phoneNumber: 'PC-+4512345673'},
            {name: 'Thomas Fredriksen', phoneNumber: '+4512345674'},
            {name: 'Dan Cosmus', phoneNumber: '+4512345675'},
            {name: 'Carit Stypinsky', phoneNumber: '+4512345676'},
            {name: 'Bjarne Jensen', phoneNumber: '+4512345677'},
            {name: 'Børge Lund', phoneNumber: 'PC-+4512345678'},
            {name: 'Åse Nielsen', phoneNumber: '+4512345679'}
            
        ], participants = [], nextUserId = 0, i, date = new Date();
        
        var getPersonByPhoneNumber = function(phoneNumber) {
            var person = null;
            angular.forEach(persons, function(p) {
                if(p.phoneNumber === phoneNumber) {
                    person = p;
                }
            });
            return person;
        };
        
        var addParticipant = function(addEvent) {
            var hasHost = false, participant;
            angular.forEach(participants, function(p) {
                if (p.host === true) {
                   hasHost = true; 
                }
            });
            
            
            if(!hasHost) {
                participant = {
                    userId: String(nextUserId++),
                    muted: false,
                    host: true,
                    phoneNumber: 'DK-0999',
                    dateJoined: date.getTime(),
                    name: 'Rigssal'
                };

            } else {
                var r = Math.floor((Math.random()*10));
                var person = persons[r];
                participant = {
                    userId: String(nextUserId++),
                    muted: true,
                    host: false,
                    phoneNumber: person.phoneNumber,
                    dateJoined: date.getTime(),
                    name: person.name
                };
            }
           
            participants.push(participant);
            if(addEvent) {
                mockinfo.getEvents().push({type:'Join', participant:participant});
            }
            
        };
        
        var maintainParticipantList = function() {
            setTimeout(function() {
                if(participants.length < 15) {
                    addParticipant(true);
                }
                maintainParticipantList();
            }, 5000);
        };
        
        addParticipant();
        maintainParticipantList();
        
        $httpBackend.whenGET('rooms').respond(["09991"]);
        $httpBackend.whenGET('rooms/09991').respond(participants);
        $httpBackend.whenGET(/^rooms\/09991\/changes.?/).respond(function(method, url) {
            var data = {timestamp:0,events:mockinfo.getEvents()};
            mockinfo.setEvents([]);
            return [200, data];
        });
        
        $httpBackend.whenPOST(/^rooms\/09991\/.+\/kick/).respond(function(method, url) {
            var branch = url.split('/');
            var userId = branch[branch.length-2];
            angular.forEach(participants, function(p, index) {
                if(p.userId === userId) {
                    participants.splice(index, 1);
                    mockinfo.getEvents().push({type:'Leave', participant:p});
                    return false;
                }
            });
            return [200];
        });
        
        $httpBackend.whenPOST(/^rooms\/09991\/.+\/mute/).respond(function(method, url) {
            var branch = url.split('/');
            var userId = branch[branch.length-2];
            angular.forEach(participants, function(p, index) {
                if(p.userId === userId) {
                    participants[index].muted = true;
                    mockinfo.getEvents().push({type:'Change', participant:p});
                    return false;
                }
            });
            return [200];
        });
        
        $httpBackend.whenPOST(/^rooms\/09991\/.+\/unmute/).respond(function(method, url) {
            var branch = url.split('/');
            var userId = branch[branch.length-2];
            angular.forEach(participants, function(p, index) {
                if(p.userId === userId) {
                    participants[index].muted = false;
                    mockinfo.getEvents().push({type:'Change', participant:p});
                    return false;
                }
            });
            return [200];
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
                    numberOfCalls: 2,
                    totalDuration: 123,
                    firstCallTimestamp: 1387400754
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
    document.write("<" + "script type='text/javascript' src='assets/js/angular/angular-mocks.js'><" + "/script>");

}
angular.element(document).ready(function () {
    angular.bootstrap(document, ['blacktiger-app' + (mocked ? '-mocked' : '')]);
});
