/**
 * Created by jaydom on 2015/8/13.
 */
var multiparty  = require('multiparty');
var fs= require('fs');
var util = require('util');

exports.upload = function(req, res){
    console.log(req.body, req.files);
    //生成multiparty对象，并配置下载目标路径
    var form = new multiparty.Form({uploadDir: './public/files/'});
//下载后处理
    form.parse(req, function(err, fields, files) {
        var filesTmp = JSON.stringify(files,null,2);

        if(err){
            console.log('parse error: ' + err);
        } else {
            console.log('parse files: ' + filesTmp);
            var inputFile = files.file[0];
            var uploadedPath = inputFile.path;
            var dstPath = './public/files/' + inputFile.originalFilename;
            //重命名为真实文件名
            fs.rename(uploadedPath, dstPath, function(err) {
                if(err){
                    console.log('rename error: ' + err);
                } else {
                    console.log('rename ok');
                }
            });
        }

        res.writeHead(200, {'content-type': 'text/plain;charset=utf-8'});
        res.write('received upload:\n\n');
        res.end(util.inspect({fields: fields, files: filesTmp}));
    });
};
