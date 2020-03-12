const http = require('http');
const fs = require('fs');
const app = require('./app.js');
var port = process.env.PORT || 3000;

var server = http.createServer(app);
server.listen(port);
