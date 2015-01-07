'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:commentAlert
 * @description
 * # commentAlert
 */
angular.module('blacktiger-app')
        .directive('btCommentAlert', function () {
            return {
                restrict: 'E',
                controller: function ($scope) {
                    $scope.forcedHidden = false;

                    $scope.isCommentRequested = function () {

                        var commentRequested = false;

                        angular.forEach($scope.participants, function (p) {
                            if (p.commentRequested) {
                                commentRequested = true;
                                return false;
                            }
                        });
                        return commentRequested;

                    };

                    $scope.$watch('isCommentRequested()', function (value) {
                        if (value === true) {
                            $scope.forcedHidden = false;
                        }
                    });

                    $scope.$watch('context.room', function (room) {
                        if (room) {
                            $scope.participants = room.participants;
                        } else {
                            $scope.participants = [];
                        }
                    });
                },
                templateUrl: 'views/bt-commentalert.html'
            };
        });
