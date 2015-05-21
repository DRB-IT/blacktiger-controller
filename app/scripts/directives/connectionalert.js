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
                controller: function ($scope) {
                    $scope.visible = false;

                    $scope.$on('PushEventSvc.Lost_Connection', function() {
                        $scope.visible = true;
                    });
                    
                    $scope.$on('PushEventSvc.Initialized', function() {
                        $scope.visible = false;
                    });
                    
                },
                templateUrl: 'views/bt-connectionalert.html'
            };
        });
