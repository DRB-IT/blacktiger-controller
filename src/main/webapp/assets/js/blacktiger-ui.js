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

angular.module('blacktiger-ui', [])
    .controller('ModalEditNameCtrl', ModalEditNameCtrl)
    .directive('btNumberIcon', function () {
        return {
            restrict: 'E',
            scope: {
                type: '@'
            },
            controller: function ($scope, $element, $attrs) {
                if ($scope.type === 'Sip') {
                    $scope.iconclass = 'hdd';
                } else if ($scope.type === 'Phone'){
                    $scope.iconclass = 'earphone';
                } else {
                    $scope.iconclass = 'flash';
                }
            },
            template: '<span class="glyphicon glyphicon-{{iconclass}}" ></span>'
        };
    }).directive('btRoomStatus', function () {
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
    }).directive('btRoomInfo', function () {
        return {
            restrict: 'E',
            scope: {
                room: '=',
                contactLink: '@'
            },
            templateUrl: 'assets/templates/bt-room-info.html'
        };
    }).directive('btDuration', function () {
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
    }).directive('btMeetingRoom', function (MeetingSvc, $modal, PhoneBookSvc) {
        return {
            restrict: 'E',
            scope: {
                
            },
            link: function(scope, elements, attrs) {
                scope.participants = MeetingSvc.getParticipantList();
    
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

                scope.kickParticipant = function (channel) {
                    MeetingSvc.kick(channel);
                };

                scope.muteParticipant = function (channel, muted) {
                    if (muted) {
                        MeetingSvc.mute(channel);
                    } else {
                        MeetingSvc.unmute(channel);
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

                scope.$on('PhoneBookSvc.update', function (event, phone, name) {
                    // Make sure names in participantlist are update.
                    angular.forEach(scope.participants, function (p) {
                        if (p.phoneNumber === phone) {
                            p.name = name;
                        }
                    });
                });
            },
            templateUrl: 'assets/templates/bt-meeting-room.html'
        };
    }).directive('btHistory', function ($cookieStore, PhoneBookSvc, MeetingSvc, blacktiger, $modal, $log) {
        return {
            restrict: 'E',
            scope: {
                
            },
            link: function(scope, elements, attrs) {
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

                scope.$on('PhoneBookSvc.update', function (event, phone, name) {
                    // Make sure names in historydata in cookie is updated and update history display.
                    var history = $cookieStore.get(scope.historyCookieName);
                    angular.forEach(history, function (entry) {
                        if (phone === entry.phoneNumber) {
                            entry.name = name;
                        }
                    });
                    $cookieStore.put(scope.historyCookieName, history);
                    scope.updateHistory();
                });
                
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
                    var count = 0, history = $cookieStore.get(scope.historyCookieName);
                    angular.forEach(history, function (entry) {
                        if (callerId === entry.callerId) {
                            count = entry.calls.length;
                        }
                    });

                    return count;
                };
                
                scope.updateHistory = function () {
                    var history = $cookieStore.get(scope.historyCookieName),
                        participants = MeetingSvc.getParticipantList(),
                        cleansedHistory = {};

                    angular.forEach(history, function (entry) {
                        var stillParticipating = false;
                        angular.forEach(participants, function (participant) {
                            if (participant.callerId === entry.callerId) {
                                stillParticipating = true;
                                return false;
                            }
                        });

                        if (!stillParticipating && !entry.host) {
                            cleansedHistory[entry.callerId] = entry;
                        }
                    });

                    scope.history = cleansedHistory;
                };

                scope.deleteHistory = function () {
                    $cookieStore.put(scope.historyCookieName, []);
                    scope.updateHistory();
                };

                scope.initHistory = function () {
                    if (MeetingSvc.getRoom() !== null) {
                        scope.historyCookieName = 'meetingHistory-' + MeetingSvc.getRoom().id + '-' + blacktiger.getInstanceId();
                        scope.history = $cookieStore.get(scope.historyCookieName);
                        if (!scope.history || angular.isArray(scope.history)) {
                            scope.history = {};
                            $cookieStore.put(scope.historyCookieName, {});
                        }
                    }
                };

                scope.noOfHistoryEntries = function () {
                    return Object.keys(scope.history).length;
                };
                
                scope.$on('MeetingSvc.Join', function (event, participant) {
                    //Ignore the host. It will not be part of the history.
                    if (participant.host) {
                        return;
                    }

                    $log.debug('New participants - adding to history.');
                    var entry, call, history = $cookieStore.get(scope.historyCookieName),
                        key = participant.callerId;
                    if (history[key] === undefined) {
                        entry = {
                            type: participant.type,
                            callerId: participant.callerId,
                            phoneNumber: participant.phoneNumber,
                            name: participant.name,
                            firstCall: new Date().getTime(),
                            calls: []
                        };
                        history[key] = entry;
                    } else {
                        entry = history[key];
                    }

                    call = {
                        start: new Date().getTime(),
                        end: null
                    };
                    entry.calls.push(call);

                    $cookieStore.put(scope.historyCookieName, history);
                    scope.updateHistory();

                });

                scope.$on('MeetingSvc.Leave', function (event, participant) {
                    $log.debug('MeetingSvc.leave event received - updating history.');
                    var history = $cookieStore.get(scope.historyCookieName),
                        entry,
                        key = participant.callerId;
                    entry = history[key];
                    if (entry) {
                        angular.forEach(entry.calls, function (call) {
                            if (call.end === null) {
                                call.end = new Date().getTime();
                                $cookieStore.put(scope.historyCookieName, history);
                                return false;
                            }
                        });
                    }
                    scope.updateHistory();
                });

                scope.$on('MeetingSvc.RoomChanged', scope.initHistory);
                scope.initHistory();

            },
            templateUrl: 'assets/templates/bt-history.html'
        };
    }).directive('modalWindow', function ($timeout) {
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
    }).filter('timespan', function () {
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
    });