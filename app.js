const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const path = require('path');
const uploadChunksMiddleware = require('./middlewares/upload-chunks');
const fs = require('fs');

const fileBasePath = 'uploads/';
const chunkBasePath = '~uploads/';
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

nunjucks.configure('views',{autoescape:true,autocomplete:true,express:app});
app.set('views',path.resolve('./views'));
app.set('view engine','njk');

// 首页静态页面
app.get('/',(req,res)=>{
    res.render('index');
});
// 上传chunks
app.post('/upload_chunks',uploadChunksMiddleware,(req,res)=>{
    // 创建chunk的目录
    const chunkTmpDir = chunkBasePath + req.body.hash + '/';
    // 判断目录是否存在
    if(!fs.existsSync(chunkTmpDir)) fs.mkdirSync(chunkTmpDir);
    // 移动切片文件
    fs.renameSync(req.file.path,chunkTmpDir + req.body.hash + '-' + req.body.index);
    res.send(req.file);
});
// 文件分片
app.post('/merge_chunks',(req,res)=>{
    const total = req.body.total;
    const hash = req.body.hash;
    const saveDir = fileBasePath + new Date().getFullYear()+ (new Date().getMonth() + 1 )+new Date().getDate() + '/';
    const savePath = saveDir + Date.now() + hash + '.' + req.body.ext;
    const chunkDir = chunkBasePath + '/' + hash + '/';
    try{
        // 创建保存的文件夹(如果不存在)
        if(!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
        // 创建文件
        fs.writeFileSync(savePath,'');
        // 读取所有的chunks 文件名存放在数组中
        const chunks = fs.readdirSync(chunkBasePath + '/' + hash);
        // 检查切片数量是否正确
        if(chunks.length !== total || chunks.length === 0) return res.send({code:-1,msg:'切片文件数量不符合'});
        for (let i = 0; i < total; i++) {
            // 追加写入到文件中
            fs.appendFileSync(savePath, fs.readFileSync(chunkDir + hash + '-' +i));
            // 删除本次使用的chunk
            fs.unlinkSync(chunkDir + hash + '-' +i);
        }
        // 删除chunk的文件夹
        fs.rmdirSync(chunkDir);
        // 返回uploads下的路径，不返回uploads
        res.json({code:0,msg:'文件上传成功',data:{path:savePath.split(fileBasePath)[savePath.split(fileBasePath).length-1]}});
   }catch (err){
       res.json({code:-1,msg:'出现异常,上传失败'});
   }
});
// 返回文件
app.get('/uploads/:dir/:path',(req,res)=>{
    const url = path.resolve(__dirname,`${fileBasePath}/${req.params.dir}/${req.params.path}`);
    res.type('png').sendFile(url);
});
app.listen(3000);


