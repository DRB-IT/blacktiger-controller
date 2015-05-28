'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:commentAlert
 * @description
 * # commentAlert
 */
angular.module('blacktiger-directives')
        .directive('btConnectionAlert', function () {
            return {
                restrict: 'E',
                controller: function ($scope, $interval) {
                    $scope.visible = false;

                    $scope.stopCounter = function() {
                        if(angular.isDefined($scope.countdownInterval)) {
                            $interval.cancel($scope.countdownInterval);
                        }
                        delete $scope.countdownInterval;
                    };
                    
                    $scope.startCounter = function() {
                        $scope.stopCounter();
                        
                        $scope.countdown = 10;
                        $scope.countdownInterval = $interval(function() {
                            $scope.countdown--;
                        }, 1000);
                    };
                    
                    $scope.$on('PushEventSvc.Lost_Connection', function() {
                        $scope.visible = true;
                        $scope.startCounter();
                    });
                    
                    $scope.$on('PushEventSvc.Initialized', function() {
                        $scope.visible = false;
                    });
                    
                    $scope.$on('PushEventSvc.Reconnecting', function() {
                        $scope.startCounter();
                    });
                    
                    $scope.$on('$destroy', function() {
                        $scope.stopCounter();
                    });
                    
                },
                templateUrl: 'views/bt-connectionalert.html'
            };
        });
