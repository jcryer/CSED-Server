const http = require('http');
var SpotifyWebApi = require('spotify-web-api-node');
const database = require("./db");

var credentials = {
  redirectUri: 'https://csed-server.herokuapp.com/callback',
  clientId: '295687b97d8f4da38afd639684a8a60e',
  clientSecret: '5866b2dc04244accbca3215a7281c4b2',
};

var spotifyApi = new SpotifyWebApi(credentials);

function finaliseAuth(authCode) {
    return new Promise(function(resolve, reject) {

      spotifyApi.authorizationCodeGrant(authCode).then(
        function(data) {
          console.log("Auth token: " + data.body['access_token']);
  
          console.log('The token expires in ' + data.body['expires_in']);
          console.log('The access token is ' + data.body['access_token']);
          console.log('The refresh token is ' + data.body['refresh_token']);

          resolve(data.body['refresh_token']);
        });
  });
}

function getAccessToken(username) {
  return new Promise(function(resolve, reject) {
    database.getRefreshToken(username).then(
      function (token) {
        spotifyApi.setRefreshToken(token);
        spotifyApi.refreshAccessToken().then(
          function(data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            resolve(data.body['access_token']);
          });
        });
      }
    );
} 

function getData(username, userid) {
  getAccessToken(username).then(
    function () {
      spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 }).then(
        function (data) {
          console.log('3::::: Retrieved recently played songs: ', JSON.stringify(data.body));

          database.addListenInfo(data.body.items, userid);
        }
      );
    }
  );
}

 //setInterval(getData, 1000);

 module.exports.getData = getData;
 module.exports.finaliseAuth = finaliseAuth;




 /*

  spotifyApi.refreshAccessToken().then(
      function(data) {
        console.log("Auth token: " + data.body['access_token']);

        console.log('The token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        console.log('The refresh token is ' + data.body['refresh_token']);
    
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        return spotifyApi.getMyRecentlyPlayedTracks();
      },
      function(err) {
        console.log('Something went wrong!', err);
      }
  ).then(function(data) {
    console.log('3::::: Retrieved recently played songs: ', data.body);
    })
    .catch(function(err) {
      console.log('Something went wrong', err.message);
    });
    */