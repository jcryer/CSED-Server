const http = require('http');
var SpotifyWebApi = require('spotify-web-api-node');

var credentials = {
  redirectUri: 'https://csed-server.herokuapp.com/callback',
  clientId: '295687b97d8f4da38afd639684a8a60e',
  clientSecret: '5866b2dc04244accbca3215a7281c4b2',
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
          return spotifyApi.getMe();
        },
        function(err) {
          console.log('Something went wrong!', err);
        }
    ).then(function(data) {
        // "Retrieved data for Faruk Sahin"
        console.log('Retrieved data for ' + data.body['display_name']);
        spotifyApi.getUserPlaylists(data.body['display_name'])
        .then(function(internalData) {
            console.log('Retrieved playlists', internalData.body);
        },function(internalErr) {
            console.log('Something went wrong!', internalErr);
        });
    
        // "Email is farukemresahin@gmail.com"
        console.log('Email is ' + data.body.email);
    
        // "Image URL is http://media.giphy.com/media/Aab07O5PYOmQ/giphy.gif"
        console.log('Image URL is ' + data.body.images[0].url);
    
        // "This user has a premium account"
        console.log('This user has a ' + data.body.product + ' account');
      })
      .catch(function(err) {
        console.log('Something went wrong', err.message);
      });
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