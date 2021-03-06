'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:commentRequestHighlight
 * @description
 * # commentRequestHighlighter
 */
angular.module('blacktiger-directives')
        .directive('btCommentRequestHighlight', function ($timeout, CONFIG) {
            return {
                restrict: 'A',
                scope: {
                    participant: '='
                },
                link: function (scope, element) {
                    scope.$watch('participant.commentRequested', function (value) {
                        if (value === true) {
                            element.addClass('shake');
                            $timeout(function () {
                                element.removeClass('shake');
                            }, CONFIG.hightlightTimeout);
                        } else {
                            element.removeClass('shake');
                        }
                    });
                }
            };
        });
