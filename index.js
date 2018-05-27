const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const zlib = require('zlib');
const app = express();
const childProcess = require('child_process');
const port = 8080;

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, 'res')) // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname) // 콜백함수를 통해 전송된 파일 이름 설정
    }
});
const uploader = multer({ storage: storage })

app.listen(port, () => {
    console.log(`import-server start at localhost:${port}`);
});

app.post('/import', uploader.single('file'), (req, res) => {
    console.log('import!!', req.file.filename);
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
        console.log('on close!!!');
        fs.readFile(path.join(__dirname, 'tmp', 'test1.zip'), "binary", (err, file) => {
            if(err) {        
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write(err + "\n");
                res.end();
                return;
            }
        
            res.writeHead(200);
            res.write(file, "binary");
            res.end();
        });
    });
});

// app.get('/load', (req, res) => {
//     let serializedData = [];
//     let rs = fs.createReadStream(path.join(__dirname, 'res', 'test1.ndoc'));
//     let ws = fs.createWriteStream(path.join(__dirname, 'tmp', 'test1.zip'));

//     rs.on('data', (data) => {
//         const magicPos = data[2];
//         const magicNum = data[magicPos];
//         data[0] = 'P'.charCodeAt();
//         data[1] = 'K'.charCodeAt();
//         data[2] = 0x03;
//         data[3] = 0x04;

//         for(let i = 0; i < 60; i++) {
//             const index = i + 4;
//             data[index] = data[index] ^ magicNum;
//         }

//         ws.write(data);
//         ws.end();
//     });

//     ws.on('close', () => {
//         fs.createReadStream(path.join(__dirname, 'tmp', 'test1.zip'))
//           .pipe(unzip.Extract({path: path.join(__dirname, 'tmp')})).on('close', () => {
//             fs.createReadStream(path.join(__dirname, 'tmp', 'document.word.pb'), {start: 16})
//               .pipe(zlib.createUnzip())
//               .on('data', (data) => {
//                 for (let i = 0, len = data.length; i < len; i++) {
//                     serializedData.push(data[i] & 0xFF);
//                 }
//             }).on('close', () => {
//                 res.json({serializedData: serializedData});
//                 res.end();
//             });
//         });
//     });
// });