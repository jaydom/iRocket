'use strict';

/* Controllers */
//添加ui-bootstrap的支持
var phonecatControllers = angular.module('phonecatControllers', ['ui.bootstrap','ngFileUpload']);

phonecatControllers.controller('loginCtrl', ['$scope','$location','$log','$user','$socket','$http',
    function($scope,$location, $log,$user,$socket,$http) {
        $scope.email = "";
        $scope.password = "";
        $scope.messages = [
            {"name":"1","imageUrl":"images/avatar3.png","Team":"Support Team","time":"5 mins","content":"Why not buy a new awesome theme?"},
            {"name":"2","imageUrl":"images/avatar2.png","Team":"AdminLTE Design Team","time":"2 hours","content":"Why not buy a new awesome theme?"},
            {"name":"3","imageUrl":"images/avatar.png","Team":"Developers","time":"Today","content":"Why not buy a new awesome theme?"},
            {"name":"4","imageUrl":"images/avatar3.png","Team":"Sales Department","time":"Yesterday","content":"Why not buy a new awesome theme?"}
        ];
        $scope.status = {
            isopen: false
        };

        $scope.toggled = function(open) {
            $log.log('Dropdown is now: ', open);
        };

        $scope.toggleDropdown = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.status.isopen = !$scope.status.isopen;
        };
        $socket.on('new:msg',function(message) {
            $log.log('Message: ', message);
            $socket.emit('broadcast:msg', {message:message});
        });
        $scope.login = function() {
            $http.post('/login', {email:$scope.email,password:$scope.password})
                .success(function(data, status, headers, config) {
                    $log.log('success: ', data);
                    if (data.status) {
                        // succefull login
                        $user.isLogged = true;
                        $user.username = data.username;
                        $user.token = data.token;
                        $location.path("/main");
                    }
                    else {
                        $user.isLogged = false;
                        $user.username = '';
                    }
                })
                .error(function(data, status, headers, config) {
                    log.log('error: ', data);
                    $user.isLogged = false;
                    $user.username = '';
                });
        }
    }]);

phonecatControllers.controller('mainCtrl', ['$scope','$location','$user','global',
    function($scope,$location,$user,global) {
        console.log("UploadStep1Ctrl");
        $scope.info = "test";
        $scope.goToStep2 = function (files) {
            if (files && files.length>0) {
                $scope.files = files;
                global.files = files;
                $location.path("/upload-step2");
            }
        };
        $scope.$on('$viewContentLoaded', function() {
            split_init();
            setPos();
        });
    }]);


phonecatControllers.controller('UploadStep1Ctrl', ['$scope','$location','global',
  function($scope,$location,global) {
    console.log("UploadStep1Ctrl");
    $scope.info = "test";
    $scope.goToStep2 = function (files) {
        if (files && files.length>0) {
            $scope.files = files;
            global.files = files;
            $location.path("/upload-step2");
        }
    };
  }]);

phonecatControllers.controller('UploadStep2Ctrl', ['$scope', '$routeParams', 'global','Upload',
  function($scope, $routeParams, global,Upload) {
      console.log("UploadStep2Ctrl");
      $scope.files = global.files;
      console.log(global.files);
      console.log($scope.files);
      $scope.$watch('files', function () {
          //$scope.upload($scope.files);
          console.log("update");
      });
      $scope.upload = function (files) {
          if (files && files.length>0) {
              for (var i = 0; i < files.length; i++) {
                  var file = files[i];
                  Upload.upload({
                      url: '/upload',
                      fields: {'username': $scope.username},
                      file: file
                  }).progress(function (evt) {
                      var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                      console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                  }).success(function (data, status, headers, config) {
                      console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
                  });
              }
          }
      };
  }]);
