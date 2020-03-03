const http = require('http');


function getData(authCode) {
    /*var data = JSON.stringify({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: "https://csed-server.herokuapp.com/callback",
        client_id: "295687b97d8f4da38afd639684a8a60e",
        client_secret: "e82a2d8d37d1436fa01d9ad332a1e00b"
    });*/

    var data = 'grant_type=authorization_code' +
    '&code=' + encodeURIComponent(authCode) +
    '&redirect_uri=' +  encodeURIComponent('https://csed-server.herokuapp.com/callback') +
    '&client_id=' + '295687b97d8f4da38afd639684a8a60e' + 
    '&client_secret=' + 'e82a2d8d37d1436fa01d9ad332a1e00b';

    var options = {
        hostname: 'accounts.spotify.com',
        port: 80,
        path: '/api/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        }
    };

    var req = http.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)
        console.dir(res.headers);
        console.log(res.headers);

        res.on('data', d => {
            console.log(d);
        });
    });
      
    req.on('error', error => {
    console.error(error)
    });
      
    req.write(data);
    req.end();
    console.log("test!");

 }

 //setInterval(getData, 1000);

 module.exports.getData = getData;