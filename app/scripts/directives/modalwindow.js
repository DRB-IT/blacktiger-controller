'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:modalWindow
 * @description
 * # modalWindow
 */
angular.module('blacktiger-directives')
        .directive('modalWindow', function ($timeout) {
            return {
                restrict: 'EA',
                link: function (scope, element) {
                    // Makes sure that if the first input field of the modal is focused - if it has any.
                    $timeout(function () {
                        var em = element.find('input');
                        if (em.length > 0) {
                            var em1 = em[0];
                            em1.focus();
                            em1.select();
                        }
                    }, 100);

                }
            };
        });
