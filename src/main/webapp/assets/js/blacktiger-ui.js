/*global angular*/
function ModalEditNameCtrl($scope, $modalInstance, phoneNumber, currentName) {
    $scope.data = {
        name: currentName,
        phoneNumber: phoneNumber
    };

    $scope.ok = function () {
        $modalInstance.close($scope.data.name);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function NumberIconDirective() {
    return {
        restrict: 'E',
        scope: {
            type: '@'
        },
        controller: function ($scope, $element, $attrs) {
            if ($scope.type === 'Sip') {
                $scope.iconclass = 'hdd';
            } else if ($scope.type === 'Phone') {
                $scope.iconclass = 'earphone';
            } else {
                $scope.iconclass = 'flash';
            }
        },
        template: '<span class="glyphicon glyphicon-{{iconclass}}" ></span>'
    };
}

function RoomStatusDirective() {
    return {
        restrict: 'E',
        scope: {
            room: '='
        },
        controller: function ($scope, $element, $attrs) {
            $element.find('thead').on('click', function () {
                $element.find('tbody').toggleClass('hidden');
            });

            $scope.$watch('room', function () {
                $scope.noOfOpenMicrophones = 0;
                $scope.noOfCommentRequests = 0;
                $scope.noOfSipPhones = 0;
                $scope.noOfRegularPhones = 0;
                $scope.noOfMissingNames = 0;

                angular.forEach($scope.room.participants, function (p) {
                    if (!p.host) {
                        if (!p.muted) {
                            $scope.noOfOpenMicrophones++;
                        }

                        if (p.commentRequested) {
                            $scope.noOfCommentRequests++;
                        }

                        if (p.phoneNumber.indexOf('#') === 0) {
                            $scope.noOfSipPhones++;
                        } else {
                            $scope.noOfRegularPhones++;
                        }

                        if (p.name === null || p.name === '') {
                            $scope.noOfMissingNames++;
                        }
                    }

                });
            }, true);
        },
        templateUrl: 'assets/templates/bt-room-status.html'
    };
}

function RoomInfoDirective() {
    return {
        restrict: 'E',
        scope: {
            room: '=',
            contactLink: '@'
        },
        templateUrl: 'assets/templates/bt-room-info.html'
    };
}

function DurationDirective() {
    return {
        restrict: 'E',
        scope: {
            since: '=',
        },
        controller: function ($scope, $interval) {
            $scope.duration = 0;

            if (angular.isNumber($scope.since)) {
                $scope.since = new Date($scope.since);
            }

            $scope.updateDuration = function () {
                if(angular.isDate($scope.since)) {
                    $scope.duration = Math.max((new Date().getTime() - $scope.since.getTime()) / 60000, 0);
                } else {
                    $scope.duration = 0;
                }
            };

            $scope.task = $interval($scope.updateDuration, 5000);

            $scope.$on('$destroy', function () {
                $interval.cancel($scope.task);
            });

            $scope.updateDuration();
        },
        templateUrl: 'assets/templates/bt-duration.html'
    };
}

function MeetingRoomDirective(MeetingSvc, HistorySvc, $modal, PhoneBookSvc, $log) {
    return {
        restrict: 'E',
        scope: {
            roomNumber: '@room'
        },
        link: function (scope, elements, attrs) {
            $log.debug("Initializing MeetingRoomDirective.");
            scope.isHostInConference = function () {
                var value = false;
                if(scope.room && angular.isArray(scope.room.participants)) {
                    angular.forEach(scope.room.participants, function (p) {
                        if (p.host === true) {
                            value = true;
                        }
                    });
                }
                return value;
            };
            
            scope.noOfCallsForCallerId = function(callerId) {
                var entry = HistorySvc.findOneByRoomAndCallerId(scope.roomNumber, callerId);
                if(entry) {
                    return entry.calls.length;
                } else {
                    return 0;
                }
            };

            scope.kickParticipant = function (participant) {
                MeetingSvc.kickByRoomAndChannel(scope.roomNumber, participant);
            };

            scope.muteParticipant = function (participant) {
                MeetingSvc.muteByRoomAndChannel(scope.roomNumber, participant);
            };
            
            scope.unmuteParticipant = function (participant) {
                MeetingSvc.unmuteByRoomAndChannel(scope.roomNumber, participant);
            };

            scope.getNoOfParticipants = function() {
                if(!angular.isObject(scope.room) || !angular.isArray(scope.room.participants)) {
                    return 0;
                } else {
                    return scope.room.participants.length;
                }
            };
            
            scope.changeName = function (phoneNumber, currentName) {
                var modalInstance = $modal.open({
                    templateUrl: 'assets/templates/modal-edit-name.html',
                    controller: 'ModalEditNameCtrl',
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
            };

            scope.refresh = function () {
                $log.debug("Refreshing room [roomNo="+scope.roomNumber+"]");
                if (angular.isString(scope.roomNumber) && MeetingSvc.hasRoom(scope.roomNumber)) {
                    scope.room = MeetingSvc.findRoom(scope.roomNumber);
                    if(!scope.room) {
                        $log.error("Specified room not found [roomNo="+scope.roomNumber+"]")
                    } else {
                        $log.debug("Room set [room="+scope.room+"]")
                    }
                } else {
                    scope.room = {
                        participants: []
                    }
                }
            };
            
            scope.getTotalDuration = function (participant) {
                if(scope.room) {
                    return HistorySvc.getTotalDurationByRoomAndCallerId(scope.room.id, participant.callerId);
                } else {
                    return 0;
                }
            };

            scope.$watch('roomNumber', scope.refresh);
            scope.$on('Meeting.Start', scope.refresh);
            scope.$on('Meeting.Join', scope.refresh);
            scope.$on('Meeting.Leave', scope.refresh);
            scope.$on('Meeting.Change', scope.refresh);
            scope.refresh();
        },
        templateUrl: 'assets/templates/bt-meeting-room.html'
    };
}
MeetingRoomDirective.$inject = ['MeetingSvc', 'HistorySvc', '$modal', 'PhoneBookSvc', '$log'];

function HistoryDirective(HistorySvc, PhoneBookSvc, $modal, $log) {
    return {
        restrict: 'E',
        scope: {
            room: '@'
        },
        link: function (scope, elements, attrs) {
            scope.history = [];
            scope.reverse = true;
            scope.predicate = 'totalDuration';
            
            scope.changeName = function (phoneNumber, currentName) {
                var modalInstance = $modal.open({
                    templateUrl: 'assets/templates/modal-edit-name.html',
                    controller: 'ModalEditNameCtrl',
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
            };
            
            scope.getTotalDuration = function (entry) {
                if(scope.room) {
                    return HistorySvc.getTotalDurationByRoomAndCallerId(scope.room.id, entry.callerId);
                } else {
                    return 0;
                }
            };

            scope.noOfCallsForCallerId = function (callerId) {
                var entry = HistorySvc.findOne(callerId);
                if (entry) {
                    return entry.calls.length;
                } else {
                    return 0;
                }
            };

            scope.deleteHistory = function () {
                HistorySvc.deleteAll();
            };

            scope.refresh = function () {
                if (angular.isString(scope.room)) {
                    scope.history = HistorySvc.findAllByRoomAndActive(scope.room, false);
                    if(!angular.isArray(scope.history)) {
                        scope.history = [];
                    }
                    scope.decorate();
                }
            };
            
            scope.decorate = function() {
                angular.forEach(scope.history, function(entry) {
                    entry.totalDuration = HistorySvc.getTotalDurationByRoomAndCallerId(scope.room, entry.callerId);
                });
            };
            
            scope.sortBy = function(predicate) {
                if(scope.predicate === predicate) {
                    scope.reverse = !scope.reverse;
                } else {
                    scope.predicate = predicate;
                    scope.reverse = false;
                }
            };

            scope.$watch('room', scope.refresh);
            scope.$on('History.Updated', scope.refresh);

        },
        templateUrl: 'assets/templates/bt-history.html'
    };
}
HistoryDirective.$inject = ['HistorySvc', 'PhoneBookSvc', '$modal', '$log'];

function ModalWindowDirective($timeout) {
    return {
        restrict: 'EA',
        link: function (scope, element) {
            // Makes sure that if the first input field of the modal is focused - if it has any.
            $timeout(function () {
                var em = element.find('input');
                if (em.length > 0) {
                    var em1 = em[0];
                    em1.focus();
                    em1.select();
                }
            }, 100);

        }
    };
}
ModalWindowDirective.$inject = ['$timeout'];

function btCommentAlert() {
    return {
        restrict: 'E',
        controller: function ($scope, MeetingSvc) {
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
            
            $scope.$watch('context.room', function(room) {
                if(room) {
                    $scope.participants = room.participants;
                } else {
                    $scope.participants = [];
                }
            })
        },
        templateUrl: 'assets/templates/bt-commentalert.html'
    };
}

function btMusicPlayer() {
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
                var numbers = [],
                    i;
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
                $scope.random = !$scope.random;
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
                var nameArray = [],
                    i;
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
}

function btCommentRequestHighlighter(CONFIG, $timeout) {
    return {
        restrict: 'A',
        scope: {
            participant: '='
        },
        link: function (scope, element, attrs) {
            scope.$watch('participant.commentRequested', function (value) {
                if (value === true) {
                    element.addClass('shake');
                    $timeout(function () {
                        element.removeClass('shake');
                    }, CONFIG.hightlightTimeout);
                } else {
                    element.removeClass('shake');
                }
            });
        }
    };
}
btCommentRequestHighlighter.$inject = ['CONFIG', '$timeout'];

function TimespanFilter() {
    return function (input) {
        var out = "";
        if (!isNaN(input)) {
            var seconds = input / 1000;
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds % 3600) / 60);
            out = hours + ':' + (minutes > 9 ? '' : '0') + minutes;
        }
        return out;
    };
}

angular.module('blacktiger-ui', ['blacktiger-service', 'pascalprecht.translate', 'ui.bootstrap', 'teljs'])
        .controller('ModalEditNameCtrl', ModalEditNameCtrl)
        .directive('btNumberIcon', NumberIconDirective)
        .directive('btRoomStatus', RoomStatusDirective)
        .directive('btRoomInfo', RoomInfoDirective)
        .directive('btDuration', DurationDirective)
        .directive('btMeetingRoom', MeetingRoomDirective)
        .directive('btHistory', HistoryDirective)
        .directive('modalWindow', ModalWindowDirective)
        .directive('btCommentAlert', btCommentAlert)
        .directive('btMusicplayer', btMusicPlayer)
        .directive('btCommentRequestHighlight', btCommentRequestHighlighter)

        .filter('timespan', TimespanFilter);