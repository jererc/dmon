'use strict';


//
// Main
//
function MainCtrl($rootScope, $scope, $location, apiSvc, eventSvc, utilsSvc) {

    $rootScope.apiStatus = false;

    function _checkApi(url) {
        apiSvc.checkUrl(url).
            error(function() {
                $rootScope.apiStatus = false;
                $location.path('settings');
            }).
            success(function(data) {
                $rootScope.apiStatus = (data.result == 'dmon');
                if ($rootScope.apiStatus) {
                    apiSvc.setUrl(url);
                    eventSvc.emit('getSettings');
                } else {
                    $location.path('settings');
                }
            });
    }

    function checkApi(url) {
        url = url || apiSvc.getUrl();
        if (url) {
            _checkApi(url);
        } else {
            apiSvc.getSettingsUrl().
                success(function(data) {
                    url = data.apiUrl || url;
                    _checkApi(url);
                });
        }
    }

    $rootScope.isMenuActive = function(path) {
        if ($location.path().substr(0, path.length) == path) {
            return 'active';
        }
        return '';
    };

    $rootScope.inArray = function(value, array) {
        if (!array) {
            return -1;
        }
        return utilsSvc.getIndex(value, array) != -1;
    };

    $rootScope.exists = function(val) {
        if (angular.isArray(val)) {
            return !!val.length;
        }
        return !!val;
    };

    $rootScope.$on('checkApi', function(event, args) {
        checkApi((!!args) ? args.url : null);
    });

    checkApi();

}


//
// Add modal
//
function AddModalCtrl($rootScope, $scope, apiSvc, eventSvc, utilsSvc) {

    $scope.service = {};
    $scope.defaultScript = "#!/bin/sh\nexec 2>&1\nexport LANG='en_US.UTF-8'\nexport LC_ALL='en_US.UTF-8'\nexec setuidgid <USER> <COMMAND>";

    function initAddForm() {
        if ($scope.createServiceForm) {
            $scope.createServiceForm.$setPristine();
        }
        $scope.service = {
            name: $scope.service.name || '',
            script: $scope.service.script || $scope.defaultScript,
        };
    }

    $scope.createService = function() {
        apiSvc.createService($scope.service).
            success(function(data) {
                if (data.error) {
                    console.error('failed to create service:', data.error);
                } else {
                    eventSvc.emit('updateServices');
                    $scope.service = {};
                }
            });
    };

    $rootScope.$on('openAddModal', function(event, data) {
        initAddForm();
    });

}


//
// Services list
//
function ServicesListCtrl($rootScope, $scope, $timeout, $location, apiSvc, utilsSvc) {

    $scope.services = [];
    $scope.serviceName = null;
    $scope.logData = '';

    $scope.statusInfo = {
        true: {name: 'up', action: 'stop', labelClass: 'label-success'},
        false: {name: 'down', action: 'start', labelClass: 'label-important'},
    };

    var active = true;
    var cacheDelta = 5000;
    var updateTimeout, updateLogTimeout;

    function updateServices(force) {
        $timeout.cancel(updateTimeout);
        if (!active) {
            return false;
        }
        if (!utilsSvc.focus && !force) {
            updateTimeout = $timeout(updateServices, cacheDelta);
        } else {
            apiSvc.listServices().
                error(function() {
                    updateTimeout = $timeout(updateServices, cacheDelta);
                    $location.path('settings');
                }).
                success(function(data) {
                    utilsSvc.updateList($scope.services, data.result, 'name');
                    updateTimeout = $timeout(updateServices, cacheDelta);
                });
        }
    }

    function updateLogData(force) {
        $timeout.cancel(updateLogTimeout);
        if (!active || !$scope.serviceName) {
            return false;
        }
        if (!utilsSvc.focus && !force) {
            updateLogTimeout = $timeout(updateLogData, cacheDelta);
        } else {
            apiSvc.getServiceLog($scope.serviceName).
                error(function() {
                    $scope.logData = '';
                    updateLogTimeout = $timeout(updateLogData, cacheDelta);
                }).
                success(function(data) {
                    $scope.logData = data.result;
                    updateLogTimeout = $timeout(updateLogData, cacheDelta);
                });
        }
    }

    $scope.setServiceStatus = function(service) {
        var action = $scope.statusInfo[service.status].action;
        apiSvc.processService(service.name, action).
            success(function(data) {
                if (data.error) {
                    console.error('failed to update service:', data.error);
                } else {
                    updateServices(true);
                }
            });
    };

    $scope.getLog = function(name) {
        $scope.serviceName = name;
        updateLogData(true);
    };

    $rootScope.$on('updateServices', function() {
        updateServices(true);
    });

    $scope.$on('$destroy', function() {
        active = false;
    });

    updateServices();

}


//
// Services modals
//
function ServicesModalCtrl($rootScope, $scope, apiSvc, eventSvc, utilsSvc) {

    $scope.updateService = function() {
        apiSvc.updateService($scope.service).
            success(function(data) {
                if (data.error) {
                    console.error('failed to update service:', data.error);
                } else {
                    eventSvc.emit('updateServices');
                }
            });
    };

    $scope.removeService = function() {
        apiSvc.removeService($scope.service.name).
            success(function(data) {
                if (data.error) {
                    console.error('failed to remove service:', data.error);
                } else {
                    eventSvc.emit('updateServices');
                }
            });
    };

    $rootScope.$on('openServiceModal', function(event, service) {
        $scope.service = angular.copy(service);
    });

}


//
// Settings list
//
function SettingsListCtrl($rootScope, $scope, apiSvc, eventSvc, utilsSvc) {

    function getSettings() {
        $scope.apiUrl = apiSvc.getUrl();
    }

    $scope.checkApi = function() {
        eventSvc.emit('checkApi', {url: $scope.apiUrl});
    };

    $scope.$on('getSettings', getSettings);

    $scope.checkApi();

}
