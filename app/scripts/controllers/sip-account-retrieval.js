'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Used for Sip Account Retrieval only
 */
angular.module('blacktiger-controllers')
        .controller('SipAccountRetrievalCtrl', function ($scope, CONFIG, SipUserSvc, token, $translate, $filter) {

            $scope.cleanNumber = function (number) {
                return number.replace(/[\+\-\/\(\) ]/g, '');
            };

            $scope.getSip = function () {
                $scope.status = 'loading';
                $scope.statusMessage = $filter('translate')('GENERAL.LOADING') + '...';
                $scope.sipinfo = null;
                SipUserSvc.get(token, $scope.cleanNumber($scope.phoneNumber)).then(function (data) {
                    $scope.status = null;
                    $scope.sipinfo = data;
                }, function () {
                    $scope.status = 'error';
                    $scope.statusMessage = $filter('translate')('SIP_ACCOUNT_RETRIEVAL.ERROR_MESSAGE');
                    $scope.sipinfo = null;
                });
            };

            $scope.getSipHelpURL = function () {
                var url = CONFIG.SIPHelp;
                url = url.replace('{%1}', $scope.language);
                return url;
            };

            $scope.language = $translate.use();
        });
