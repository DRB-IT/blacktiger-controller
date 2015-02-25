'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('LoginCtrl', function ($scope, LoginSvc) {
            $scope.username = '';
            $scope.password = '';
            $scope.rememberMe = false;
            $scope.status = null;

            $scope.login = function () {
                LoginSvc.authenticate($scope.username, $scope.password, $scope.rememberMe).then(function () {
                    $scope.status = 'success';
                }, function (rejection) {
                    if(rejection.status === 0) {
                        $scope.status = 'no-contact';
                    } else {
                        $scope.status = 'invalid';
                    }
                });
            };
        });
