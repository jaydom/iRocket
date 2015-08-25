'use strict';

/* Controllers */
//添加ui-bootstrap的支持
var phonecatControllers = angular.module('phonecatControllers', ['ui.bootstrap','ngFileUpload','ui.router']);

phonecatControllers.controller('loginCtrl', ['$scope','$location','$log','$user','$http',
    function($scope,$location, $log,$user,$http) {
        console.log("loginCtrl");
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

phonecatControllers.controller('mainCtrl', ['$scope','$location','$user','$socket','$http','$log','$state','Upload','global',
    function($scope,$location,$user,$socket,$http,$log,$state,Upload,global) {
        $scope.page = "editor";
        $scope.name = $user.name;
        $scope.email = $user.email;
        $scope.user_map = {};
        $scope.user_list = [];
        $scope.room_map = {};//room_id:room_list_index
        $scope.room_list = [];
        $scope.message = "";
        $scope.cur_room = {};
        $scope.cur_room_id = "";
        $scope.cur_room_name = "";
        $scope.cur_room_message = [];
        //界面监听
        $scope.$on('$viewContentLoaded', function() {
            alert("$viewContentLoaded");
            split_init();
            setPos();
            init_pdf_viewer();
            $http.get('/users',{params: {data:$user}})
                .success(function(result, status, headers, config) {
                    if (result.status) {
                        //更新用户列表
                        $log.log('success: ', result);
                        for(var i=0; i<result.data.length; i++){
                            //添加用户
                            $scope.add_user(result.data[i]);
                        }
                        $socket.emit('login', $user);
                    }else{
                        $log.log('error: ', result);
                    }
                })
                .error(function(result, status, headers, config) {
                    log.log('error: ', result);
                });
        });
        //界面主动刷新
        $scope.refresh_window = function(){
            //$location.path("/main");
            //$route.reload();
            //$state.reload();
            $location.path("/main");
            //$state.go("main",{}, {reload: true});
        }
        //创建房间
        $scope.create_single_room = function(target){
            //判断已经存在聊天室
            if(target.room_id!=""){
                console.log(target);
                $scope.select_room(target.room_id);
            }else{
                var user_list = [$user._id,target._id];
                $http.post('/create_single_room',{auth:$user.token,user_list:user_list})
                    .success(function(result, status, headers, config) {
                        if (result.status) {
                            //更新目标的房间id
                            console.log(result);
                            target.room_id = result.data._id;
                            $scope.user_list[target.index].room_id = result.data._id;
                            //更新房间列表
                            $scope.room_map[result.data._id] = $scope.room_list.length;
                            $scope.add_room(result.data._id,target);
                            $scope.select_room(target.room_id);
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
        $scope.select_room = function(room_id){
            var index = $scope.room_map[room_id];
            $scope.cur_room =  $scope.room_list[index];
            $scope.cur_room_id = $scope.cur_room._id;
            $scope.cur_room_name = $scope.cur_room.name;
            $scope.cur_room_message = $scope.cur_room.message_list;
        };
        $scope.add_room = function(room_id,target_user){
            $scope.room_list.push({
                _id:room_id,//room_id
                name:target_user.name,
                target_id:target_user._id,
                image_url:target_user.image_url,
                time:"2:15",
                new_message_number:"new",
                message:"",
                message_list:[]
            });
            //返回新加的room的id
            return $scope.room_list.length-1;
        };
        $scope.add_user = function(user){
            var index = $scope.user_list.length;
            $scope.user_list.push({
                _id:user._id,
                index:index,
                room_id:"",//初始更新没有内容，需要向服务器连接，请求id
                name:user.name,
                email:user.email,
                token:user.token,
                image_url:"images/avatar.png"
            });
            $scope.user_map[user._id] = index;
        };
        $scope.get_user = function(user_id){
            if(!$scope.user_map.hasOwnProperty(user_id)){
                return undefined;
            }else{
                var index = $scope.user_map[user_id];
                return $scope.user_list[index];
            }
        };
        $scope.add_message = function(room_id,user_id,user_name,message){
            //查询用户
            var target =  $scope.get_user(user_id);
            if(target!=undefined){
                var new_message = {
                    _id:"",
                    name:target.name,
                    time:"2:15",
                    image_url:target.image_url,
                    message:message
                };
                if($scope.cur_room_id==room_id){
                    $scope.cur_room.message = message;
                    $scope.cur_room_message.push(new_message);
                }else{
                    if(!$scope.room_map.hasOwnProperty(room_id)){
                        //添加room
                        $scope.room_map[room_id] = $scope.add_room(room_id,target);
                    }
                    var index = $scope.room_map[room_id];
                    $scope.room_list[index].message = message;
                    $scope.room_list[index].message_list.push(new_message);
                }
            }
        };
        //发送消息
        $scope.send_message = function (cur_room_id,msg) {
            console.log("$scope.send_message:"+$scope.message);
            console.log("$scope.send_message");
            if($scope.message!=""){
                $scope.message = "";//清空输入框
                var new_message = {
                    type:'msg',
                    content:msg
                };
                $scope.add_message(cur_room_id,$user._id,$user.name,new_message);
                //$socket.broadcast.to('my room').emit('message', msg);
                $socket.emit('message', {room_id:cur_room_id,user_id:$user._id,user_name:$user.name,message:new_message});
            }
        };
        //websocket监听
        $socket.on('message',function(msg) {
            $scope.add_message(msg.room_id,msg.user_id,msg.user_name,msg.message);
        });
        //发送
        $scope.send_file = function(files){
            if(files.length>0){
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    //产生消息
                    var new_message = {
                        type:'file',
                        name:file.name,
                        size:file.size,
                        progress:0,
                        content:"发送文件："+file.name
                    };
                    //单位转换
                    if(file.size<1000){
                        new_message.size = file.size + 'B';
                    }else if(file.size>=1000&&file.size<1000000){
                        new_message.size =  Math.floor(file.size/1000) + 'K';
                    }else if(file.size>=1000000&&file.size<1000000000){
                        new_message.size =  Math.floor(file.size/1000000) + 'M';
                    }else{
                        new_message.size =  Math.floor(file.size/1000000000) + 'G';
                    }
                    //添加消息
                    $scope.add_message($scope.cur_room_id,$user._id,$user.name,new_message);
                    //上传文件
                    Upload.upload({
                        url: '/upload',
                        fields: {'username': $scope.username},
                        file: file
                    }).progress(function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                        new_message.progress = progressPercentage;
                    }).success(function (data, status, headers, config) {
                        console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
                    });
                }
            }
        };
        $scope.open_file = function(){
            alert("open_file");
        }
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
