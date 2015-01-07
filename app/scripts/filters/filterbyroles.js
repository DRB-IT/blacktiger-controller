'use strict';

/**
 * @ngdoc filter
 * @name blacktigerControllerApp.filter:filterByRoles
 * @function
 * @description
 * # filterByRoles
 * Filter in the blacktigerControllerApp.
 */
angular.module('blacktiger-app')
        .filter('filterByRoles', function () {
            return function (input, roles) {
                var out = [];
                angular.forEach(input, function (entry) {
                    if (!entry.requiredRole || (roles && roles.indexOf(entry.requiredRole) >= 0)) {
                        out.push(entry);
                    }
                });
                return out;
            };
        });
