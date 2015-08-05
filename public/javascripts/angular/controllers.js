'use strict';

/* Controllers */
//添加ui-bootstrap的支持
var phonecatControllers = angular.module('phonecatControllers', ['ui.bootstrap','ngFileUpload']);

phonecatControllers.controller('loginCtrl', ['$scope','$location','$log','$user','$http',
    function($scope,$location, $log,$user,$http) {
        $scope.email = "";
        $scope.password = "";
        $scope.login = function() {
            $http.post('/login', {email:$scope.email,password:$scope.password})
                .success(function(result, status, headers, config) {
                    $log.log('success: ', result);
                    if (result.status) {
                        // succefull login
                        console.log("data._id:"+result.data._id);
                        $user.isLogged = true;
                        $user._id = result.data._id;
                        $user.name = result.data.name;
                        $user.email = result.data.email;
                        $user.token = result.data.token;
                        $location.path("/main");
                    }
                    else {
                        $user.isLogged = false;
                        $user.username = '';
                    }
                })
                .error(function(result, status, headers, config) {
                    log.log('error: ', result);
                    $user.isLogged = false;
                    $user.username = '';
                });
        }
    }]);

phonecatControllers.controller('mainCtrl', ['$scope','$location','$user','$socket','$http','$log','global',
    function($scope,$location,$user,$socket,$http,$log,global) {
        $scope.name = $user.name;
        $scope.email = $user.email;
        $scope.user_list = [];
        $scope.room_map = {};//id:room_list_index
        $scope.room_list = [/*
            {
                id:0,
                name:"user1",
                time:"2:15",
                image_url:"images/avatar.png",
                new_message_number:"new",
                message:"I would like to meet you to discuss the latest news about\
                the arrival of the new theme. They say it is going to be one the\
                best themes on the market",
                message_list:[{
                        id:"",
                        name:"user1",
                        time:"2:15",
                        image_url:"images/avatar.png",
                        message:"I would like to meet you to discuss the latest news about\
                    the arrival of the new theme. They say it is going to be one the\
                    best themes on the market"
                    },{
                    id:"",
                    name:"user1",
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:"I would like to meet you to discuss the latest news about\
                    the arrival of the new theme. They say it is going to be one the\
                    best themes on the market"
                    }
                ]
            },
            {
                id:1,
                name:"user2",
                time:"2:15",
                image_url:"images/avatar2.png",
                new_message_number:"new",
                message:"I would like to meet you to discuss the latest news about\
                    the arrival of the new theme. They say it is going to be one the\
                    best themes on the market",
                message_list:[{
                        id:"",
                        name:"user1",
                        time:"2:15",
                        image_url:"images/avatar.png",
                        message:"I would like to meet you to discuss the latest news about\
                            best themes on the market"
                    },{
                        id:"",
                        name:"user1",
                        time:"2:15",
                        image_url:"images/avatar.png",
                        message:"哈哈"
                    }
                ]
            },
            {
                id:2,
                name:"user3",
                time:"2:15",
                image_url:"images/avatar3.png",
                new_message_number:"new",
                message:"I would like to meet you to discuss the latest news about\
                    the arrival of the new theme. They say it is going to be one the\
                    best themes on the market",
                message_list:[{
                    id:"",
                    name:"user1",
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:"I would like to meet you to discuss the latest news about\
                        the arrival of the new theme. They say it is going to be one the\
                        best themes on the market"
                },{
                    id:"",
                    name:"user1",
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:"I would like to meet you to discuss the latest news about\
                        the arrival of the new theme. They say it is going to be one the\
                        best themes on the market"
                }]
            },
            {
                id:3,
                name:"user4",
                image_url:"images/avatar2.png",
                time:"2:15",
                new_message_number:"new",
                message:"I would like to meet you to discuss the latest news about\
                    the arrival of the new theme. They say it is going to be one the\
                    best themes on the market",
                message_list:[{
                    id:"",
                    name:"user1",
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:"I would like to meet you to discuss the latest news about\
                            the arrival of the new theme. They say it is going to be one the\
                            best themes on the market"
                },{
                    id:"",
                    name:"user1",
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:"I would like to meet you to discuss the latest news about\
                            the arrival of the new theme. They say it is going to be one the\
                            best themes on the market"
                }]
            }*/
        ];
        $scope.message = "";
        $scope.cur_room = {};
        $scope.cur_room_id = "";
        $scope.cur_room_name = "";
        $scope.cur_room_message = [];
        //界面监听
        $scope.$on('$viewContentLoaded', function() {
            split_init();
            setPos();
            $http.get('/users',{params: {data:$user}})
                .success(function(result, status, headers, config) {
                    if (result.status) {
                        //更新用户列表
                        $log.log('success: ', result);
                        $scope.user_list = result.data;
                        $socket.emit('login', $user);
                    }else{
                        $log.log('error: ', result);
                    }
                })
                .error(function(result, status, headers, config) {
                    log.log('error: ', result);
                });
        });
        //创建房间
        $scope.create_single_room = function(target){
            //判断已经存在聊天室
            if($scope.room_list.hasOwnProperty(target._id)){
                $scope.select_room(target._id);
            }else{
                var user_list = [$user._id,target._id];
                $http.post('/create_single_room',{auth:$user.token,user_list:user_list})
                    .success(function(result, status, headers, config) {
                        if (result.status) {
                            //更新房间列表
                            $scope.room_map[target._id] = $scope.room_list.length;
                            $scope.room_list.push({
                                _id:result.data._id,//room_id
                                name:target.name,
                                target_id:target._id,
                                image_url:target.image_url,
                                time:"",
                                new_message_number:"",
                                message:"",
                                message_list:[]
                            });
                            $scope.select_room(target._id);
                        }else{
                            $log.log('error: ', result);
                        }
                    })
                    .error(function(result, status, headers, config) {
                        log.log('error: ', result);
                    });
            }
        };
        //选择房间
        $scope.select_room = function(target_id){
            var index = $scope.room_map[target_id];
            $scope.cur_room =  $scope.room_list[index];
            $scope.cur_room_id = $scope.cur_room._id;
            $scope.cur_room_name = $scope.cur_room.name;
            $scope.cur_room_message = $scope.cur_room.message_list;
            $log.log("target_id:"+target_id);
            $log.log("room_id:"+$scope.cur_room_id);
        };
        //发送消息
        $scope.send_message = function (cur_room_id,msg) {
            $log.log("room_id:"+cur_room_id);
            $log.log("message:"+msg);
            $log.log("message:"+$scope.message);
            if($scope.message!=""){
                $scope.message = "";//清空输入框
                $scope.cur_room_message.push({id:"",
                    name:$user.name,
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:msg});
                //$socket.broadcast.to('my room').emit('message', msg);
                $socket.emit('message', {room_id:cur_room_id,name:$user.name,message:msg});
            }
        };
        //websocket监听
        $socket.on('message',function(msg) {
            $log.log('Message: ', msg);
            $log.log('msg_id: ', msg._id);
            $log.log('cur_room_id: ', $scope.cur_room_id);
            if($scope.cur_room_id==msg.room_id){
                $scope.cur_room_message.push({id:"",
                    name:msg.name,
                    time:"2:15",
                    image_url:"images/avatar.png",
                    message:msg.message});
            }
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
