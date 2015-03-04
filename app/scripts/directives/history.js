'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:history
 * @description
 * # history
 */
angular.module('blacktiger-directives')
        .directive('btHistory', function ($modal, PhoneBookSvc, HistorySvc) {
            return {
                restrict: 'E',
                scope: {
                    room: '@'
                },
                link: function (scope) {
                    scope.history = [];
                    scope.reverse = true;
                    scope.predicate = 'totalDuration';

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

                    scope.getTotalDuration = function (entry) {
                        if (scope.room) {
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
                        HistorySvc.deleteAll(true);
                    };

                    scope.refresh = function () {
                        if (angular.isString(scope.room)) {
                            scope.history = HistorySvc.findAllByRoomAndActive(scope.room, false);
                            if (!angular.isArray(scope.history)) {
                                scope.history = [];
                            }
                            scope.decorate();
                        }
                    };

                    scope.decorate = function () {
                        angular.forEach(scope.history, function (entry) {
                            entry.totalDuration = HistorySvc.getTotalDurationByRoomAndCallerId(scope.room, entry.callerId);
                        });
                    };

                    scope.sortBy = function (predicate) {
                        if (scope.predicate === predicate) {
                            scope.reverse = !scope.reverse;
                        } else {
                            scope.predicate = predicate;
                            scope.reverse = false;
                        }
                    };

                    scope.$watch('room', scope.refresh);
                    scope.$on('History.Updated', scope.refresh);

                },
                templateUrl: 'views/bt-history.html'
            };
        });
