/*global angular */
var teljs = angular.module('teljs',[]);
teljs.trimNumber = function(value) {
    if(value) {
        return value.replace(/[\+\s\-\(\)]/g, '');
    } else {
        return value;
    }
};

teljs.filter('telephone', function() {
    
    var countryCodes = teljs.countryAreaCodes;
            
    // [<areacode>, <nationalPrefix>, [[<formatPattern>, <leadingDigits<, <format>, <intlFormat>],...]]
    var countryMetaData = teljs.meta;
    
    var regionsFromNumber = function(e164) {
        var regions;
        angular.forEach(countryCodes, function(value, key) {
            var reg = new RegExp('^'+key),
            ok;

            ok = reg.exec(e164);

            if(ok) {
                regions = value;
            }
        });
        return regions;
    };

    var formatNumberForRegion = function(region, nationalNumber, mode) {
        var metaData = countryMetaData[region],
            countryCode = metaData[0],
            nationalPrefix = metaData[1],
            numberFormats = metaData[2],
            number, international = (mode === 'e164');

        angular.forEach(numberFormats, function(entry) {
            var matchNumber, matchLeadingDigits;

            matchNumber = new RegExp('^'+entry[0]).exec(nationalNumber);

            if(entry[1] === null) {
                matchLeadingDigits = true;
            } else if(angular.isString(entry[1])) {
                matchLeadingDigits = new RegExp('^'+entry[1]).exec(nationalNumber);
            } else if(angular.isArray(entry[1])) {
                angular.forEach(entry[1], function(lead) {
                    if(new RegExp('^'+lead).exec(nationalNumber)) {
                        matchLeadingDigits = true;
                        return false;
                    }
                });
            }

            if(matchNumber && matchLeadingDigits) {
                var format = international && entry[3] ? entry[3] : entry[2];
                if(international) {
                    number = nationalNumber;
                    if(nationalPrefix && number.substr(0, nationalPrefix.length) === nationalPrefix) {
                        number = number.substr(nationalPrefix.length);
                    }
                    number = number.replace(new RegExp(entry[0]), format);
                    number = '+' + countryCode + ' ' + number;
                } else {
                    throw "national formatting not support yet.";
                }
                return false;
            }
        });
        return number;
    };

    
    return function(input, mode, defaultAreaCode) {
        
        var regions, trimmedNumber, number, nationalNumber, i, countryCode, region;
        mode = mode ? mode : 'e164';
        trimmedNumber = teljs.trimNumber(input);
        
        if(defaultAreaCode && defaultAreaCode !== '') {
            trimmedNumber = defaultAreaCode + '' + trimmedNumber;
            regions = regionsFromNumber(trimmedNumber);

            if(regions) {
                for(i=0;i<regions.length;i++) {
                    region = regions[i];
                    countryCode = countryMetaData[region][0];
                    nationalNumber = trimmedNumber.substr(countryCode.length);
                    number = formatNumberForRegion(region, nationalNumber, mode);
                    if(number) break;
                }
            }
            if(number) return number;
        }   
        
        regions = regionsFromNumber(trimmedNumber);

        if(regions) {
            for(i=0;i<regions.length;i++) {
                region = regions[i];
                countryCode = countryMetaData[region][0];
                nationalNumber = trimmedNumber.substr(countryCode.length);
                number = formatNumberForRegion(region, nationalNumber, mode);
                if(number) break;
            }
        }

        
        
        return number;


    };
});

teljs.directive('input', function ($filter) {
    return {
        restrict: 'E', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        scope: {
            international: '@',
            defaultAreaCode: '@'
        },
        link: function(scope, element, attrs, ngModel) {
            if (attrs.type !== 'tel') return;
            scope.international = 'true' === scope.international;
            
            element.on('blur', function() {
                if(ngModel.$valid) {
                    ngModel.$setViewValue(scope.formatNumber(ngModel.$modelValue));
                    ngModel.$render();
                }
            });

            scope.doFormatNumber = function(number) {
                return $filter('telephone')(number, scope.international ? 'e164' : 'national', scope.defaultAreaCode);
            };
            
            scope.formatNumber = function(value) {
                var result = scope.doFormatNumber(value);
                if(!result) {
                    result = value;
                    ngModel.$setValidity('phoneNumber', false);
                }
                return result;
            };

            scope.parseNumber = function(value) {
                var valid = false, result, formatResult;
                value = value ? teljs.trimNumber(value) : value;
                formatResult = scope.doFormatNumber(value);

                if(formatResult === undefined) {
                    result = undefined;
                    valid = false;
                } else {
                    result = value;
                    valid = true;
                }

                ngModel.$setValidity('phoneNumber', valid);
                return result;
            };

            ngModel.$formatters.push(scope.formatNumber);
            ngModel.$parsers.push(scope.parseNumber);

        }
    };
});
