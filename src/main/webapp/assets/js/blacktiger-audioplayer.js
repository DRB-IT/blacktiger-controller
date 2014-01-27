angular.module('blacktiger-audioplayer', [])
    .factory('AudioPlayerSvc', function ($rootScope) {
        var url;
        var state = 'stopped';

        return {
            setUrl: function (value) {
                url = value;
            },
            getProgressPercent: function () {
                if (state === 'stopped' || !audio) {
                    return 0;
                } else {
                    return audio.currentTime / audio.duration * 100;
                }

            },
            getState: function () {
                return state;
            },
            play: function () {
                if (state === 'playing')
                    return;

                audio = new Audio(url);

                var self = this;
                audio.addEventListener('ended', this.stop, false);
                audio.addEventListener('error', function (ev) {
                    self.stop();
                    $rootScope.$emit('audioplayer.error', ev);
                }, false);

                if (audio) {
                    audio.play();
                    state = "playing";
                    $rootScope.$emit('audioplayer.playing');
                }
            },
            pause: function () {
                if (state === 'paused')
                    return;
                if (audio) {
                    audio.pause();
                    state = "paused";
                    $rootScope.$emit('audioplayer.paused');
                }
            },
            stop: function () {
                if (state === 'stopped')
                    return;
                if (audio) {
                    audio.pause();
                    //audio.currentTime = 0;
                    audio = null;
                    state = "stopped";
                    $rootScope.$emit('audioplayer.stopped');
                }
            },
            isSupported: function () {
                return Audio ? true : false;
            }
        };
    })
