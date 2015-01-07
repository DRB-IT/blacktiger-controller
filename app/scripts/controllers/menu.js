'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-app')
        .controller('MenuCtrl', function ($scope, languages, $rootScope, $translate, CONFIG, $filter, $location, $window) {
            $scope.links = [
                {
                    url: '#!/',
                    name: 'NAVIGATION.PARTICIPANTS',
                    icon: 'user',
                    requiredRole: 'ROLE_HOST'
                },
                {
                    url: '#!/settings',
                    name: 'NAVIGATION.SETTINGS',
                    icon: 'cog',
                    requiredRole: 'ROLE_HOST'
                },
                {
                    url: function () {
                        var url = CONFIG.RootHelp;
                        url = url.replace('{%1}', $scope.language);
                        return url;
                    },
                    name: 'NAVIGATION.HELP',
                    icon: 'question-sign',
                    requiredRole: 'ROLE_HOST',
                    target: '_blank'
                },
                {
                    url: '#!/admin/realtime',
                    name: 'NAVIGATION.ADMIN.REALTIME',
                    icon: 'transfer',
                    requiredRole: 'ROLE_ADMIN'
                },
                {
                    url: '#!/admin/history',
                    name: 'NAVIGATION.ADMIN.HISTORY',
                    icon: 'calendar',
                    requiredRole: 'ROLE_ADMIN'
                }
            ];

            $scope.getUrl = function (link) {
                if (angular.isFunction(link.url)) {
                    return link.url();
                } else {
                    return link.url;
                }
            };

            $scope.isActiveLink = function (link) {
                var url = $scope.getUrl(link);
                var linkPath = url.substring(2);
                var currentPath = $location.path();

                if ('/' === currentPath && '/' === linkPath) {
                    return true;
                } else if ('/' !== linkPath) {
                    return linkPath === (currentPath.length > linkPath.length ? currentPath.substring(0, linkPath.length) : currentPath);
                } else {
                    return false;
                }
            };

            $scope.languages = [{
                    locale: 'da',
                    'localizedLanguage': 'Dansk'
                }];

            $scope.$watch('language', function () {
                if ($scope.language !== undefined && $scope.language !== $translate.use()) {
                    $translate.use($scope.language);
                }
            });

            $rootScope.$on('$translateChangeSuccess', function () {
                $scope.language = $translate.use();
                $scope.languages = [];
                angular.forEach(languages, function (value, key) {
                    $translate('GENERAL.LANGUAGE.' + key.toUpperCase()).then(function (translation) {
                        $scope.languages.push({
                            locale: key,
                            localizedLanguage: translation,
                            language: value
                        });
                    });
                });

            });

            $rootScope.$on('PushEventSvc.Lost_Connection', function () {
                $window.alert($filter('translate')('GENERAL.LOST_CONNECTION'));
            });
        });
