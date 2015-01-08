'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:duration
 * @description
 * # duration
 */
angular.module('blacktiger-directives')
        .directive('btDuration', function () {
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
                        if (angular.isDate($scope.since)) {
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
                templateUrl: 'views/bt-duration.html'
            };
        });
