'use strict';

/**
 * @ngdoc filter
 * @name blacktigerControllerApp.filter:filterByRoles
 * @function
 * @description
 * # filterByRoles
 * Filters entries in input by given roles. 
 * The filter looks at each entry's property 'requiredRole'.
 * 
 * If the entry has no 'requiredRole' property or the value of the 'requiredRole property is among the givne roles, then the entry will be among the output entries.
 */
angular.module('blacktiger-filters')
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
