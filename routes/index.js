/* GET home page. */
exports.check_permission = function (req, res, next) {
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
exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.main = function(req, res){
    res.render('main', { title: 'Express' });
};

exports.login = function(req, res){
    res.render('login', { title: 'Express' });
};

exports.register = function(req, res){
    res.render('register', { title: 'Express' });
};