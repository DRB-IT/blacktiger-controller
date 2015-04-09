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
                    var enabled = false, disablerKeys = [8 /* BACKSPACE */, 37 /* LEFT ARROW */, 39 /* RIGHT ARROW */], 
                            nonDisableKeyCount = 0, enableThreshold = 3;
                    var capitalize = function (inputValue) {
                        var i, words, word, capitalized = '';
                        
                        if(!enabled) {
                            return inputValue;
                        }
                        
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

                    element.on('keydown', function (event) {
                        if(disablerKeys.indexOf(event.which) >= 0) {
                            enabled = false;
                            nonDisableKeyCount = 0;
                        } else {
                            nonDisableKeyCount++;
                        }
                        
                        if(nonDisableKeyCount === enableThreshold) {
                            enabled = true;
                        }
                    });
                    
                    element.on('focus', function () {
                        enabled = true;
                    });
                }
            };
        });
