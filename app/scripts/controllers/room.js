'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('RoomCtrl', function ($scope, IssuesSvc) {
            $scope.getIssues = function() {
                return IssuesSvc.getIssues();
            };
        });
