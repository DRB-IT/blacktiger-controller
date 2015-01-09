'use strict';

/**
 * @ngdoc filter
 * @name blacktiger-app.filter:timespan
 * @function
 * @description
 * # timespan
 * Converts milliseconds to a timespan visualized as hours as minutes(HH:mm).
 */
angular.module('blacktiger-filters')
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
