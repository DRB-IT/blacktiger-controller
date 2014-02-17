angular.module('blacktiger-service', ['ngCookies', 'ngResource'])
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
                        if(response.status !== 200) {
                            return $q.reject(response.data);
                        }
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
    }).factory('RoomSvc', function (blacktiger, $resource) {
        'use strict';
        var resource = $resource(blacktiger.getServiceUrl() + 'rooms/:id');
        var current = null;
        return {
            query: function(mode) {
                var params;
                if(mode) {
                    params = {mode:mode};
                }
                return resource.query(params);
            },
            get: function(id) {
                return resource.get({id:id});
            }
        };
    }).factory('ParticipantSvc', function (blacktiger, $resource) {
        'use strict';
        var resource = $resource(blacktiger.getServiceUrl() + 'rooms/:roomid/participants/:id', {}, 
                    {
                        mute: {
                            method:'POST', 
                            url: blacktiger.getServiceUrl() + 'rooms/:roomid/participants/:id/muted'
                        }
                    });
        return {
            query: function(roomid) {
                return resource.query({roomid:roomid});
            },
            get: function(roomId, id) {
                return resource.get({roomid: roomId, id: id});
            },
            kick: function(roomId, id) {
                return resource.remove({roomid: roomId, id: id});
            },
            mute: function(roomId, id) {
                return resource.mute({roomid:roomId, id:id}, true);
            },
            unmute: function(roomId, id) {
                return resource.mute({roomid:roomId, id:id}, false);
            }
        };
    }).factory('EventSvc', function (blacktiger, $http) {
        'use strict';
        return {
            query: function(room, since) {
                var params = {};
                if(room) {
                    params.room = room;
                }
                
                if(since) {
                    params.since = since;
                }
                return $http({method: 'GET', url: blacktiger.getServiceUrl() + 'events', params: params}).then(function(response){
                    return response.data;
                });
            }
        };
    }).factory('MeetingSvc', function ($rootScope, $timeout, ParticipantSvc, EventSvc) {
        'use strict';
        var participants = [], currentRoom = null;
        
    
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

            if(!currentRoom) {
                return; 
            }
            console.log('Called waitForChanges with timestamp: ' + timestamp);

            EventSvc.query(currentRoom.id, timestamp).then(function(data) {
                console.log('Changes received from server [' + data.events.length + ']');

                var timestamp = data.timestamp, index, participant;
                angular.forEach(data.events, function(e) {
                    switch(e.type) {
                        case 'Join':
                            onJoin(e.participant);
                            break;
                        case 'Leave':
                            index = indexByUserId(e.participant.userId);
                            participant = participants[index];
                            if(index >= 0) {
                                participants.splice(index, 1);
                            }
                            $rootScope.$broadcast('MeetingSvc.Leave', e.participant);
                            break;
                        case 'Change':
                            index = indexByUserId(e.participant.userId);
                            participants[index] = e.participant;
                            $rootScope.$broadcast('MeetingSvc.Change', e.participant);
                            break;
                    }
                });
                $timeout(function() {
                    waitForChanges(timestamp);
                }, 150);
            });
        };
    
        var onJoin = function(p) {
            participants.push(p);
            $rootScope.$broadcast('MeetingSvc.Join', p);
        };
    
        return {
            getParticipantList: function() {
                return participants;
            },
            setRoom: function(newRoom) {
                if(!newRoom) {
                    return;
                }
                
                currentRoom = newRoom;
                console.log('Room changed.');
                participants.splice(0);
                ParticipantSvc.query(currentRoom.id).$promise.then(function(data) {
                    angular.forEach(data, function(p) {
                        onJoin(p);
                    });
                    waitForChanges();
                });
            },
            kick: function(userId) {
                ParticipantSvc.kick(currentRoom.id, userId);
            },
            mute: function(userId) {
                ParticipantSvc.mute(currentRoom.id, userId);
            },
            unmute: function(userId) {
                ParticipantSvc.unmute(currentRoom.id, userId);
            }
        };
    
    }).factory('RealtimeSvc', function ($rootScope, $timeout, RoomSvc, EventSvc) {
        'use strict';
        var rooms = RoomSvc.query('full');
        
        var indexByUserId = function(participants, userId) {
            var index = -1;
            angular.forEach(participants, function(p, currentIndex) {
                if(p.userId === userId) {
                    index = currentIndex;
                    return false;
                }
            });
            return index;
        };
    
        var getRoomById = function(id) {
            var room;
            angular.forEach(rooms, function(current) {
                if(id === current.id) {
                    room = current;
                    return false;
                }
            });
            return room;
        };
    
        var waitForChanges = function(timestamp) {
            var data = {};
            if(timestamp !== undefined) {
                data.since = timestamp;
            }

            console.log('Called waitForChanges with timestamp: ' + timestamp);

            EventSvc.query(undefined, timestamp).then(function(data) {
                console.log('Changes received from server [' + data.events.length + ']');

                var timestamp = data.timestamp, index, participant;
                angular.forEach(data.events, function(e) {
                    var room = getRoomById(e.room);
                    switch(e.type) {
                        case 'Join':
                            room.participants.push(e.participant);
                            break;
                        case 'Leave':
                            index = indexByUserId(room.participants, e.participant.userId);
                            if(index >= 0) {
                                room.participants.splice(index, 1);
                            }
                            break;
                        case 'Change':
                            index = indexByUserId(room.participants, e.participant.userId);
                            if(index >= 0) {
                                room.participants[index] = e.participant;
                            }
                            break;
                    }
                });
                $timeout(function() {
                    waitForChanges(timestamp);
                }, 150);
            });
        };
    
        waitForChanges();
    
        return {
            getRoomList: function() {
                return rooms;
            }
        };
    
    }).factory('PhoneBookSvc', function ($http, blacktiger, $rootScope) {
        'use strict';
        return {
            updateEntry: function (phoneNumber, name) {
                return $http.post(blacktiger.getServiceUrl() + 'phonebook/' + phoneNumber, name).then(function (response) {
                    $rootScope.$broadcast('PhoneBookSvc.update', phoneNumber, name);
                    return;
                });
            }
        };
    }).factory('ReportSvc', function ($http, $q, blacktiger, $timeout) {
        'use strict';
        return {
            getReport: function(dateFrom, dateTo, minDuration) {
                return $timeout(function() {
                    return [
                        {
                            phoneNumber: '+4512121212',
                            name: 'John Doe',
                            numberOfCalls: 2,
                            totalDuration: 122,
                            firstCallTimestamp: 222222222,
                            type: 'Host'
                        },
                        {
                            phoneNumber: '+4521212121',
                            name: 'Jane Doe',
                            numberOfCalls: 3,
                            totalDuration: 122,
                            firstCallTimestamp: 222222222,
                            type: 'Phone'
                        }
                    ];
                }, 10);
            },
            findByNumbers: function (room, numbers) {
                return $http.get(blacktiger.getServiceUrl() + "reports/" + room + '?numbers=' + numbers.join()).then(function (request) {
                    return request.data;
                });
            }
        };
    }).factory('SipUserSvc', function ($http, blacktiger, $rootScope) {
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
