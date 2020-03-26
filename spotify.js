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
      
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);
          return spotifyApi.getMe();
        },
        function(err) {
          console.log('Something went wrong!', err);
        }
    ).then(function(data) {
        console.log('Retrieved data for ' + data.body['id']);
        spotifyApi.getUserPlaylists(data.body['id'])
        .then(function(internalData) {
            console.log('Retrieved playlists', internalData.body);
        },function(internalErr) {
            console.log('Something went wrong!', internalErr);
        });
    
        console.log('Email is ' + data.body.email);
    
        console.log('Image URL is ' + data.body.images[0].url);
    
        console.log('This user has a ' + data.body.product + ' account');
      })
      .catch(function(err) {
        console.log('Something went wrong', err.message);
      });
 }



function getData2(authCode) {

  spotifyApi.authorizationCodeGrant(authCode).then(
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
    console.log('2::::: Retrieved recently played songs: ', data.body);
    })
    .catch(function(err) {
      console.log('Something went wrong', err.message);
    });
}

function getData3() {

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
}

 //setInterval(getData, 1000);

 module.exports.getData = getData;
 module.exports.getData2 = getData2;
 module.exports.getData3 = getData3;