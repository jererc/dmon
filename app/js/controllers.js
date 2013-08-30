'use strict';


//
// Main
//
function MainCtrl($rootScope, $scope, $location, rootScopeSvc, apiSvc, eventSvc, utilsSvc) {

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
                    _checkApi(data.apiUrl);
                });
        }
    }

    $rootScope.$on('checkApi', function(event, args) {
        checkApi((!!args) ? args.url : null);
    });

    checkApi();

}


//
// Add modal
//
function AddModalCtrl($rootScope, $scope, apiSvc, eventSvc, utilsSvc) {

    function initAddForm() {
        if ($scope.createServiceForm) {
            $scope.createServiceForm.$setPristine();
        }
        if (!$scope.service) {
            $scope.service = {
                script: "#!/bin/sh\nexec 2>&1\nexport LANG='en_US.UTF-8'\nexport LC_ALL='en_US.UTF-8'\nexec setuidgid <USER> <COMMAND>",
            };
        }
    }

    $scope.createService = function() {
        apiSvc.createService($scope.service).
            success(function(data) {
                if (data.error) {
                    console.error('failed to create service:', data.error);
                } else {
                    eventSvc.emit('updateServices');
                    $scope.service = undefined;
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
function ServiceListCtrl($rootScope, $scope, $timeout, $location, apiSvc, utilsSvc) {

    $rootScope.hasResult = true;
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
                    $rootScope.hasResult = data.result.length > 0 ? true : false;
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
function ServiceModalCtrl($rootScope, $scope, apiSvc, eventSvc, utilsSvc) {

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
    }

    $scope.checkApi = function() {
        $scope.apiUrl = $scope.apiUrl || apiSvc.getUrl();
        eventSvc.emit('checkApi', {url: $scope.apiUrl});
    };

    $scope.$on('getSettings', getSettings);

    $scope.checkApi();

}
