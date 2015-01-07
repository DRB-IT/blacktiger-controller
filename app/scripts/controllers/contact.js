'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-app')
        .controller('ContactCtrl', function ($scope, RoomSvc) {
            $scope.contact = angular.copy($scope.context.room.contact);
            $scope.contactStatus = null;

            $scope.updateContact = function () {
                $scope.contactStatus = 'Saving';
                $scope.context.room.contact = angular.copy($scope.contact);

                //We need to remove participants before we save the room because the server does not expect the participants.
                var room = angular.copy($scope.context.room);
                delete room.participants;
                RoomSvc.save(room).$promise.then(function () {
                    $scope.contactStatus = 'Saved';
                });
            };
        });
