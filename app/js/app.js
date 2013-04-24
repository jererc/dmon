'use strict';

/* App Module */

angular.module('dmonApp', ['dmonServices', 'dmonDirectives', 'dmonFilters']).
    config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {redirectTo: '/services'}).
        when('/services', {templateUrl: 'partials/services-list.html', controller: ServicesListCtrl}).
        when('/settings', {templateUrl: 'partials/settings-list.html', controller: SettingsListCtrl}).
        otherwise({redirectTo: '/'});
}]);
