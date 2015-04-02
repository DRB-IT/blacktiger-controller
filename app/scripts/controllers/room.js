'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('RoomCtrl', function ($scope, IssuesSvc, LoginSvc) {
            $scope.initLogs = [];
            $scope.connected = false;
    
            $scope.getIssues = function() {
                return IssuesSvc.getIssues();
            };
            
            if(LoginSvc.getCurrentUser()) {
                $scope.initLogs.push('Logged in correctly.');
            }
            
            $scope.$on('PushEventSvc.Initializing', function() {
                $scope.initLogs.push('Connecting to Websocket.');
            });
            
            $scope.$on('PushEventSvc.WebsocketConnected', function() {
                $scope.initLogs.push('Has successfully connected to Websocket.');
            });
            
            $scope.$on('PushEventSvc.ResolvingRooms', function() {
                $scope.initLogs.push('Resolving accessible rooms.');
            });
            
            $scope.$on('PushEventSvc.SubscribingEvents', function() {
                $scope.initLogs.push('Subscribing to events.');
            });
            
            $scope.$on('PushEventSvc.NoRooms', function() {
                $scope.initLogs.push('No rooms accessible for user.');
            });
            
            $scope.$on('PushEventSvc.Initialized', function() {
                $scope.initLogs.push('Connected.');
                $scope.connected = true;
            });
        });
