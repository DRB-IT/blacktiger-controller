'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:numberIcon
 * @description
 * # numberIcon
 */
angular.module('blacktiger-directives')
        .directive('btNumberIcon', function () {
            return {
                restrict: 'E',
                scope: {
                    type: '@'
                },
                controller: function ($scope) {
                    if ($scope.type === 'Sip' || $scope.type === 'Hall') {
                        $scope.iconclass = 'hdd';
                    } else if ($scope.type === 'Phone') {
                        $scope.iconclass = 'earphone';
                    } else {
                        $scope.iconclass = 'flash';
                    }
                },
                template: '<span class="glyphicon glyphicon-{{iconclass}}" ></span>'
            };
        });
