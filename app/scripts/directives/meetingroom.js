'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:meetingRoom
 * @description
 * # meetingRoom
 */
angular.module('blacktiger-app')
        .directive('btMeetingRoom', function ($log, localStorageService, HistorySvc, MeetingSvc, PhoneBookSvc, $modal) {
            return {
                restrict: 'E',
                scope: {
                    roomNumber: '@room'
                },
                link: function (scope) {
                    $log.debug('Initializing MeetingRoomDirective.');

                    scope.canDisconnectCalls = localStorageService.get('CanDisconnectCalls') === 'True';
                    scope.isHostInConference = function () {
                        var value = false;
                        if (scope.room && angular.isArray(scope.room.participants)) {
                            angular.forEach(scope.room.participants, function (p) {
                                if (p.host === true) {
                                    value = true;
                                }
                            });
                        }
                        return value;
                    };

                    scope.noOfCallsForCallerId = function (callerId) {
                        var entry = HistorySvc.findOneByRoomAndCallerId(scope.roomNumber, callerId);
                        if (entry) {
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

                    scope.getNoOfParticipants = function () {
                        if (!angular.isObject(scope.room) || !angular.isArray(scope.room.participants)) {
                            return 0;
                        } else {
                            return scope.room.participants.length;
                        }
                    };

                    scope.changeName = function (phoneNumber, currentName) {
                        var modalInstance = $modal.open({
                            templateUrl: 'views/modal-edit-name.html',
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
                        $log.debug('Refreshing room [roomNo=' + scope.roomNumber + ']');
                        if (angular.isString(scope.roomNumber) && MeetingSvc.hasRoom(scope.roomNumber)) {
                            scope.room = MeetingSvc.findRoom(scope.roomNumber);
                            if (!scope.room) {
                                $log.error('Specified room not found [roomNo=' + scope.roomNumber + ']');
                            } else {
                                $log.debug('Room set [room=' + scope.room + ']');
                            }
                        } else {
                            scope.room = {
                                participants: []
                            };
                        }
                    };

                    scope.getTotalDuration = function (participant) {
                        if (scope.room) {
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
                templateUrl: 'views/bt-meeting-room.html'
            };
        });
