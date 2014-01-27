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
    }
  });
