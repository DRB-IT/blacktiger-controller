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
    }).factory('LoginSvc', function($q, $cookieStore, $http, $rootScope, blacktiger) {
        'use strict'
        var currentUser = null;
        return {
            authenticate: function(username, password, remember) {

                var user = null;
                var credentials;

                if(angular.isDefined(username) && angular.isDefined(password)) {
                    console.log('Authenticating [username:'+username+', password:'+password+', remember:'+remember+']');
                    credentials = {username: username, password: password};
                } else {
                    console.log('Authenticating from data in cookiestore');
                    user = $cookieStore.get('user');
                    if(user) {
                        console.log("user: " + user);
                        credentials = user.authtoken;
                    }
                }

                if(credentials) {
                    return $http.post(blacktiger.getServiceUrl() + "system/authenticate", credentials).then(function(response) {
                        user = response.data;

                        if(remember) {
                            $cookieStore.put('user', user);
                        }

                        console.log('Authenticatated. Returning user.');
                        $http.defaults.headers.common['X-Auth-Token'] = user.authtoken;

                        console.log('Logged in as ' + user.username);
                        currentUser = user;
                        $rootScope.currentUser = user;
                        $rootScope.$broadcast("login", user);
                        return user;
                    });
                } else {
                    console.info('Unable to authenticate.');
                    return $q.reject('No credentials specified or available for authentication.');
                }

            },
            getCurrentUser: function() {
                return currentUser;
            }
        }
    }).factory('SystemSvc', function($http) {
        'use strict'
        return {
            getSystemInfo: function() {
                return $http.get('system/information').then(function(response) {
                    return response.data;
                });
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
            console.log('Called waitForChanges with timestamp: ' + timestamp);

            $http({method: 'GET', url: blacktiger.getServiceUrl() + "rooms/" + room.id + "/events", params: data}).success(function(data) {
                console.log('Changes received from server [' + data.events.length + ']');

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

        var onRoomChange = function(room) {
            participants = room.participants || [];
            waitForChanges();
        };

        $rootScope.$on('roomChanged', function(event, room) {
            console.log('Detected room change. Reloading all participants[' + (room.participants ? room.participants.length : 0) + '].');
            onRoomChange(room);
        });

        
        return {
            getParticipants: function () {
                return participants;
            },
            kickParticipant: function (userid) {
                console.log('Kicking participant[' + userid + ']');
                return $http.delete(blacktiger.getServiceUrl() + "rooms/" + RoomSvc.getCurrent().id + "/participants/" + userid);
            },
            muteParticipant: function (userid) {
                return $http.post(blacktiger.getServiceUrl() + "rooms/" + RoomSvc.getCurrent().id + "/participants/" + userid + "/muted", true);
            },
            unmuteParticipant: function (userid) {
                return $http.post(blacktiger.getServiceUrl() + "rooms/" + RoomSvc.getCurrent().id + "/participants/" + userid + "/muted", false);
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
