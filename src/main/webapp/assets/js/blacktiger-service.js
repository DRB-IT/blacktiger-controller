angular.module('blacktiger-service', ['ngCookies'])
    .provider('blacktiger', function () {
        'use strict';
        var serviceUrl = "";
        this.setServiceUrl = function (url) {
            serviceUrl = url;
        };

        this.$get = function () {
            return {
                getServiceUrl: function () {
                    return serviceUrl;
                }
            };
        };
    }).factory('LoginSvc', function($q, $timeout, $cookieStore, $http, $rootScope) {
        'use strict'
        return {
            authenticate: function(username, password, remember) {
                var user = null;
                if(angular.isDefined(username) && angular.isDefined(password)) {
                    user =  {
                        username: username,
                        roles: ['ROLE_USER'],
                        token: 'qwerty123'
                    };
                    if(remember) {
                        $cookieStore.put('user', user);
                    }

                } else {
                    user = $cookieStore.get('user');
                }

                if(user) {
                    $http.defaults.headers.common['X-Auth-Token'] = user.token;

                    return $timeout(function() {
                        console.log('Logged in as ' + user.username);
                        $rootScope.$broadcast("login", user);
                        return user;
                    }, 0);
                } else {
                    return $q.reject();
                }
            }
        }
    }).factory('SystemSvc', function($timeout) {
        'use strict'
        return {
            getSystemInfo: function() {
                return $timeout(function() {
                    return {
                        cores: 24,
                        load: {
                            disk: 25.0,
                            memory: 22.0,
                            cpu: 0.3,
                            net: 4.9
                        },
                        averageCpuLoad: {
                            oneMinute: 0.1,
                            fiveMinutes: 0.3,
                            tenMinutes: 2.0
                        }
                    };
                }, 0);
            }
        }
    }).factory('RoomSvc', function (blacktiger, $http, $rootScope) {
        'use strict';
        var current = null;
        return {
            getRoomIds: function () {
                return $http.get(blacktiger.getServiceUrl() + "rooms").then(function(response) {
                    return response.data;
                });
            },
            getRooms: function() {
                return $http.get(blacktiger.getServiceUrl() + "rooms?mode=full").then(function(response) {
                    return response.data;
                });
            },
            setCurrent: function (room) {
                current = room;
                console.log('Current room set to ' + room.id + '. Broadcasting it.');
                $rootScope.$broadcast("roomChanged", room);
            },
            getCurrent: function () {
                return current;
            },
            getRoom: function(room) {
                return $http.get(blacktiger.getServiceUrl() + "rooms/" + room).then(function(response) {
                    return response.data;
                });
            }
        };
    }).factory('ParticipantSvc', function ($http, RoomSvc, blacktiger, $rootScope, $timeout) {
        'use strict';
        var participants = [];

        var findAll = function() {
            var room = RoomSvc.getCurrent();
            if(room === null) {
                return $timeout(function() {
                    return [];
                }, 0);
            }
            return $http.get(blacktiger.getServiceUrl() + "rooms/" + room.id + "/participants").then(function (request) {
                return request.data;
            });
        };

        var indexByUserId = function(userId) {
            var index = -1;
            angular.forEach(participants, function(p, currentIndex) {
                if(p.userId === userId) {
                    index = currentIndex;
                    return false;
                }
            });
            return index;
        };

        var waitForChanges = function(timestamp) {
            var data = {};
            if(timestamp !== undefined) {
                data.since = timestamp;
            }

            var room = RoomSvc.getCurrent();
            if(room===null) {
                return;
            }
            //console.log('Called waitForChanges with timestamp: ' + timestamp);

            $http({method: 'GET', url: blacktiger.getServiceUrl() + "rooms/" + room.id + "/participants/events", params: data}).success(function(data) {
                var timestamp = data.timestamp, index, participant;
                angular.forEach(data.events, function(e) {
                    switch(e.type) {
                        case 'Join':
                            participants.push(e.participant);
                            onJoin(e.participant);
                            break;
                        case 'Leave':
                            index = indexByUserId(e.participant.userId);
                            participant = participants[index];
                            if(index >= 0) {
                                participants.splice(index, 1);
                            }
                            onLeave(participant);
                            break;
                        case 'Change':
                            index = indexByUserId(e.participant.userId);
                            participants[index] = e.participant;
                            onChange(e.participant);
                            break;
                    }
                });
                $timeout(function() {
                    waitForChanges(timestamp);
                }, 150);
            });
        };

        var onJoin = function(participant) {
            $rootScope.$broadcast('ParticipantSvc.join', participant);
        };

        var onChange = function(participant) {
            $rootScope.$broadcast('ParticipantSvc.change', participant);
        };

        var onLeave = function(participant) {
            $rootScope.$broadcast('ParticipantSvc.leave', participant);
        };

        var onRoomChange = function() {
            participants.splice();
            findAll().then(function(data) {
                console.log('Found ' + data.length + ' particpiantes.');
                angular.forEach(data, function(p) {
                    participants.push(p);
                    //onJoin(p);
                });
                waitForChanges();
            });
        };

        $rootScope.$on('roomChanged', function() {
            console.log('Detected room change. Reloading all participants.');
            onRoomChange();
        });

        onRoomChange();

        return {
            getParticipants: function () {
                return participants;
            },
            kickParticipant: function (userid) {
                return $http({
                    method: 'POST',
                    url: blacktiger.getServiceUrl() + "rooms/" + RoomSvc.getCurrent().id + "/participants/" + userid + "/kick"
                });
            },
            muteParticipant: function (userid) {
                return $http({
                    method: 'POST',
                    url: blacktiger.getServiceUrl() + "rooms/" + RoomSvc.getCurrent().id + "/participants/" + userid + "/mute"
                });
            },
            unmuteParticipant: function (userid) {
                return $http({
                    method: 'POST',
                    url: blacktiger.getServiceUrl() + "rooms/" + RoomSvc.getCurrent().id + "/participants/" + userid + "/unmute"
                });
            }
        };
    }).factory('PhoneBookSvc', function ($http, RoomSvc, blacktiger, $rootScope) {
        'use strict';
        return {
            updateEntry: function (phoneNumber, name) {
                return $http.post(blacktiger.getServiceUrl() + 'phonebook/' + phoneNumber, name).then(function (response) {
                    $rootScope.$broadcast('PhoneBookSvc.update', phoneNumber, name);
                    return;
                });
            }
        };
    }).factory('ReportSvc', function ($http, $q, RoomSvc, blacktiger) {
        'use strict';
        return {
            report: [],
            findByNumbers: function (numbers) {
                return $http.get(blacktiger.getServiceUrl() + "reports/" + RoomSvc.getCurrent().id + '?numbers=' + numbers.join()).then(function (request) {
                    return request.data;
                });
            }
        };
    }).factory('SipUserSvc', function ($http, RoomSvc, blacktiger, $rootScope) {
        'use strict';
        return {
            create: function (user) {
                return $http.post(blacktiger.getServiceUrl() + 'users', user).then(function () {
                    return;
                });
            },

            isNumberAvailable: function(number) {
                var data = {phoneNumber: number};
                return $http({method: 'GET', url: blacktiger.getServiceUrl() + 'users', params: data}).then(function (response) {
                    if(angular.isArray(response.data) && response.data > 0) {
                        return false;
                    } else {
                        return true;
                    }
                });
            }
        };
    });
