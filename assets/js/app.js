/*************************************** MODULE ********************************************/

var blacktigerApp = angular.module('blacktiger-app', ['ngRoute', 'pascalprecht.translate', 'blacktiger'])
    .config(function ($locationProvider, $routeProvider, $translateProvider) {
        $routeProvider.
        when('/', {
            controller: RoomCtrl,
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
                $scope.participants = [];
                $scope.currentRoom = RoomSvc.getCurrent();
                $scope.translationData = {
                    phoneNumber: $scope.currentRoom
                };

                $scope.refresh = function () {
                    return ParticipantSvc.findAll().then(function(data) {
                        $scope.participants = data;
                    });
                };

                $scope.waitForChanges = function () {
                    /*ParticipantSvc.waitForChanges().then(function(data, status, headers, config) {
                        $scope.refresh().then(function(){
                            $scope.waitForChanges();
                        });
                    }, function(data, status, headers, config) {
                        window.setTimeout(function() {
                            $scope.$apply(function() {
                                $scope.waitForChanges();
                            });
                        }, 10000);
                    });*/
                };

                $scope.kickParticipant = function (userId) {
                    ParticipantSvc.kickParticipant(userId).then(function (data) {
                        var index = $scope.getIndexForUserId(userId);
                        if (index >= 0) {
                            $scope.participants.splice(index, 1);
                        }
                    });
                };

                $scope.muteParticipant = function (userId, muted) {
                    var participant = $scope.findOne(userId);
                    if (participant !== null) {
                        participant.muted = muted;
                        ParticipantSvc.muteParticipant(userId, muted).then(function (data) {
                            var index = $scope.getIndexForUserId(userId);
                            if (index >= 0) {
                                $scope.participants[index].muted = muted;
                            }
                        });
                    }
                };

                $scope.findOne = function (userId) {
                    for (var i = 0; i < $scope.participants.length; i++) {
                        if ($scope.participants[i].userId === userId) {
                            return $scope.participants[i];
                        }
                    }
                    return null;
                };

                $scope.getIndexForUserId = function (userId) {
                    var index = -1;
                    for (var i = 0; i < $scope.participants.length; i++) {
                        if ($scope.participants[i].userId === userId) {
                            index = i;
                            break;
                        }
                    }

                    return index;
                };

                $scope.$on("roomChanged", function (event, args) {
                    $scope.refresh();
                    $scope.waitForChanges();
                    $scope.currentRoom = RoomSvc.getCurrent();
                });

                $scope.$on('PhoneBookSvc.update', function(event, phone, name) {
                    angular.forEach($scope.participants, function(p) {
                        if (p.phoneNumber === phone) {
                            p.name = name;
                        }
                    });
                });

                $scope.refresh();
                $scope.waitForChanges();
            },
            templateUrl: 'assets/templates/bt-participants.html'
        };
    }).directive('btHistory', function () {
        return {
            restrict: 'E',
            scope: {
            },
            controller: function ($scope, ReportSvc) {
                $scope.history = null;
                ReportSvc.findByNumber().then(function (data) {
                    $scope.history = data;
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

function RoomCtrl($scope) {

}

angular.module('blacktiger-app-mocked', ['blacktiger-app', 'ngMockE2E'])
    .run(function ($httpBackend) {
        participants = [
            {
                "userId": "1",
                "muted": true,
                "host": false,
                "phoneNumber": "PC-+4551923192",
                "dateJoined": 1382383383744,
                "name": "Michael Krog"
            },
            {
                "userId": "2",
                "muted": false,
                "host": true,
                "phoneNumber": "DK-0999",
                "dateJoined": 1382383401553,
                "name": "Test-rigssal"
            },
            {
                "userId": "3",
                "muted": true,
                "host": false,
                "phoneNumber": "+4551923171",
                "dateJoined": 1382383401553,
                "name": "Hannah Krog"
            },
            {
                "userId": "4",
                "muted": true,
                "host": false,
                "phoneNumber": "+4512341234",
                "dateJoined": 1382383401553,
                "name": "Kasper Dyrvig"
            }

        ];
        report = [
            {
                phoneNumber: "PC-+4551923192",
                name: "Michael Krog",
                numberOfCalls: 2,
                totalDuration: 123,
                firstCallTimestamp: 1387400754
            },
            {
                phoneNumber: "+4551923171",
                name: "Hannah Krog",
                numberOfCalls: 4,
                totalDuration: 2343,
                firstCallTimestamp: 1387400754
            },
            {
                phoneNumber: "+4512341234",
                name: "Kasper Dyrvig",
                numberOfCalls: 1,
                totalDuration: 2333,
                firstCallTimestamp: 1387400754
            }
        ];

        $httpBackend.whenGET('rooms').respond(["09991"]);
        $httpBackend.whenGET('rooms/09991').respond(participants);
        $httpBackend.whenPOST(/^rooms\/09991\/.?/).respond();
        $httpBackend.whenGET(/^rooms\/09991\/changes.?/).respond();

        $httpBackend.whenGET(/^reports\/.?/).respond(report);

        $httpBackend.whenPOST(/^phonebook\/.?/).respond();

        $httpBackend.whenGET(/^assets\/.?/).passThrough();

        $httpBackend.whenGET(/^http:\/\/telesal.s3.amazonaws.com\/.?/).passThrough();
    });


/** BOOTSTRAP **/
var mocked = false;

function isTest() {
    var loc = window.location.toString();
    return loc.indexOf('http://localhost') === 0 || 
        loc.indexOf('file://') === 0 || 
        loc.indexOf('http://drb-it.github.io') === 0;
}

if (isTest() && window.location.search !== '?prod') {
    var mocked = true;
    document.write("<" + "script type='text/javascript' src='assets/js/angular/angular-mocks.js'><" + "/script>");

}
angular.element(document).ready(function () {
    angular.bootstrap(document, ['blacktiger-app' + (mocked ? '-mocked' : '')]);
});
