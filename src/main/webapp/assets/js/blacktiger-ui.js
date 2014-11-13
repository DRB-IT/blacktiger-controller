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
                $scope.duration = Math.max((new Date().getTime() - $scope.since.getTime()) / 60000, 0);
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
            scope.participants = [];
            scope.isHostInConference = function () {
                var value = false;
                angular.forEach(scope.participants, function (p) {
                    if (p.host === true) {
                        value = true;
                        return false;
                    }
                });
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

            scope.kickParticipant = function (channel) {
                MeetingSvc.kickByRoomAndChannel(scope.roomNumber, channel);
            };

            scope.muteParticipant = function (channel) {
                MeetingSvc.muteByRoomAndChannel(scope.roomNumber, channel);
            };
            
            scope.unmuteParticipant = function (channel) {
                MeetingSvc.unmuteByRoomAndChannel(scope.roomNumber, channel);
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
                if (angular.isString(scope.roomNumber)) {
                    scope.room = MeetingSvc.findRoom(scope.roomNumber);
                }
            };

            scope.$watch('roomNumber', scope.refresh);
            scope.$on('Meeting.Join', scope.refresh);
            scope.$on('Meeting.Leave', scope.refresh);
            
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

            scope.calculateTotalDuration = function (entry) {
                var duration = 0;
                angular.forEach(entry.calls, function (call) {
                    if (call.end !== null) {
                        duration += call.end - call.start;
                    }
                });
                return duration;
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
                }
            };

            scope.$watch('room', scope.refresh);
            scope.$on('History.Updated', scope.refresh);

        },
        templateUrl: 'assets/templates/bt-history.html'
    };
}

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
        .filter('timespan', TimespanFilter);