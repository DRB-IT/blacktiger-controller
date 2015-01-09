'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:roomInfo
 * @description
 * # roomInfo
 */
angular.module('blacktiger-directives')
        .directive('btRoomInfo', function () {
            return {
                restrict: 'E',
                scope: {
                    room: '=',
                    contactLink: '@'
                },
                templateUrl: 'views/bt-room-info.html'
            };
        });
