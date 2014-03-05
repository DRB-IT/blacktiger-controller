angular.module('blacktiger-service', ['ngCookies', 'ngResource'])
    .provider('blacktiger', function () {
        'use strict';
        var serviceUrl = "http://localhost:8080/";
        var forceLongPolling = false;
        
        this.setServiceUrl = function (url) {
            serviceUrl = url;
        };
        
        this.setForceLongPolling = function(value) {
            forceLongPolling = value;
        }

        this.$get = function () {
            return {
                getServiceUrl: function () {
                    return serviceUrl;
                },
                isLongPollingForced: function() {
                    return forceLongPolling;
                }
            };
        };
    }).factory('LoginSvc', function($q, $cookieStore, $http, $rootScope, blacktiger, $log) {
        'use strict'
        var currentUser = null;
        return {
            authenticate: function(username, password, remember) {

                var user = null, credentials, authHeader;

                /*if(angular.isDefined(username) && angular.isDefined(password)) {
                    $log.info('Authenticating [username:'+username+', password:'+password+', remember:'+remember+']');
                    credentials = {username: username, password: password};
                } else {
                    $log.info('Authenticating from data in cookiestore');
                    user = $cookieStore.get('user');
                    if(user) {
                        $log.info("user: " + user);
                        credentials = user.authtoken;
                    }
                }*/

                if(username && password) {
                    authHeader = 'Basic ' + btoa(username + ':' + password);
                    return $http.get(blacktiger.getServiceUrl() + "system/authenticate", {headers: {'Authorization': authHeader}}).then(function(response) {
                        if(response.status !== 200) {
                            var reason = response.data;
                            if(!reason || '' === reason) {
                                reason = 'Unable to communicate with server';
                            }
                            console.info('Unable to authenticate: ' + reason);
                            return $q.reject('Unable to authenticate. Reason: ' + reason);
                        }
                        $rootScope.credentials = {username: username, password: password};
                        user = response.data;

                        if(remember) {
                            $cookieStore.put('user', user);
                        }

                        $log.info('Authenticatated. Returning user.');
                        //$http.defaults.headers.common['X-Auth-Token'] = user.authtoken;
                        $http.defaults.headers.common['Authorization'] = authHeader;

                        $log.info('Logged in as ' + user.username);
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
    }).factory('SystemSvc', function($http, blacktiger) {
        'use strict'
        return {
            getSystemInfo: function() {
                return $http.get(blacktiger.getServiceUrl() + 'system/information').then(function(response) {
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
    })/*.factory('EventSvc', function (blacktiger, $http) {
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
    })*/.factory('StompSvc', function($rootScope) {
        var stompClient = {};

        function NGStomp(url) {
            var ws = new SockJS(url);
            this.stompClient = Stomp.over(ws);
        }

        NGStomp.prototype.subscribe = function(queue, callback) {
            this.stompClient.subscribe(queue, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback(args[0]);
                })
            })
        }

        NGStomp.prototype.send = function(queue, headers, data) {
            this.stompClient.send(queue, headers, data);
        }

        NGStomp.prototype.connect = function(user, password, on_connect, on_error, vhost) {
            this.stompClient.connect(user, password,
                function(frame) {
                    $rootScope.$apply(function() {
                        on_connect.apply(stompClient, frame);
                    })
                },
                function(frame) {
                    $rootScope.$apply(function() {
                        on_error.apply(frame);
                    })
                }, vhost);
        }

        NGStomp.prototype.disconnect = function(callback) {
            this.stompClient.disconnect(function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(args);
                })
            })
        }

        return function(url) {
            return new NGStomp(url);
        }
    }).factory('MeetingSvc', function ($rootScope, $timeout, ParticipantSvc, blacktiger, StompSvc, $log) {
        'use strict';
        var participants = [], currentRoom = null, commentCancelPromiseArray = [], stompClient;
    
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
    
        var updateCancelPromise = function(id, newPromise) {
            if(commentCancelPromiseArray[id]) {
                $timeout.cancel(commentCancelPromiseArray[id]);
            }
            if(newPromise) {
                commentCancelPromiseArray[id] = newPromise;
            }
        };
    
        var setParticipantCommentRequested = function(userId, value) {
            var index = indexByUserId(userId);
            if(index >= 0) {
                participants[index].commentRequested = value;
            }
        };
    
        var handleEvent = function(event) {
            var index, participant, promise;
            switch(event.type) {
                case 'Join':
                    onJoin(event.participant);
                    break;
                case 'Leave':
                    $log.info('Leave Event Recieved for participantId "' + angular.toJson(event) + '"');
                    index = indexByUserId(event.participantId);
                    if(index >= 0) {
                        participants.splice(index, 1);
                    }
                    $rootScope.$broadcast('MeetingSvc.Leave', event.participantId);
                    break;
                case 'Change':
                    index = indexByUserId(event.participant.userId);
                    participants[index] = event.participant;
                    $rootScope.$broadcast('MeetingSvc.Change', event.participant);
                    break;
                case 'CommentRequest':
                    $log.debug('CommentRequest');
                    setParticipantCommentRequested(event.participantId, true);
                    promise = $timeout(function() {
                            setParticipantCommentRequested(event.participantId, false);
                        }, 15000);
                    updateCancelPromise(event.participantId, promise);
                    break;
                case 'CommentRequestCancel':
                    $log.debug('CommentRequestCancel');
                    setParticipantCommentRequested(event.participantId, false);
                    updateCancelPromise(event.participantId);
                    break;
            }
        };
        /*var subscribeForChangesViaLongPoll = function(timestamp) {
            var data = {};
            if(timestamp !== undefined) {
                data.since = timestamp;
            }

            if(!currentRoom) {
                return; 
            }
            $log.debug('Called subscribeForChangesViaLongPoll with timestamp: ' + timestamp);

            EventSvc.query(currentRoom.id, timestamp).then(function(data) {
                $log.info('Changes received from server [' + data.events.length + ']');

                var timestamp = data.timestamp;
                angular.forEach(data.events, function(e) {
                    handleEvent(e);
                });
                $timeout(function() {
                    subscribeForChangesViaLongPoll(timestamp);
                }, 150);
            });
        };*/
    
        var subscribeToChanges = function() {
            stompClient = StompSvc(blacktiger.getServiceUrl() + 'socket');
            stompClient.connect($rootScope.credentials.username, $rootScope.credentials.password, function(){
                //+ currentRoom
                stompClient.subscribe("/queue/events/H45-0000", function(message) {
                    var e = angular.fromJson(message.body);
                    handleEvent(e);
                });
            }, function(){
                subscribeForChangesViaLongPoll();
            }, '/');
        }
    
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
                $log.info('Room changed.');
                participants.splice(0);
                ParticipantSvc.query(currentRoom.id).$promise.then(function(data) {
                    angular.forEach(data, function(p) {
                        onJoin(p);
                    });
                    
                    if(blacktiger.isLongPollingForced()) {
                        subscribeForChangesViaLongPoll();
                    } else {
                        subscribeToChanges();
                    }
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
    
    }).factory('RealtimeSvc', function ($rootScope, $timeout, RoomSvc, StompSvc, blacktiger, $log) {
        'use strict';
        var rooms = RoomSvc.query('full'), stompClient;
        
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
    
        var updateCancelPromise = function(id, newPromise) {
            if(commentCancelPromiseArray[id]) {
                $timeout.cancel(commentCancelPromiseArray[id]);
            }
            if(newPromise) {
                commentCancelPromiseArray[id] = newPromise;
            }
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
    
        var handleEvent = function(event) {
            var index, participant, promise;
            var room = getRoomById(event.roomNo);
            if(!room.participants) {
                room.participants = [];
            }
            
            if(event.type === 'Join') {
                room.participants.push(event.participant);
            } else {
                var userId = event.participant ? event.participant.userId : event.participantId;
                index = indexByUserId(room.participants, userId);
                if(index>=0) {
                    switch(event.type) {
                        case 'Leave':
                            room.participants.splice(index, 1);
                            break;
                        case 'Change':
                            room.participants[index] = event.participant;
                            break;
                        case 'CommentRequest':
                            $log.debug('CommentRequest');
                            room.participants[index].commentRequest = true;
                            promise = $timeout(function() {
                                    room.participants[index].commentRequest = false;
                                }, 15000);
                            updateCancelPromise(userId, promise);
                            break;
                        case 'CommentRequestCancel':
                            $log.debug('CommentRequestCancel');
                            room.participants[index].commentRequest = false;
                            updateCancelPromise(userId);
                            break;
                    }
                }
            }
            
        };
    
        var initializeSocket = function() {
            stompClient = StompSvc(blacktiger.getServiceUrl() + 'socket');
            stompClient.connect("admin", "123", function(){
                //+ currentRoom
                
                stompClient.subscribe("/rooms/*", function(data) {
                    var events = angular.fromJson(data.body);
                    for(var i=0;i<events.length;i++) {
                        handleEvent(events[i]);
                    }
                    
                    stompClient.subscribe("/queue/events/*", function(message) {
                        var e = angular.fromJson(message.body);
                        handleEvent(e);
                    });
                });
                
            }, function(){
                alert("Unable to connecto to socket");
            }, '/');
        };
    
        initializeSocket();
    
        return {
            getRoomList: function() {
                return rooms;
            }
        };
    
    }).factory('PhoneBookSvc', function ($http, blacktiger, $rootScope) {
        'use strict';
        return {
            updateEntry: function (phoneNumber, name) {
                return $http.put(blacktiger.getServiceUrl() + 'phonebook/' + phoneNumber, name).then(function (response) {
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
                        },
                        {
                            phoneNumber: '+4523456768',
                            name: 'John Doe',
                            numberOfCalls: 3,
                            totalDuration: 546,
                            firstCallTimestamp: 222222222,
                            type: 'Computer'
                        }
                    ];
                }, 10);
            },
            findByNumbers: function (room, numbers) {
                var params = {numbers: numbers}
                return $http.get(blacktiger.getServiceUrl() + "reports/" + room, {params: params}).then(function (request) {
                    return request.data;
                });
            }
        };
    }).factory('SipUserSvc', function ($http, blacktiger, $rootScope) {
        'use strict';
        return {
            create: function (user) {
                return $http.post(blacktiger.getServiceUrl() + 'sipaccounts', user).then(function () {
                    return;
                });
            },

            isNumberAvailable: function(number) {
                var data = {phoneNumber: number};
                return $http({method: 'GET', url: blacktiger.getServiceUrl() + 'sipaccounts', params: data}).then(function (response) {
                    if(angular.isArray(response.data) && response.data > 0) {
                        return false;
                    } else {
                        return true;
                    }
                });
            }
        };
    });
