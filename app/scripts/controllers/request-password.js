/* global i18n */
'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('RequestPasswordCtrl', function ($scope, $http, blacktiger, $filter, $log, $rootScope, $location) {
            $scope.reset = function () {
                $scope.request = {
                    phoneNumber: '',
                    phoneNumberOfHall: '',
                    emailTextUser: $filter('translate')('REQUEST_PASSWORD.EMAIL_TEXT_USER'),
                    emailSubject: $filter('translate')('REQUEST_PASSWORD.EMAIL_SUBJECT'),
                    emailTextManager: $filter('translate')('REQUEST_PASSWORD.EMAIL_TEXT_MANAGER')
                };
                $scope.status = null;
            };


            $scope._countryCodeToAreaCode = function (countryCode) {
                var data = i18n.phonenumbers.metadata.countryToMetadata[countryCode.toUpperCase()];
                if (!data) {
                    return null;
                } else {
                    return data[10];
                }
            };

            $scope._resolveCountryCode = function () {
                var host, hostData, isoCountryCode;

                host = location.host;
                hostData = host.split('.');

                if (hostData.length < 3 || !$scope._countryCodeToAreaCode(hostData[hostData.length - 3])) {
                    $log.debug('Unable to resolve countrycode from url. Falling back to \'DK\'');
                    isoCountryCode = 'dk';
                } else {
                    isoCountryCode = hostData[hostData.length - 3];
                }
                $scope.countryCode = $scope._countryCodeToAreaCode(isoCountryCode);

            };

            $scope.send = function () {
                $http.post(blacktiger.getServiceUrl() + 'system/passwordRequests', $scope.request).then(function (response) {
                    if (response.status !== 200) {
                        $scope.status = 'error';
                    } else {
                        $scope.status = 'ok';
                    }
                });
            };

            $scope.cancel = function () {
                $location.path('/login');
            };

            $scope.reset();
            $rootScope.$on('$translateChangeSuccess', $scope.reset);
            $scope._resolveCountryCode();
        });
