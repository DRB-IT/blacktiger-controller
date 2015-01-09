'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('CreateSipAccountCtrl', function ($scope, SipUserSvc, $timeout, translateFilter, $rootScope) {
            $scope.user = {};
            $scope.mailText = '';
            $scope.innerMailTextPattern = new RegExp('.*');
            $scope.mailTextPattern = (function () {
                return {
                    test: function (value) {
                        value = value.replace(/(?:\r\n|\r|\n)/g, '');
                        var result = $scope.innerMailTextPattern.test(value);
                        return result;
                    }
                };
            })();

            $scope.reset = function () {
                $scope.user.name = '';
                $scope.user.phoneNumber = '';
                $scope.user.email = '';
                $scope.mailText = translateFilter('SETTINGS.CREATE_SIP_ACCOUNT.DEFAULT_MAILTEXT');
            };

            $rootScope.$on('$translateChangeSuccess', $scope.reset);

            $scope.createUser = function () {
                var data = {
                    account: $scope.user,
                    mailText: $scope.mailText
                };
                SipUserSvc.create(data).then(function () {
                    $scope.created = angular.copy(data);
                    $scope.reset();
                    $scope.status = 'success';
                }, function (reason) {
                    $scope.reset();
                    $scope.status = 'error (reason: ' + reason + ')';
                });
            };

            $scope.onPhoneNumberChanged = function () {
                var number = $scope.user.phoneNumber ? $scope.user.phoneNumber.replace(/[\+\s\-\(\)]/, '') : '',
                        noOfCharsToPull = Math.min(4, number.length),
                        pattern, i;

                if (noOfCharsToPull === 0) {
                    $scope.innerMailTextPattern = new RegExp('.*');
                } else {
                    number = number.substr(number.length - noOfCharsToPull, number.length);
                    pattern = '^((?!(' + number.charAt(0) + ')';
                    for (i = 1; i < number.length; i++) {
                        pattern += '[\\s\\w\\W]{0,1}(' + number.charAt(i) + ')';
                    }
                    pattern += ').)*$';
                    $scope.innerMailTextPattern = new RegExp(pattern);
                }

                //Trigger revalidation
                var text = $scope.mailText;
                $scope.mailText = null;
                $timeout(function () {
                    $scope.mailText = text;
                }, 5);
            };

            $scope.reset();
        });
