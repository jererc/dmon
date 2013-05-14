'use strict';

(function() {

    var services = angular.module('dmonServices', ['ngResource', 'ngCookies']);

    services.service('apiSvc', function($http, $cookieStore) {

        this.getSettingsUrl = function() {
            return $http.get('local_settings.json');
        };

        this.getUrl = function() {
            return $cookieStore.get('dmonApiUrl');
        };

        this.setUrl = function(url) {
            $cookieStore.put('dmonApiUrl', url);
        };

        this.checkUrl = function(url) {
            return $http.get(url + '/status');
        };

        // Services
        this.createService = function(data) {
            return $http.post(this.getUrl() + '/service/create', data);
        };

        this.listServices = function() {
            return $http.get(this.getUrl() + '/service/list');
        };

        this.getServiceLog = function(name) {
            return $http.post(this.getUrl() + '/service/log',
                    {name: name});
        };

        this.processService = function(name, action) {
            return $http.post(this.getUrl() + '/service/process',
                    {name: name, action: action});
        };

        this.updateService = function(data) {
            return $http.post(this.getUrl() + '/service/update', data);
        };

        this.removeService = function(name) {
            return $http.post(this.getUrl() + '/service/remove',
                    {name: name});
        };

    });

})();
