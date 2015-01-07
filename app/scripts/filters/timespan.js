'use strict';

/**
 * @ngdoc filter
 * @name blacktiger-app.filter:timespan
 * @function
 * @description
 * # timespan
 * Filter in the blacktiger-app.
 */
angular.module('blacktiger-app')
        .filter('timespan', function () {
            return function (input) {
                var out = '';
                if (!isNaN(input)) {
                    var seconds = input / 1000;
                    var hours = Math.floor(seconds / 3600);
                    var minutes = Math.floor((seconds % 3600) / 60);
                    out = hours + ':' + (minutes > 9 ? '' : '0') + minutes;
                }
                return out;
            };
        });
