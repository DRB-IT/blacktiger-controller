'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-controllers')
        .controller('MenuCtrl', function ($scope, languages, $rootScope, $translate, CONFIG, $filter, $location) {
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
            
            $scope.normalizeLanguageName = function(name) {
                        var r=name.toLowerCase();
                        r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
                        r = r.replace(new RegExp("ç", 'g'),"c");
                        r = r.replace(new RegExp("[èéêë]", 'g'),"e");
                        r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
                        r = r.replace(new RegExp("ñ", 'g'),"n");                            
                        r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
                        r = r.replace(new RegExp("œ", 'g'),"oe");
                        r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
                        r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
                        return r;
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
                
                angular.forEach(CONFIG.i18n.languages, function(languageData, key) {
                    $scope.languages.push({
                        locale: key,
                        normalizedLanguage: $scope.normalizeLanguageName(languageData.names[key]),
                        localizedLanguage: languageData.names[$scope.language],
                        language: languageData.names[key]
                    });
                });
            });

        });
