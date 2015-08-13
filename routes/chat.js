/*聊天室*/
/*
**/
var crypto = require("crypto");
var chat_room     = require('../models/chat_room');
var user_list = {};
var room_list = {};
var message_list = {};
var user_template = {
    _id:"",
    name:"",
    token:"",
    socket:""
};
var room_template = {
    _id:"",
    name:"",
    user_list:"",
    user_list_md5:""
};

function md5(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    return crypto.createHash("md5").update(str).digest("hex");
}

exports.online = function (req, res, next) {
    //判断是否已经带有token
    if (!req.body.token) {
        res.json({status: false,data: "未登陆"});
    }else{
        res.json({status: true,data: user_list});
    }
    next();
}

function add_user_list(chat_room_instance,room_user_list){
    //将用户添加到聊天室
    console.log("add_user_list");
    //console.log(user_list);
    for(var i=0; i<room_user_list.length; i++) {
        var user_id = room_user_list[i];
        if(user_list.hasOwnProperty(user_id)){
            //使用数据库中id作为chat room 标签
            console.log("add user success:"+user_id);
            user_list[user_id].socket.join(chat_room_instance._id);
        }else{
            console.log("add user error:"+user_id);
        }
    }
    //添加此聊天室到聊天室列表
    room_list[chat_room_instance._id] = chat_room_instance;
}
exports.create_single_room = function (req, res) {
    //判断是否已经带有token
    if (req.body.token=="") {
        res.json({type: false,data: "未登陆"});
    }else{
        var room_user_list = req.body.user_list.sort();
        var user_list_md5 = md5(JSON.stringify(room_user_list));
        console.log(room_user_list);
        console.log(user_list_md5);
        chat_room.findOne({user_list_md5: user_list_md5},function(err, chat_room_instance) {
            if (err) {
                res.json({status: false,data: "Error occured: " + err});
            } else {
                if (chat_room_instance) {
                    add_user_list(chat_room_instance,room_user_list);
                    res.json({status: true,data: chat_room_instance});
                } else {
                    var chat_room_instance = new chat_room();
                    chat_room_instance.user_list = req.body.user_list;
                    chat_room_instance.user_list_md5 = user_list_md5;
                    chat_room_instance.save(function(err, chat_room_instance1) {
                        if(err){
                            res.json({status: false,data: "Error occured: " + err});
                        }else{
                            add_user_list(chat_room_instance1,room_user_list);
                            //向客户端应用发送聊天室信息
                            res.json({status: true,data:chat_room_instance1});
                        }
                    });
                }
            }
        });
    }
}

exports.service = function(server){
    var io = require('socket.io').listen(server);
    io.on('connection', function(socket){
        //根据用户名，将用户加入各个聊天室
        socket.on('login', function(msg){
            console.log("login:"+JSON.stringify(msg));
            user_list[msg._id] = {
                _id:msg._id,
                name:msg.name,
                token:msg.token,
                socket:socket
            };
        });
        socket.on('message',function(msg){
            console.log(msg);
            //根据msg带有的发送目标
            //io.sockets.in('room1').emit('message', msg);
            socket.broadcast.to(msg.room_id).emit('message', msg);
        });
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        socket.on('broadcast:msg', function(msg){
            console.log('broadcast:msg: ' + msg.message);
            //广播，除了本链接
            socket.broadcast.emit('new:msg', msg.message);
        });
    });
}