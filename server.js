const http = require('http');
const fs = require('fs');
const app = require('./app.js');
var port = process.env.Port || 3000;

const options = {
    keys: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

var server = http.createServer(app);
server.listen(port);
