'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:ModalEditNameCtrl
 * @description
 * 
 */
angular.module('blacktiger-controllers')
        .controller('ModalEditNameCtrl', function ($scope, $modalInstance, phoneNumber, currentName) {
            $scope.data = {
                name: currentName,
                phoneNumber: phoneNumber
            };

            $scope.ok = function () {
                $modalInstance.close($scope.data.name);
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        });
