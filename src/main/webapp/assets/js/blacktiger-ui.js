/*global angular*/
angular.module('blacktiger-ui', [])
    .directive('btNumberIcon', function () {
        return {
            restrict: 'E',
            scope: {
                type: '@'
            },
            controller: function ($scope, $element, $attrs) {
                if ($scope.type === 'Sip') {
                    $scope.iconclass = 'hdd';
                    $scope.cleannumber = $scope.number;
                } else {
                    $scope.iconclass = 'earphone';
                    $scope.cleannumber = $scope.number;
                }
            },
            template: '<span class="glyphicon glyphicon-{{iconclass}}" ></span>'
        };
    }).directive('btRoomStatus', function () {
        return {
            restrict: 'E',
            scope: {
                room: '='
            },
            controller: function ($scope, $element, $attrs) {
                $element.find('thead').on('click', function () {
                    $element.find('tbody').toggleClass('hidden');
                });

                $scope.$watch('room', function () {
                    $scope.noOfOpenMicrophones = 0;
                    $scope.noOfCommentRequests = 0;
                    $scope.noOfSipPhones = 0;
                    $scope.noOfRegularPhones = 0;
                    $scope.noOfMissingNames = 0;

                    angular.forEach($scope.room.participants, function (p) {
                        if (!p.host) {
                            if (!p.muted) {
                                $scope.noOfOpenMicrophones++;
                            }

                            if (p.commentRequested) {
                                $scope.noOfCommentRequests++;
                            }

                            if (p.phoneNumber.indexOf('#') === 0) {
                                $scope.noOfSipPhones++;
                            } else {
                                $scope.noOfRegularPhones++;
                            }

                            if (p.name === null || p.name === '') {
                                $scope.noOfMissingNames++;
                            }
                        }

                    });
                }, true);
            },
            templateUrl: 'assets/templates/bt-room-status.html'
        };
    }).directive('btRoomInfo', function () {
        return {
            restrict: 'E',
            scope: {
                room: '=',
                contactLink: '@'
            },
            templateUrl: 'assets/templates/bt-room-info.html'
        };
    }).directive('btDuration', function () {
        return {
            restrict: 'E',
            scope: {
                since: '=',
            },
            controller: function ($scope, $interval) {
                $scope.duration = 0;

                if (angular.isNumber($scope.since)) {
                    $scope.since = new Date($scope.since);
                }

                $scope.updateDuration = function () {
                    $scope.duration = Math.max((new Date().getTime() - $scope.since.getTime()) / 60000, 0);
                };

                $scope.task = $interval($scope.updateDuration, 5000);

                $scope.$on('$destroy', function () {
                    $interval.cancel($scope.task);
                });

                $scope.updateDuration();
            },
            templateUrl: 'assets/templates/bt-duration.html'
        };
    }).directive('modalWindow', function ($timeout) {
        return {
            restrict: 'EA',
            link: function (scope, element) {
                // Makes sure that if the first input field of the modal is focused - if it has any.
                $timeout(function () {
                    var em = element.find('input');
                    if (em.length > 0) {
                        var em1 = em[0];
                        em1.focus();
                        em1.select();
                    }
                }, 100);

            }
        };
    }).filter('timespan', function () {
        return function (input) {
            var out = "";
            if (!isNaN(input)) {
                var seconds = input / 1000;
                var hours = Math.floor(seconds / 3600);
                var minutes = Math.floor((seconds % 3600) / 60);
                out = hours + ':' + (minutes > 9 ? '' : '0') + minutes;
            }
            return out;
        };
    });