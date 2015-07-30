'use strict';

/* App Module */

var phonecatApp = angular.module('phonecatApp', [
  'ngRoute',
  'phonecatControllers',
  'phonecatFilters',
  'phonecatServices'
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
