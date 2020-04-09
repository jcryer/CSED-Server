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

const test = async function() {
  return new Promise(function(resolve, reject) {
    spotifyApi.getTracks(trackIDs).then(
      function (data) {
        resolve(data);
      }
    );
  });
}

const getTracksInfo = async function(username, userid) {
  await getAccessToken(username);
  var listens = await database.getListenInfo(userid);

  trackIDs = [];
  tracks = [];
  iter = 0;
  for (let i = 0; i < listens.count; i++) {
    trackIDs.push(listens[i].songid);
    if (i % 48 == 0) {
      var tList = await test(trackIDs);
      tList.body.tracks.forEach(function(t) {
        tracks.push(t);
      });
      trackIDs = [];
    }
  }

  if (trackIDs.length > 0) {
    var tList = await test(trackIDs);
    tList.body.tracks.forEach(function(t) {
      tracks.push(t);
    });
  }
  return tracks;
}

/*
function getTracksInfo(username, userid) {
  return new Promise(function(resolve, reject) {
    getAccessToken(username).then(
    function () {
      database.getListenInfo(userid).then(
        
        function (listens) {
          console.log("GOT LISTEN INFO");
          
          trackIDs = [];
          tracks = [];
          iter = 0
          listens.forEach(function(listen) {
            trackIDs.push(listen.songid);
            iter ++;
            if (iter % 48 == 0) {
              spotifyApi.getTracks(trackIDs).then(
                function (trackObjs) {
                  trackObjs.body.tracks.forEach(function(t) {
                    tracks.push(t);
                  }
                )}
              ).catch(function(error) {
                console.error(error);
              });
              trackIDs = [];
            }

          });

          if (trackIDs.length > 0) {
            spotifyApi.getTracks(trackIDs).then(
              function (trackObjs) {
                trackObjs.body.tracks.forEach(function(t) {
                  tracks.push(t);
                }
              )}
            ).catch(function(error) {
              console.error(error);
            });
          }

          while (tracks.length < listens.length) {
            continue;
          }
          return tracks;
        }
      )
      .then(function(obj) {
        console.log("GOT TRACKS NEW");
        console.log(obj);
        tracks = [];
        obj.forEach(function(track) {
          tracks.push({'artist': track.artists[0].name, 'name': track.name, 'uri': track.uri });
        });
        resolve(tracks);
      })
    });
  });
}
*/
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
          database.addListenInfo(data.body.items, userid);
        }
      );
    }
  );
}

function dataListener() {
  database.getUsers().then(
    function (users) {
      var filteredUsers = users.filter(
        function (data) {
          return data.refresh_token != null;
        }
      );
      filteredUsers.forEach(
        function(user) {
          getData(user.username, user._id);
        }
      );
    }
  );
}

setInterval(dataListener, 30000);


module.exports.getTracksInfo = getTracksInfo;
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