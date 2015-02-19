'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:commentAlert
 * @description
 * # commentAlert
 */
angular.module('blacktiger-directives')
        .directive('btCommentAlert', function (MeetingSvc) {
            return {
                restrict: 'E',
                controller: function ($scope) {
                    $scope.forcedHidden = false;

                    $scope.isCommentRequested = function () {

                        var commentRequested = false;
                        
                        if($scope.roomNumber) {
                            var room = MeetingSvc.findRoom($scope.roomNumber)
                            angular.forEach(room.participants, function (p) {
                                if (p.commentRequested) {
                                    commentRequested = true;
                                }
                            });
                        }
                        return commentRequested;

                    };

                    $scope.$watch('isCommentRequested()', function (value) {
                        if (value === true) {
                            $scope.forcedHidden = false;
                        }
                    });

                    $scope.$watch('context.room', function (room) {
                        if (room) {
                            $scope.roomNumber = room.id;
                        } else {
                            $scope.roomNumber = null;
                        }
                    });
                },
                templateUrl: 'views/bt-commentalert.html'
            };
        });
