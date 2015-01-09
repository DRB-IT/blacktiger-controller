'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:input
 * @description
 * 
 */
angular.module('blacktiger-directives')
        .directive('input', function () {
            return {
                restrict: 'E', // only activate on element attribute
                require: '?ngModel', // get a hold of NgModelController
                link: function (scope, element, attrs, ngModel) {
                    if (attrs.type !== 'name') {
                        return;
                    }
                    
                    scope.validate = function(value) {
                        var namePattern = /^([^\s\.\,\_\!\?\:\;]{2,} ([^\s\.\,\-\_\!\?\:\;]{2,}[^\s]* )*[^\s\.\,\-\_\!\?\:\;]{2,}[^\s]*)$/;
                        var result = namePattern.exec(value);
                        ngModel.$setValidity('name', result !== null);
                        return value;
                    }
                    
                    ngModel.$parsers.push(scope.validate);
                    ngModel.$formatters.push(scope.validate);
                    

                }
            };
        });