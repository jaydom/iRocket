/*聊天室*/
var user_list = {

};
exports.online = function (req, res, next) {
    //判断是否已经带有token
    if (!req.token) {
        return res.redirect('/login');
    }else{
        //判断是否能够找到token对应的用户
        User.findOne({token: req.token}, function(err, user) {
            if (err) {
                //res.json({type: false,data: "Error occured: " + err});
                return res.redirect('/login');
            } else {
                res.json({type: true,data: user});
            }
        });
    }
    next();
}

exports.service = function(server){
    var io = require('socket.io').listen(server);
    io.on('connection', function(socket){
        console.log('a user connected');
        //根据用户名，将用户加入各个聊天室
        socket.on('login', function(msg){
            socket.join('room1');
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