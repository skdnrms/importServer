const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const zlib = require('zlib');
const app = express();
const childProcess = require('child_process');
const port = 8686;

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, 'res')) // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname) // 콜백함수를 통해 전송된 파일 이름 설정
    }
});
const imageUploader = multer({ storage: storage })

app.use('/se', express.static(path.join(__dirname, 'lib')));
app.use('/res', express.static(path.join(__dirname, 'res')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`editor-server start at localhost:${port}`);
});

app.post('/uploadImage', imageUploader.single('imageFile'), (req, res) => {
    res.json({
        uploadPath: path.join('res', req.file.filename)
    });
});

app.get('/import', (req, res) => {
    childProcess.exec('');
});

app.get('/load', (req, res) => {
    let serializedData = [];
    let rs = fs.createReadStream(path.join(__dirname, 'res', 'test1.ndoc'));
    let ws = fs.createWriteStream(path.join(__dirname, 'tmp', 'test1.zip'));

    rs.on('data', (data) => {
        const magicPos = data[2];
        const magicNum = data[magicPos];
        data[0] = 'P'.charCodeAt();
        data[1] = 'K'.charCodeAt();
        data[2] = 0x03;
        data[3] = 0x04;

        for(let i = 0; i < 60; i++) {
            const index = i + 4;
            data[index] = data[index] ^ magicNum;
        }

        ws.write(data);
        ws.end();
    });

    ws.on('close', () => {
        fs.createReadStream(path.join(__dirname, 'tmp', 'test1.zip'))
          .pipe(unzip.Extract({path: path.join(__dirname, 'tmp')})).on('close', () => {
            fs.createReadStream(path.join(__dirname, 'tmp', 'document.word.pb'), {start: 16})
              .pipe(zlib.createUnzip())
              .on('data', (data) => {
                for (let i = 0, len = data.length; i < len; i++) {
                    serializedData.push(data[i] & 0xFF);
                }
            }).on('close', () => {
                res.json({serializedData: serializedData});
                res.end();
            });
        });
    });
});