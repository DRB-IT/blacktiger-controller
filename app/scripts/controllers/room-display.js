'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('RoomDisplayCtrl', function ($scope, $location) {

            $scope.goToTechContact = function () {
                $location.path('/settings/contact');
            };
        });
