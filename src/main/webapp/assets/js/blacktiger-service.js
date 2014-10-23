/*global angular, SockJS, Stomp*/

/****************************************************************
 * PROVIDER                                                     *
 ***************************************************************/

/**
 * Provider for blacktiger services.
 * Gives access to serviceUrl, native language names and unique instance id
 */
function BlacktigerProvider() {
        'use strict';
        var serviceUrl = 'http://b.telesal.org',
            languageNames = {
                'da': 'Dansk',
                'en': 'English',
                'fo': 'Føroyskt',
                'kl': 'Kalaallisut',
                'sv': 'Svenska',
                'no': 'Norsk',
                'is': 'Íslenska',
                'es': 'Español'
            };

        var instanceId = window.name;
        if(!instanceId || "" === instanceId) {
            window.name = new Date().getTime();
            instanceId = window.name;
        }
            

        var innerSetServiceUrl = function(url) {
            if (url.charAt(url.length - 1) !== '/') {
                url = url + '/';
            }
            
            serviceUrl = url;
        };
        
        this.setServiceUrl = innerSetServiceUrl;

        this.$get = function () {
            return {
                getServiceUrl: function () {
                    return serviceUrl;
                },
                setServiceUrl: innerSetServiceUrl,
                getE164Pattern: function () {
                    return /^\+[0-9]{5,15}$/;
                },
                getLanguageNames: function () {
                    return languageNames;
                },
                getInstanceId: function () {
                    return instanceId;
                }
            };
        };
    }
    
/****************************************************************
 * SERVICES                                                     *
 ***************************************************************/

/**
 * Service for handling Login.
 * 
 * Exposes the methods 'authenticate', 'deauthenticate' and 'getCurrentUser'. 
 * 
 * When authentication is done its builds a token from the specified username or 
 * password - or if they are not supplied it tries get it from LocalStorage.
 * 
 * If token is successfully built or retrieved authentication will progress - otherwise rejected.
 * When authentication progresses it will start by sending a request to <serviceurl>/system/authenticate 
 * with an 'Authorization' header carrying the token.
 * 
 * If responsestatus for this request is not '200', then the authentication is rejected. Otherwise it is 
 * considered successfull and will progress by storing token in LocalStorage(only if 'remember' is true),
 * applying authorization header as a default header for all subsequent requests, setting user at $rootScope.currentUser
 * and finally broadcasting 'login' with the user as a parameter.
 */
