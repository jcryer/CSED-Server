const http = require('http');
var SpotifyWebApi = require('spotify-web-api-node');

var credentials = {
  redirectUri: 'https://csed-server.herokuapp.com/callback',
  clientId: '295687b97d8f4da38afd639684a8a60e',
  clientSecret: 'e82a2d8d37d1436fa01d9ad332a1e00b',
};

var spotifyApi = new SpotifyWebApi(credentials);


function getData(authCode) {

    spotifyApi.authorizationCodeGrant(authCode).then(
        function(data) {
          console.log('The token expires in ' + data.body['expires_in']);
          console.log('The access token is ' + data.body['access_token']);
          console.log('The refresh token is ' + data.body['refresh_token']);
      
          // Set the access token on the API object to use it in later calls
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);
        },
        function(err) {
          console.log('Something went wrong!', err);
        }
      );
    /*var data = JSON.stringify({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: "https://csed-server.herokuapp.com/callback",
        client_id: "295687b97d8f4da38afd639684a8a60e",
        client_secret: "e82a2d8d37d1436fa01d9ad332a1e00b"
    });*/
/*
    var data = 'grant_type=authorization_code' +
    '&code=' + encodeURIComponent(authCode) +
    '&redirect_uri=' +  encodeURIComponent('https://csed-server.herokuapp.com/callback') +
    '&client_id=' + '295687b97d8f4da38afd639684a8a60e' + 
    '&client_secret=' + 'e82a2d8d37d1436fa01d9ad332a1e00b';

    var options = {
        hostname: 'accounts.spotify.com',
        port: 440,
        path: '/api/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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
    */
    console.log("!!!!test!!!!");

 }

 //setInterval(getData, 1000);

 module.exports.getData = getData;