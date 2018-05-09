const multer = require('multer');

const chunksBasePath = '~uploads/';

const storage = multer.diskStorage({
    destination:chunksBasePath,
});

const baseUpload = multer({storage});
const upload = baseUpload.single('file');

/**
 * @name uploadMiddleware
 * @description 文件上传中间件，upload 方法调用的时候 会有 err 进行错误判断
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const uploadMiddleware = (req,res,next)=>{
    upload(req,res,(err)=>{
        if(err){
            // 进行错误捕获
            res.json({code:-1,msg:err.toString()});
        }else{
            next();
        }
    });
};

module.exports = uploadMiddleware;
