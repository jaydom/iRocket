'use strict';

/* App Module */

var phonecatApp = angular.module('phonecatApp', [
  'ngRoute',
  'ui.router',
  'phonecatControllers',
  'phonecatFilters',
  'phonecatServices',
  'phonecatDirectives'
]);

/*
phonecatApp.config(['$routeProvider','$locationProvider',
  function($routeProvider,$locationProvider) {
    $routeProvider.
      when('/index', {
            templateUrl: './index'
        }).
        when('/login', {
            templateUrl: './login'
        }).
      otherwise({
        redirectTo: '/index'
      });
      //$locationProvider.html5Mode(true);
  }]);
*/
/*
phonecatApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', { templateUrl: './login', controller: 'loginCtrl' , access: true});
    $routeProvider.when('/main', { templateUrl: './main', controller: 'mainCtrl',reloadOnSearch:true});
    $routeProvider.otherwise({ redirectTo: '/main' });
}]);
*/
phonecatApp.config(function($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/state1");
    //
    // Now set up the states
    $stateProvider
        .state('login', {
            url: "/login",
            cache:'false',
            templateUrl: "./login",
            controller: 'loginCtrl'
        })
        .state('main', {
            url: "/main",
            cache:'false',
            templateUrl: "./main",
            controller: 'mainCtrl'
        });
});
//定义全局的socket
phonecatApp.factory('$socket', function($rootScope) {
    //var socket = io.connection('http://localhost:8899');
    var socket = io();
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

phonecatApp.factory('$user', [function() {
    var user = {
        isLogged: false,
        _id:'',
        user: '',
        token:''
    };
    return user;
}]);

phonecatApp.factory('global', function () {
    return {
        files:[]
    };
});

phonecatApp.run(['$rootScope', '$window', '$location', '$log','$user','$state', function ($rootScope, $window, $location, $log,$user,$state) {
    var locationChangeStartOff = $rootScope.$on('$locationChangeStart', locationChangeStart);
    /*
    var locationChangeSuccessOff = $rootScope.$on('$locationChangeSuccess', locationChangeSuccess);

    var routeChangeStartOff = $rootScope.$on('$routeChangeStart', routeChangeStart);
    var routeChangeSuccessOff = $rootScope.$on('$routeChangeSuccess', routeChangeSuccess);
    */
    function locationChangeStart(event) {
        $log.log('locationChangeStart');
        $log.log(arguments);
        $log.log($user.isLogged);
        if (!$user.isLogged) {
            // reload the login route
            $location.path("/login");
            $log.log("redirect login");
            //$state.go("login",{}, {reload: true});
        }
    }
}]);