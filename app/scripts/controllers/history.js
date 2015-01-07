'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Used by Admin
 */
angular.module('blacktiger-app')
        .controller('HistoryCtrl', function ($scope, ReportSvc) {
            $scope.searchHistory = function () {
                ReportSvc.getReport().then(function (data) {
                    $scope.historyData = data;
                    $scope.summaryHistory();
                });
            };
            $scope.summaryHistory = function () {
                $scope.sumHalls = 0;
                $scope.sumParticipants = 0;
                $scope.sumPhones = 0;
                $scope.sumCalls = 0;
                var countDuration = 0;
                angular.forEach($scope.historyData, function (entry) {
                    if (entry.type === 'Host') {
                        $scope.sumHalls++;
                    } else {
                        $scope.sumParticipants++;
                        $scope.sumCalls += entry.numberOfCalls;
                        countDuration += entry.totalDuration;
                        if (entry.type === 'Phone') {
                            $scope.sumPhones++;
                        }
                    }
                });
                $scope.sumAverage = $scope.sumParticipants / $scope.sumHalls;
                $scope.sumDuration = countDuration / $scope.sumParticipants;
                $scope.minDuration = $scope.duration;
                $scope.predicate = 'firstCallTimestamp';
            };
        });
