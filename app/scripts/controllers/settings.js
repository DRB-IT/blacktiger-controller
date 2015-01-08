'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('SettingsCtrl', function ($scope, LoginSvc, localStorageService) {

            $scope.canDisconnectCalls = localStorageService.get('CanDisconnectCalls');
            $scope.logout = function () {
                LoginSvc.deauthenticate();
            };

            $scope.$watch('canDisconnectCalls', function () {
                localStorageService.add('CanDisconnectCalls', $scope.canDisconnectCalls);
            });
        });
