'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Used by Admin
 */
angular.module('blacktiger-controllers')
        .controller('RealtimeCtrl', function ($scope, SystemSvc, MeetingSvc, $interval) {
            $scope.system = {};

            $scope.getNoOfRooms = function () {
                return MeetingSvc.getTotalRooms();
            };

            $scope.getNoOfParticipantsPerRoom = function () {
                var noParticipants = $scope.getNoOfParticipants();
                var noRooms = $scope.getNoOfRooms();
                if (noParticipants === 0 || noRooms === 0) {
                    return 0;
                } else {
                    return $scope.getNoOfParticipants() / noRooms;
                }
            };

            $scope.getNoOfParticipants = function () {
                return MeetingSvc.getTotalParticipants();
            };

            $scope.getSipPercentage = function () {
                var count = MeetingSvc.getTotalParticipantsByType('Sip');
                if (count === 0) {
                    return 0.0;
                } else {
                    return (count / $scope.getNoOfParticipants()) * 100;
                }
            };

            $scope.getPhonePercentage = function () {
                if ($scope.getNoOfParticipants() === 0) {
                    return 0.0;
                } else {
                    return 100 - $scope.getSipPercentage();
                }
            };

            $scope.getNoOfCommentRequests = function () {
                return MeetingSvc.getTotalParticipantsByCommentRequested(true);
            };

            $scope.getNoOfOpenMicrophones = function () {
                return MeetingSvc.getTotalParticipantsByMuted(false);
            };

            $scope.updateSystemInfo = function () {
                SystemSvc.getSystemInfo().then(function (data) {
                    $scope.system = data;
                });
            };

            $scope.$on('$destroy', function () {
                $scope.stopLoad();
            });

            $scope.stopLoad = $interval($scope.updateSystemInfo, 2000);
            $scope.updateSystemInfo();
        });
