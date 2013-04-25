'use strict';

(function() {

    var directives = angular.module('dmonDirectives', []);

    directives.directive('openServiceModal', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (!element.hasClass('disabled')) {
                    eventSvc.emit('openServiceModal', scope.service);
                    if (!scope.$$phase) scope.$apply();
                    $(attrs.openServiceModal).modal('show');
                }
            });
        };
    });

})();