function LoginSvc($q, localStorageService, $http, $rootScope, blacktiger, $log) {
    'use strict';
    var currentUser = null;
    return {
        authenticate: function (username, password, remember) {

            var user = null,
                authHeader, token;

            if (!username && !password) {
                token = localStorageService.get('LoginToken');
            } else if (username && password) {
                token = btoa(username + ':' + password);
            }

            if (token) {
                authHeader = 'Basic ' + token;
                return $http.get(blacktiger.getServiceUrl() + "system/authenticate", {
                    headers: {
                        'Authorization': authHeader
                    }
                }).then(function (response) {
                    if (response.status !== 200) {
                        var reason = response.status == 404 ? null : response.data;
                        if (!reason || '' === reason) {
                            reason = {
                                message: 'Unable to communicate with server'
                            };
                        }
                        localStorageService.remove('LoginToken');
                        console.info('Unable to authenticate: ' + reason.message);
                        return $q.reject('Unable to authenticate. Reason: ' + reason.message);
                    }

                    if (remember) {
                        localStorageService.add('LoginToken', token);
                    }

                    $rootScope.credentials = {
                        username: username,
                        password: password
                    };
                    user = response.data;

                    $log.info('Authenticatated. Returning user.');
                    $http.defaults.headers.common.Authorization = authHeader;

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
        getCurrentUser: function () {
            return currentUser;
        },
        deauthenticate: function () {
            $http.defaults.headers.common.Authorization = undefined;
            localStorageService.remove('LoginToken');
            $rootScope.$broadcast("logout", currentUser);
            currentUser = null;
            $rootScope.currentUser = null;
            $rootScope.$broadcast("afterLogout", currentUser);
            
        }
    };
}
LoginSvc.$inject = ['$q', 'localStorageService', '$http', '$rootScope', 'blacktiger', '$log'];

/**
 * Service for retreiving information about the system.
 * 
 * This service exposes one method: 'getSystemInfo'.
 * getSystemInfo returns a promise that, when it is susccessfull, will hold an object with information about the system.
 * It will be retreived by requesting <serviceurl>/system/information.
 */
function SystemSvc($http, blacktiger) {
    'use strict';
    return {
        getSystemInfo: function () {
            return $http.get(blacktiger.getServiceUrl() + 'system/information').then(function (response) {
                return response.data;
            });
        }
    };
}
SystemSvc.$inject = ['$http', 'blacktiger'];

/*
function RemoteSongSvc($q, $http) {
        'use strict';
        var baseUrl = "assets/music/"; //"http://telesal.s3.amazonaws.com/music/";
        var baseSongName = "iasn_E_000";
        var replacePattern = /(iasn_E_)([0]{3})/;
        var lpad = function (s, width, character) {
            return (s.length >= width) ? s : (new Array(width).join(character) + s).slice(-width);
        };

        return {
            getNumberOfSongs: function () {
                return 1; //135;
            },
            readBlob: function (number) {
                var deferred = $q.defer(),
                    numberf = lpad(number, 3, '0'),
                    songName = baseSongName.replace(replacePattern, "\$1" + numberf.toString() + ".mp3"),
                    url = baseUrl + songName;

                $http({
                    method: 'GET',
                    url: url,
                    responseType: 'blob'
                }).success(function (data, status, headers, config) {
                    deferred.resolve(data);
                }).error(function (data, status, headers, config) {
                    deferred.reject();
                });
                return deferred.promise;
            }

        };
    }
RemoteSongSvc.$inject = ['$q', '$http'];
 */
    

/**
 * Service for retreiving the rooms the current user has access to.
 */
function RoomSvc(blacktiger, $resource) {
    'use strict';
    var resource = $resource(blacktiger.getServiceUrl() + 'rooms/:id', {}, {
        put: {
            method: 'PUT'
        },
        all: {
            method: 'GET',
            url: blacktiger.getServiceUrl() + 'participants',
            isArray: true
        }
    });
    return {
        query: function (mode) {
            var params;
            if (mode) {
                params = {
                    mode: mode
                };
            }
            return resource.query(params);
        },
        get: function (id) {
            return resource.get({
                id: id
            });
        },
        save: function (room) {
            return resource.put({
                id: room.id
            }, room);
        },
        all: function () {
            return resource.all();
        }
    };
}
RoomSvc.$inject = ['blacktiger', '$resource'];

/**
 * Service for retreiving participants currently in a room.
 */
function ParticipantSvc(blacktiger, $resource, $log, $http) {
    'use strict';
    var resource = $resource(blacktiger.getServiceUrl() + 'rooms/:roomid/participants/:id', {}, {
        mute: {
            method: 'POST',
            url: blacktiger.getServiceUrl() + 'rooms/:roomid/participants/:id/muted'
        },
        put: {
            method: 'PUT'
        }
    });
    return {
        query: function (roomid) {
            return resource.query({
                roomid: roomid
            });
        },
        get: function (roomId, id) {
            return resource.get({
                roomid: roomId,
                id: id
            });
        },
        kick: function (roomId, id) {
            return resource.remove({
                roomid: roomId,
                id: id
            });
        },
        save: function (roomId, participant) {
            participant = angular.copy(participant);
            delete participant.commentRequested;
            return resource.put({
                roomid: roomId,
                id: participant.channel
            }, participant);
        },
        mute: function (roomId, id) {
            $log.info('Muting participant: [room=' + roomId + ';id=' + id + ']');
            return $http.post(blacktiger.getServiceUrl() + 'rooms/' + roomId + '/participants/' + id + '/muted', true).then(function () {
                return;
            });
            //return resource.mute({roomid:roomId, id:id}, true);
        },
        unmute: function (roomId, id) {
            $log.info('Unmuting participant: [room=' + roomId + ';id=' + id + ']');
            return $http.post(blacktiger.getServiceUrl() + 'rooms/' + roomId + '/participants/' + id + '/muted', false).then(function () {
                return;
            });
            //return resource.mute({roomid:roomId, id:id}, false);
        }
    };
}
ParticipantSvc.$inject = ['blacktiger', '$resource', '$log', '$http'];

/**
 * Service for communicating with the server over the Stomp protocol.
 * See http://jmesnil.net/stomp-websocket/doc/ for more info.
 */
function StompSvc($rootScope) {
    var stompClient = {};

    function NGStomp(url) {
        var ws = new SockJS(url);
        this.stompClient = Stomp.over(ws);
    }

    NGStomp.prototype.subscribe = function (queue, callback) {
        return this.stompClient.subscribe(queue, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                callback(args[0]);
            });
        });
    };

    NGStomp.prototype.send = function (queue, headers, data) {
        this.stompClient.send(queue, headers, data);
    };

    NGStomp.prototype.connect = function (user, password, on_connect, on_error, vhost) {
        // The Spring Stomp implementation does not like user/password, event though it should just ignore it.
        // Sending empty headers instead of user/pass.
        this.stompClient.connect({},
            function (frame) {
                $rootScope.$apply(function () {
                    on_connect.apply(stompClient, frame);
                });
            },
            function (frame) {
                $rootScope.$apply(function () {
                    on_error.apply(frame);
                });
            } /*, vhost*/ );
    };

    NGStomp.prototype.disconnect = function (callback) {
        this.stompClient.disconnect(function () {
            var args = arguments;
            $rootScope.$apply(function () {
                callback.apply(args);
            });
        });
    };

    return function (url) {
        return new NGStomp(url);
    };
}
StompSvc.$inject = ['$rootScope'];

/**
 * Service for handling information about an active meeting.
 * NB: Currently this has some of the same logic as RealtimeSvc.
 * See https://github.com/DRB-IT/blacktiger-web/issues/123
 */
function MeetingSvc(CONFIG, $rootScope, $timeout, ParticipantSvc, blacktiger, StompSvc, $log) {
    'use strict';
    var participants = [],
        currentRoom = null,
        commentCancelPromiseArray = [],
        stompClient,
        commentRequestTimeout = CONFIG.commentRequestTimeout,
        eventSubscription = null;

    var indexByChannel = function (channel) {
        var index = -1;
        angular.forEach(participants, function (p, currentIndex) {
            if (p.channel === channel) {
                index = currentIndex;
                return false;
            }
        });
        return index;
    };

    var handleMute = function (channel, value) {
        var index = indexByChannel(channel);
        if (index >= 0) {
            var p = participants[index];
            p.commentRequested = false;
            if (value !== p.muted) {
                p = angular.copy(p);
                p.muted = value;
                ParticipantSvc.save(currentRoom.id, p);
            }
        }
    };

    var updateCancelPromise = function (id, newPromise) {
        if (commentCancelPromiseArray[id]) {
            $timeout.cancel(commentCancelPromiseArray[id]);
        }
        if (newPromise) {
            commentCancelPromiseArray[id] = newPromise;
        }
    };

    var setParticipantCommentRequested = function (userId, value) {
        var index = indexByChannel(userId);
        participants[index].commentRequested = !value;
        $timeout(function () {
            if (index >= 0) {
                participants[index].commentRequested = value;
            }
        }, 10);
    };

    var handleEvent = function (event) {
        var index, promise, channel;
        channel = event.participant ? event.participant.channel : event.channel;
        switch (event.type) {
        case 'Join':
            onJoin(event.participant);
            break;
        case 'Leave':
            $log.info('Leave Event Recieved for participantId "' + angular.toJson(event) + '"');
            index = indexByChannel(channel);
            if (index >= 0) {
                var p = participants[index];
                participants.splice(index, 1);
                $rootScope.$broadcast('MeetingSvc.Leave', p);
            }

            break;
        case 'Change':
            index = indexByChannel(channel);
            participants[index] = event.participant;
            $rootScope.$broadcast('MeetingSvc.Change', event.participant);
            break;
        case 'CommentRequest':
            $log.debug('CommentRequest');
            setParticipantCommentRequested(channel, true);
            promise = $timeout(function () {
                setParticipantCommentRequested(channel, false);
            }, commentRequestTimeout);
            updateCancelPromise(channel, promise);
            break;
        case 'CommentRequestCancel':
            $log.debug('CommentRequestCancel');
            setParticipantCommentRequested(channel, false);
            updateCancelPromise(channel);
            break;
        case 'Mute':
            $log.debug('Mute');
            index = indexByChannel(channel);
            participants[index].muted = true;
            break;
        case 'Unmute':
            $log.debug('Unmute');
            index = indexByChannel(channel);
            participants[index].muted = false;
            break;
        }
    };

    var clear = function () {
        if (eventSubscription) {
            eventSubscription.unsubscribe();
            eventSubscription = null;
        }

        participants.splice(0);
    };

    var subscribeToChanges = function () {
        stompClient = StompSvc(blacktiger.getServiceUrl() + 'socket');
        stompClient.connect($rootScope.credentials.username, $rootScope.credentials.password, function () {
            //+ currentRoom
            eventSubscription = stompClient.subscribe("/queue/events/" + currentRoom.id, function (message) {
                var e = angular.fromJson(message.body);
                handleEvent(e);
            });
        }, function () {
            $rootScope.$broadcast('MeetingSvc.Lost_Connection');
        }, '/');
    };

    var onJoin = function (p) {
        participants.push(p);
        $rootScope.$broadcast('MeetingSvc.Join', p);
    };

    return {
        getParticipantList: function () {
            return participants;
        },
        getRoom: function() {
            return currentRoom;
        },
        setRoom: function (newRoom) {
            clear();

            if (!newRoom) {
                return;
            }

            currentRoom = newRoom;
            $rootScope.$broadcast('MeetingSvc.RoomChanged', currentRoom);
            $log.info('Room changed.');

            ParticipantSvc.query(currentRoom.id).$promise.then(function (data) {
                angular.forEach(data, function (p) {
                    onJoin(p);
                });

                subscribeToChanges();
            });
        },
        kick: function (userId) {
            ParticipantSvc.kick(currentRoom.id, userId);
        },
        mute: function (userId) {
            handleMute(userId, true);
        },
        unmute: function (userId) {
            handleMute(userId, false);
        },
        clear: function () {
            clear();
            currentRoom = null;
            $rootScope.$broadcast('MeetingSvc.RoomChanged', null);
        }

    };
}
MeetingSvc.$inject = ['CONFIG', '$rootScope', '$timeout', 'ParticipantSvc', 'blacktiger', 'StompSvc', '$log'];

/**
 * Service for handling information about all active meetings
 * NB: Currently this has some of the same logic as MeetingSvc.
 * See https://github.com/DRB-IT/blacktiger-web/issues/123
 */
function RealtimeSvc($rootScope, $timeout, RoomSvc, StompSvc, blacktiger, $log) {
    'use strict';
    var rooms = [],
        stompClient, commentCancelPromiseArray = [];

    var indexByChannel = function (participants, channel) {
        var index = -1;
        angular.forEach(participants, function (p, currentIndex) {
            if (p.channel === channel) {
                index = currentIndex;
                return false;
            }
        });
        return index;
    };

    var updateCancelPromise = function (id, newPromise) {
        if (commentCancelPromiseArray[id]) {
            $timeout.cancel(commentCancelPromiseArray[id]);
        }
        if (newPromise) {
            commentCancelPromiseArray[id] = newPromise;
        }
    };

    var getRoomById = function (id) {
        var room;
        angular.forEach(rooms, function (current) {
            if (id === current.id) {
                room = current;
                return false;
            }
        });
        return room;
    };

    var removeRoomById = function (id) {
        var i;
        for (i = 0; i < rooms.length; i++) {
            if (id === rooms[i].id) {
                break;
            }
        }

        if (i < rooms.length) {
            rooms.splice(i, 1);
        }
    };

    var handleEvent = function (event) {
        var index, promise, room;
        if (event.type === 'ConferenceStart') {
            rooms.push(event.room);
            return;
        } else if (event.type === 'ConferenceEnd') {
            removeRoomById(event.roomNo);
            return;
        }

        room = getRoomById(event.roomNo);
        if (!room.participants) {
            room.participants = [];
        }

        if (event.type === 'Join') {
            room.participants.push(event.participant);
        } else {
            var channel = event.participant ? event.participant.channel : event.channel;
            index = indexByChannel(room.participants, channel);
            if (index >= 0) {
                switch (event.type) {
                case 'Leave':
                    room.participants.splice(index, 1);
                    break;
                case 'Change':
                    room.participants[index] = event.participant;
                    break;
                case 'CommentRequest':
                    $log.debug('CommentRequest');
                    room.participants[index].commentRequested = true;
                    promise = $timeout(function () {
                        room.participants[index].commentRequested = false;
                    }, 15000);
                    updateCancelPromise(channel, promise);
                    break;
                case 'CommentRequestCancel':
                    $log.debug('CommentRequestCancel');
                    room.participants[index].commentRequested = false;
                    updateCancelPromise(channel);
                    break;
                case 'Mute':
                    $log.debug('Mute');
                    room.participants[index].muted = true;
                    break;
                case 'Unmute':
                    $log.debug('Unmute');
                    room.participants[index].muted = false;
                    break;
                }
            }
        }

    };

    var initializeSocket = function () {
        stompClient = StompSvc(blacktiger.getServiceUrl() + 'socket');
        // $rootScope.credentials.username, $rootScope.credentials.password
        stompClient.connect(null, null, function () {
            //+ currentRoom
            RoomSvc.all().$promise.then(function (result) {
                angular.forEach(result, function (room) {
                    rooms.push(room);
                });
                stompClient.subscribe("/queue/events/*", function (message) {
                    var e = angular.fromJson(message.body);
                    handleEvent(e);
                });
            });

        }, function () {
            alert("Unable to connecto to socket");
        }, '/');
    };

    initializeSocket();

    return {
        getRoomList: function () {
            return rooms;
        }
    };
}
RealtimeSvc.$inject = ['$rootScope', '$timeout', 'RoomSvc', 'StompSvc', 'blacktiger', '$log'];

/**
 * Service for updating names related to a phone number.
 */
function PhoneBookSvc($http, blacktiger, $rootScope) {
    'use strict';
    return {
        updateEntry: function (phoneNumber, name) {
            return $http.put(blacktiger.getServiceUrl() + 'phonebook/' + phoneNumber, name).then(function (response) {
                $rootScope.$broadcast('PhoneBookSvc.update', phoneNumber, name);
                return;
            });
        }
    };
}
PhoneBookSvc.$inject = ['$http', 'blacktiger', '$rootScope'];

/**
 * Service for retreiving report information.
 * NB: Currently only a dummy implementation.
 */
function ReportSvc($http, $q, blacktiger, $timeout) {
    'use strict';
    return {
        getReport: function (dateFrom, dateTo, minDuration) {
            return $timeout(function () {
                return [
                    {
                        phoneNumber: '+4512121212',
                        name: 'Bronderslev rigssal',
                        numberOfCalls: 2,
                        totalDuration: 122,
                        firstCallTimestamp: 1336543882588,
                        type: 'Host'
                        },
                    {
                        phoneNumber: '+4521212121',
                        name: 'Jane Doe',
                        numberOfCalls: 3,
                        totalDuration: 122,
                        firstCallTimestamp: 1332453882588,
                        type: 'Phone'
                        },
                    {
                        phoneNumber: '+4523456768',
                        name: 'Johnny Doe',
                        numberOfCalls: 3,
                        totalDuration: 546,
                        firstCallTimestamp: 1332403882588,
                        type: 'Computer'
                        }
                    ];
            }, 10);
        },
        findByNumbers: function (room, numbers) {
            var params = {
                numbers: numbers
            };
            return $http.get(blacktiger.getServiceUrl() + "reports/" + room, {
                params: params
            }).then(function (request) {
                return request.data;
            });
        }
    };
}
ReportSvc.$inject = ['$http', '$q', 'blacktiger', '$timeout'];

/**
 * Service for working with SIP user information.
 */
function SipUserSvc($http, blacktiger, $rootScope, $q) {
    'use strict';
    return {
        create: function (user) {
            return $http.post(blacktiger.getServiceUrl() + 'sipaccounts', user).then(function (response) {
                if (response.status !== 200) {
                    var message = response.data && response.data.message ? response.data.message : response.status;
                    return $q.reject(message);
                }
                return;
            });
        },

        get: function (key, number) {
            var data = {
                key: key
            };
            return $http({
                method: 'GET',
                url: blacktiger.getServiceUrl() + 'sipaccounts/' + number,
                params: data
            }).then(function (response) {
                if (response.status !== 200) {
                    var message = response.data && response.data.message ? response.data.message : response.status;
                    return $q.reject(message);
                }
                return response.data;
            });
        }
    };
}
SipUserSvc.$inject = ['$http', 'blacktiger', '$rootScope', '$q'];

/**
 * Registration of provider and services.
 */
angular.module('blacktiger-service', ['ngCookies', 'ngResource', 'LocalStorageModule'])
    .provider('blacktiger', BlacktigerProvider)
    /*.factory('RemoteSongSvc', RemoteSongSvc)*/
    .factory('LoginSvc', LoginSvc)
    .factory('SystemSvc', SystemSvc)
    .factory('RoomSvc', RoomSvc)
    .factory('ParticipantSvc', ParticipantSvc)
    .factory('StompSvc', StompSvc)
    .factory('MeetingSvc', MeetingSvc)
    .factory('RealtimeSvc', RealtimeSvc)
    .factory('PhoneBookSvc', PhoneBookSvc)
    .factory('ReportSvc', ReportSvc)
    .factory('SipUserSvc', SipUserSvc);
