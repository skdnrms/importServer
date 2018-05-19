const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const app = express();

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, 'res')) // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname) // 콜백함수를 통해 전송된 파일 이름 설정
    }
});
const imageUploader = multer({ storage: storage })

app.use('/se', express.static(path.join(__dirname, 'lib', 'synapeditor')));
app.use('/res', express.static(path.join(__dirname, 'res')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(8080, () => {
    console.log('editor-server start at localhost:8080');
});

app.post('/uploadImage', imageUploader.single('imageFile'), (req, res) => {
    res.json({
        uploadPath: path.join('res', req.file.filename)
    });
});

var ws = fs.createWriteStream('test2.ndoc');
fs.createReadStream(path.join(__dirname, 'res', 'test1.ndoc'), {start:0, end: 4}).on('data', (buffer) => {
    console.log(buffer);
    ws.write(buffer);
}).on('end', () => {
    ws.end();
});

// fs.createReadStream(path.join(__dirname, 'res', 'test1.ndoc')).on('data', () => {
//     console.log('aa');
// });
