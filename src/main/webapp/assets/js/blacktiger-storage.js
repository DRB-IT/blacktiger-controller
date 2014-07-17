angular.module('blacktiger-storage', [])
    .factory('DbStorageSvc', function ($q, $timeout) {
        'use strict';
        var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
            IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
            dbVersion = 1,
            database = null,
            dbName = "files",
            storeName = "songs";

        var onUpgrade = function (ev) {
            var database = ev.target.result;
            // Create an objectStore
            console.log("Creating objectStore");
            database.createObjectStore(storeName);
        };


        return {
            init: function () {
                var deferred = $q.defer(), onOpen, handleError, request;

                if (database === null) {
                    onOpen = function (event) {
                        database = event.target.result;
                        console.log("Success creating/accessing IndexedDB database");

                        database.onerror = function (event) {
                            console.log("Error creating/accessing IndexedDB database");
                        };

                        deferred.resolve();
                    };

                    handleError = function () {
                        deferred.reject();
                    };

                    request = indexedDB.open(dbName, dbVersion);
                    request.onsuccess = onOpen;
                    request.onerror = handleError;
                    request.onupgradeneeded = onUpgrade;
                } else {
                    $timeout(function () {
                        deferred.resolve();
                    }, 1);
                }
                return deferred.promise;
            },
            isSupported: function () {
                return indexedDB !== null && navigator.userAgent.indexOf('Chrome') < 0;
            },
            hasBlobs: function (names) {
                var deferred = $q.defer(),
                    transaction = database.transaction([storeName], "readonly"),
                    store = transaction.objectStore(storeName);

                store.openCursor().onsuccess = function (event) {
                    var cursor = event.target.result, index;
                    if (cursor) {
                        console.log(cursor.key);
                        index = names.indexOf(cursor.key);
                        if (index >= 0) {
                            names.splice(index, 1);
                        }
                        cursor.continue();
                    } else {
                        if (names.length === 0) {
                            deferred.resolve();
                        } else {
                            deferred.reject(names);
                        }
                    }
                };
                return deferred.promise;
            },
            readBlob: function (name) {
                var deferred = $q.defer(),
                    transaction = database.transaction([storeName], "readonly"),
                    request = transaction.objectStore(storeName).get(name);

                request.onsuccess = function (event) {
                    console.log("Got file:" + name);
                    var blob = event.target.result;
                    deferred.resolve(blob);
                };
                request.onerror = function (event) {
                    console.log("Error retreiving file:" + name);
                    deferred.reject(event);
                };
                return deferred.promise;
            },
            writeBlob: function (name, blob) {
                var deferred = $q.defer(),
                    transaction = database.transaction([storeName], "readwrite"),
                    request = transaction.objectStore(storeName).put(blob, name);

                request.onsuccess = function () {
                    console.log("File persisted:" + name);
                    deferred.resolve();
                };
                request.onerror = function (event) {
                    console.log("Error persisting file:" + name);
                    deferred.reject(event);
                };

                return deferred.promise;
            }
        };
    }).factory('FileStorageSvc', function ($q, $timeout) {
        'use strict';
        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        var fileSystem = null;

        var onFailFs = function (code) {
            var msg = '';

            switch (code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
            }

            console.log('Error: ' + msg);
        };




        return {
            init: function () {
                var deferred = $q.defer();

                if (fileSystem === null) {
                    var size = 800000000;

                    var onQuotaGranted = function () {
                        window.requestFileSystem(window.PERSISTENT, size, onInitFs, handleError);
                    };

                    var onInitFs = function (fs) {
                        console.log('Opened file system: ' + fs.name);
                        fileSystem = fs;
                        deferred.resolve();
                    };

                    var handleError = function (e) {
                        onFailFs(e.code);
                        deferred.reject();
                    };

                    //window.webkitStorageInfo.queryUsageAndQuota()
                    navigator.webkitPersistentStorage.requestQuota(size, onQuotaGranted, handleError);
                } else {
                    $timeout(function () {
                        deferred.resolve();
                    }, 1);
                }
                return deferred.promise;
            },
            isSupported: function () {
                return window.requestFileSystem !== undefined;
            },
            hasBlobs: function (names) {
                var deferred = $q.defer(),
                    dirReader = fileSystem.root.createReader(),
                    i, index;
                dirReader.readEntries(function (results) {
                    for (i = 0; i < results.length; i++) {
                        index = names.indexOf(results[i].name);
                        if (index >= 0) {
                            names.splice(index, 1);
                        }
                    }

                    if (names.length === 0) {
                        deferred.resolve();
                    } else {
                        deferred.reject(names);
                    }
                }, function () {
                    deferred.reject();
                });

                return deferred.promise;
            },
            readBlob: function (name) {
                var deferred = $q.defer();
                fileSystem.root.getFile(name, {}, function (fileEntry) {
                    fileEntry.file(function (file) {
                        var reader = new FileReader();

                        reader.onloadend = function (e) {
                            deferred.resolve(new Blob([reader.result]));
                        };

                        reader.onerror = function (e) {
                            deferred.reject();
                        };

                        reader.readAsArrayBuffer(file);
                    }, onFailFs);

                }, onFailFs);
                return deferred.promise;
            },
            writeBlob: function (name, blob) {
                var deferred = $q.defer();

                fileSystem.root.getFile(name, {
                    create: true
                }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function (e) {
                            deferred.resolve();
                        };
                        fileWriter.onerror = function (e) {
                            deferred.reject();
                        };
                        fileWriter.write(blob);
                    }, onFailFs);
                }, onFailFs);

                return deferred.promise;
            }
        };
    }).factory('RemoteSongSvc', function ($q, $http) {
        var baseUrl = "assets/music/"; //"http://telesal.s3.amazonaws.com/music/";
        var baseSongName = "iasn_E_000";
        var replacePattern = /(iasn_E_)([0]{3})/;
        var lpad = function (s, width, char) {
            return (s.length >= width) ? s : (new Array(width).join(char) + s).slice(-width);
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
    }).factory('StorageSvc', function (FileStorageSvc, DbStorageSvc) {
        var storage = null;

        if (DbStorageSvc.isSupported()) {
            storage = DbStorageSvc;
        } else if (FileStorageSvc.isSupported()) {
            storage = FileStorageSvc;
        }

        return {
            init: function () {
                return storage.init();
            },
            hasBlobs: function (names) {
                return storage.hasBlobs(names);
            },
            readBlob: function (name) {
                return storage.readBlob(name);
            },
            writeBlob: function (name, blob) {
                return storage.writeBlob(name, blob);
            }
        };
    });
