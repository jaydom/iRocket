var express = require('express');
var http = require('http');
var path = require('path');
var ejs = require('ejs');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt        = require("jsonwebtoken");
var mongoose   = require("mongoose");
var User     = require('./models/User');
var chat_room     = require('./models/chat_room');
var routes = require('./routes');
var users = require('./routes/user');
var chat_service = require("./routes/chat");
// Connect to DB
mongoose.connect("mongodb://admin:admin@127.0.0.1:27019/iRocket");
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.ejs', ejs.__express);
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});
app.get('/', routes.index);
app.get('/users', function(req,res){
    var query = User.find().sort('-create_date');
    query.exec(function (err, results) {
        if (err) {
            res.json({status: false,data: "Error occured: " + err});
        } else {
            console.log(JSON.stringify(results));
            res.json({status: true,data: results});
        }
    });
});
app.get('/main', routes.main);
app.get('/register', routes.register);

app.post('/create_single_room', chat_service.create_single_room);
//登陆
app.get('/login', routes.login);
app.post('/login', function(req, res) {
    User.findOne({email: req.body.email, password: req.body.password}, function(err, user) {
        if (err) {
            res.json({status: false,data: "Error occured: " + err});
        } else {
            if (user) {
                res.json({status: true,data:user});
            }else {
                res.json({status: false,data: "Incorrect email/password"});
            }
        }
    });
});

app.post('/signin', function(req, res) {
    User.findOne({email: req.body.email, password: req.body.password},
        function(err, user) {
            if (err) {
                res.json({status: false,data: "Error occured: " + err});
            } else {
                if (user) {
                    res.json({status: false,data: "User already exists!"});
                } else {
                    var userModel = new User();
                    userModel.name = req.body.name;
                    userModel.email = req.body.email;
                    userModel.password = req.body.password;
                    userModel.save(function(err, user) {
                        user.token = jwt.sign(user, "gsta123");
                        user.save(function(err, user1) {
                            res.json({status: true,data: user1,token: user1.token});
                        });
                    });
                }
            }
        });
});
app.get('/me', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (err) {
            res.json({status: false,data: "Error occured: " + err});
        } else {
            res.json({status: true,data: user});
        }
    });
});
function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.send(403);
    }
}
/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});
//打印错误异常信息
process.on('uncaughtException', function(err) {
    console.log(err);
});

app.add_chat_service = function(server){
    chat_service.service(server);
};

module.exports = app;
