'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:capitalize
 * @description
 * # capitalize
 */
angular.module('blacktiger-directives')
        .directive('btCapitalize', function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, modelCtrl) {
                    var capitalize = function (inputValue) {
                        var i, words, word, capitalized = '';
                        if (inputValue === undefined) {
                            inputValue = '';
                        }

                        words = inputValue.split(' ');
                        for (i = 0; i < words.length; i++) {
                            word = words[i];
                            if (word !== '') {
                                if (i > 0) {
                                    capitalized += ' ';
                                }
                                capitalized += word.charAt(0).toUpperCase() + word.substring(1);
                            }
                        }

                        if (capitalized !== inputValue) {
                            modelCtrl.$setViewValue(capitalized);
                            modelCtrl.$render();
                        }
                        return capitalized;
                    };

                    modelCtrl.$parsers.push(capitalize);

                    element.on('focus', function () {
                        var initialEdit = element.val() === '';
                        if (initialEdit) {
                            modelCtrl.$parsers.push(capitalize);
                        } else {
                            var parserIndex = modelCtrl.$parsers.indexOf(capitalize);
                            if(parserIndex >= 0) {
                                modelCtrl.$parsers.splice(parserIndex, 0);
                            }
                        }
                    });
                }
            };
        });
