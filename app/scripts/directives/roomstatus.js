'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:roomStatus
 * @description
 * # roomStatus
 */
angular.module('blacktiger-directives')
        .directive('btRoomStatus', function () {
            return {
                restrict: 'E',
                scope: {
                    room: '='
                },
                controller: function ($scope, $element) {
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
                templateUrl: 'views/bt-room-status.html'
            };
        });
