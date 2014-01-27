angular.module('blacktiger-ui',[])
    .directive('btIconifiednumber', function () {
        return {
            restrict: 'E',
            scope: {
                number: '@'
            },
            controller: function ($scope, $element, $attrs) {
                if ($scope.number.indexOf("PC-") === 0) {
                    $scope.iconclass = 'hdd';
                    $scope.cleannumber = $scope.number.substring(3);
                } else {
                    $scope.iconclass = 'earphone';
                    $scope.cleannumber = $scope.number;
                }
            },
            template: '<span class="glyphicon glyphicon-{{iconclass}}"></span> {{cleannumber}}'
        };
    }).directive('btRoomStatus', function () {
        return {
            restrict: 'E',
            scope: {
                room: '='
            },
            controller: function ($scope, $element, $attrs) {
                $element.find('thead').on('click', function() {
                    $element.find('tbody').toggleClass('hidden');
                });

                $scope.$watch('room', function() {
                    $scope.noOfOpenMicrophones = 0;
                    $scope.noOfCommentRequests = 0;
                    $scope.noOfSipPhones = 0;
                    $scope.noOfRegularPhones = 0;
                    $scope.noOfMissingNames = 0;

                    angular.forEach($scope.room.participants, function(p) {
                        if(!p.muted) $scope.noOfOpenMicrophones++;
                        if(p.commentRequested) $scope.noOfCommentRequests++;
                        if(p.phoneNumber.indexOf('PC-') === 0) {
                            $scope.noOfSipPhones++;
                        } else {
                            $scope.noOfRegularPhones++;
                        }
                        if(p.name === null || p.name === '') $scope.noOfMissingNames++;

                    });
                });
            },
            templateUrl: 'assets/templates/bt-room-status.html'
        };
    }).filter('timespan', function() {
    return function(input) {
      var out = "";
      if (!isNaN(input)) {
          var seconds = input / 1000;
          var hours = Math.floor(seconds / 3600);
          var minutes = Math.floor((seconds % 3600) / 60);
          out = hours + ':' + (minutes>9 ? '' : '0') + minutes;
      }
      return out;
    };
  });
