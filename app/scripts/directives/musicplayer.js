'use strict';

/**
 * @ngdoc directive
 * @name blacktiger-app.directive:musicPlayer
 * @description
 * # musicPlayer
 */
angular.module('blacktiger-directives')
        .directive('btMusicPlayer', function () {
            return {
                restrict: 'E',
                scope: true,
                controller: function ($rootScope, $q, $scope, RemoteSongSvc, StorageSvc, AudioPlayerSvc) {
                    $scope.currentSong = 0;
                    $scope.progress = 0;
                    $scope.state = AudioPlayerSvc.getState();
                    $scope.maxNumber = RemoteSongSvc.getNumberOfSongs();
                    $scope.downloadState = 'Idle';
                    $scope.hasSongsLocally = false;
                    $scope.random = false;

                    $scope.downloadFile = function (deferred, number, until) {
                        RemoteSongSvc.readBlob(number).then(function (blob) {
                            StorageSvc.writeBlob('song_' + number + '.mp3', blob).then(function () {
                                if (number < until) {
                                    number++;
                                    $scope.progress = (number / until) * 100;
                                    $scope.downloadFile(deferred, number, until);
                                } else {
                                    deferred.resolve();
                                }
                            });

                        });
                    };

                    $scope.startDownload = function () {
                        StorageSvc.init().then(function () {
                            var deferred = $q.defer(),
                                    promise = deferred.promise;
                            $scope.downloadState = 'Downloading';
                            $scope.downloadFile(deferred, 1, RemoteSongSvc.getNumberOfSongs());
                            promise.then(function () {
                                $scope.downloadState = 'Idle';
                                $scope.hasSongsLocally = true;
                                $scope.currentSong = 1;
                                $scope.progress = 0;
                            });
                        });


                    };

                    $scope.getSongNumbers = function () {
                        var numbers = [],
                                i;
                        for (i = 1; i <= RemoteSongSvc.getNumberOfSongs(); i++) {
                            numbers[numbers.length] = i;
                        }
                        return numbers;
                    };
                    $scope.getProgressStyle = function () {
                        return {
                            width: $scope.progress + '%'
                        };
                    };

                    $scope.play = function () {
                        AudioPlayerSvc.play();
                    };

                    $scope.stop = function () {
                        AudioPlayerSvc.stop();
                    };

                    $scope.toggleRandom = function () {
                        $scope.random = !$scope.random;
                    };

                    $scope.$watch('currentSong', function () {
                        if ($scope.hasSongsLocally) {
                            $scope.stop();
                            StorageSvc.readBlob('song_' + $scope.currentSong + '.mp3').then(function (blob) {
                                AudioPlayerSvc.setUrl(URL.createObjectURL(blob));
                            });
                        }
                    });

                    $scope.updateProgress = function () {
                        $scope.state = AudioPlayerSvc.getState();
                        $scope.progress = AudioPlayerSvc.getProgressPercent();
                        if ($scope.state === 'playing') {
                            window.setTimeout(function () {
                                $scope.$apply(function () {
                                    $scope.updateProgress();
                                });


                            }, 100);
                        }
                    };

                    $scope.isSupported = function () {
                        return AudioPlayerSvc.isSupported();
                    };

                    $rootScope.$on('audioplayer.playing', $scope.updateProgress);
                    $rootScope.$on('audioplayer.stopped', $scope.updateProgress);

                    StorageSvc.init().then(function () {
                        var nameArray = [],
                                i;
                        for (i = 1; i <= RemoteSongSvc.getNumberOfSongs(); i++) {
                            nameArray[i - 1] = 'song_' + i + '.mp3';
                        }
                        StorageSvc.hasBlobs(nameArray).then(function () {
                            $scope.hasSongsLocally = true;
                            $scope.currentSong = 1;
                        });
                    }, 100);

                },
                templateUrl: 'views/bt-musicplayer.html'
            };
        });
