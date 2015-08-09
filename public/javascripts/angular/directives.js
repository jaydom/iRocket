'use strict';

/* Directives */
var phonecatDirectives = angular.module('phonecatDirectives', []);
phonecatDirectives.directive('checkUser', ['$rootScope', '$location', '$user', function ($rootScope, $location, $user) {
    return {
        link: function (scope, elem, attrs, ctrl) {
            $rootScope.$on('$locationChangeStart', function(event, currRoute, prevRoute){
                console.log("phonecatDirectives.directive");
                if (!prevRoute.access.isFree && !$user.isLogged) {
                    // reload the login route
                }
                /*
                 * IMPORTANT:
                 * It's not difficult to fool the previous control,
                 * so it's really IMPORTANT to repeat the control also in the backend,
                 * before sending back from the server reserved information.
                 */
            });
        }
    }
}]);

phonecatDirectives.directive('ckeditor', function() {
    return {
        require : '?ngModel',
        link : function(scope, element, attrs, ngModel) {
            var ckeditor = CKEDITOR.replace(element[0], {

            });
            if (!ngModel) {
                return;
            }
            ckeditor.on('instanceReady', function() {
                ckeditor.setData(ngModel.$viewValue);
            });
            ckeditor.on('pasteState', function() {
                scope.$apply(function() {
                    ngModel.$setViewValue(ckeditor.getData());
                });
            });
            ngModel.$render = function(value) {
                ckeditor.setData(ngModel.$viewValue);
            };
        }
    };
});