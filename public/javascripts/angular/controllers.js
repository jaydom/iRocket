'use strict';

/* Controllers */
//添加ui-bootstrap的支持
var phonecatControllers = angular.module('phonecatControllers', ['ui.bootstrap','ngFileUpload']);

phonecatControllers.factory('global', function () {
    return {
        files:[]
    };
});
phonecatControllers.controller('HeadCtrl', ['$scope','$location','$log','$socket',
    function($scope,$location, $log,$socket) {
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
