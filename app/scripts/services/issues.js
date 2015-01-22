'use strict';

/**
 * @ngdoc function
 * @name blacktiger-app.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blacktiger-app
 */
angular.module('blacktiger-services')
        .factory('IssuesSvc', function ($http, CONFIG, $location, $log, $interval) {
            var issues = [];
            var country = 'DK';
            var host = $location.host();
            
            if(host) {
                $log.info('IssuesSvc: Resolving country from host name [host=' + host + ']');
                var elements = host.split('.');
                if(elements[0].length === 2) {
                    country = elements[0];
                } else {
                    $log.warn('IssuesSvc: Unable to resolve country from first elelent in host name [element=' + elements[0] + ']');
                }
            } else {
                $log.warn('IssuesSvc: Unable to resolve country from host name [host=' + host + ']');
            }
            
            var updateIssues = function () {
                var url = CONFIG.ghIssueRepository;
                if (!url) {
                    issues = [];
                    return;
                }

                url += '/issues?state=open&labels=public,' + country + '&' + new Date().getMilliseconds();
                $http.get(url).then(function(resp) {
                    if(resp.status === 200) {
                        issues = resp.data;
                    } else {
                        $log.error('Unable to request issues. Status: ' + resp.status);
                    }
                });
            };
            
            //$interval(updateIssues, 60000);
            //updateIssues();
            
            return {
                getIssues: function () {
                    return issues;
                }
            };
        });

