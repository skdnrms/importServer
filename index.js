const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const zlib = require('zlib');
const app = express();
const { exec } = require('child_process');
const port = 8086;

const resourcePath = path.join(__dirname, 'res');
const tempPath = path.join(__dirname, 'tmp');
const convertPath = path.join(__dirname, 'conv');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, resourcePath) // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname) // 콜백함수를 통해 전송된 파일 이름 설정
    }
});
const uploader = multer({ storage: storage })

app.listen(port, () => {
    console.log(`import-server start at localhost:${port}`);
});

app.get('/test', () => {
    console.log('inTest!!!');

    const fullFileName = 'simple word.docx';
    const fileName = 'simple word';
    const convFilePath = path.join(convertPath, fileName);
    const convert = exec(`../../documentConverter_exe ${path.join(resourcePath, fullFileName)} ${convFilePath} ${convertPath} ndoc`, (error, stdout, stderr) => {
        if (error) {
            console.error(`convert error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });

    convert.on('close', () => {
        console.log('convert close');
        const resultFilePath = path.join(tempPath, fileName);
        const rs = fs.createReadStream(convFilePath);
        const ws = fs.createWriteStream(resultFilePath);
    
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
            res.sendFile(resultFilePath);
        });
    });
})

app.post('/import', uploader.single('file'), (req, res) => {
    console.log('import!!', req.file.filename);

    const convert = exec(`../../documentConverter_exe ${path.join(resourcePath, req.file.filename)} ${path.join(convertPath, req.file.filename)} ${convertPath} ndoc`, (error, stdout, stderr) => {
        if (error) {
            console.error(`convert error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });

    convert.on('close', () => {
        console.log('convert close');
        const resultFilePath = path.join(tempPath, req.file.filename);
        const rs = fs.createReadStream(path.join(convertPath, req.file.filename));
        const ws = fs.createWriteStream(resultFilePath);
    
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

        rs.on('close', () => {
            console.log('rs close');
        });
    
        ws.on('close', () => {
            console.log('ws close');
            res.sendFile(resultFilePath);
        });
    });
});