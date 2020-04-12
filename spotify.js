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

const getTracksInfo = async function(username, userid) {
  await getAccessToken(username);
  var listens = await database.getListenInfo(userid);

  trackIDs = [];
  tracks = [];
  var stopped = 0;
  console.log(listens.length);
  for (var i = 0; i < listens.length; i++) {
    trackIDs.push(listens[i].songid);
    if (i % 48 == 0 && i != 0) {
      var tList = await spotifyApi.getTracks(trackIDs);
      var actualList = tList.body.tracks;
      for (var j = 0; j < actualList.length; j++) {
        tracks.push({'artist': actualList[j].artists[0].name, 'name': actualList[j].name, 'uri': actualList[j].uri, 'listen': listens[stopped + j] });
      }

      stopped = i;
      trackIDs = [];
    }
  }

  if (trackIDs.length > 0) {
    var tList = await spotifyApi.getTracks(trackIDs);
    var actualList = tList.body.tracks;
    for (var j = 0; j < actualList.length; j++) {
      tracks.push({'artist': actualList[j].artists[0].name, 'name': actualList[j].name, 'uri': actualList[j].uri, 'listen': listens[stopped + j] });
    }
  }
  return tracks;
}

async function sortUserSongs(username, userid) {

  await getAccessToken(username);

  var allTracks = {};
  var playlistNext = true;

  while (playlistNext) {
    var playlists = await spotifyApi.getUserPlaylists({limit: 50});
    if (playlists.next == null) {
      playlistNext = false;
    }
    if (playlists.items == undefined) {
      break;
    }
    console.log("pass");
    for (var i = 0; i < playlists.items.length; i++) {
      var trackNext = true;
      while (trackNext) {
        var tracks = await spotifyApi.getPlaylistTracks(playlists.items[i].id, {limit: 100, fields: 'next,items(track(name,artists, id))'});
        if (tracks.next == null) {
          trackNext = false;
        }
        for (var j = 0; j < tracks.items.length; j++) {
          var item = tracks.items[j];
          if (!item.id in allTracks) {
            allTracks[item.id] = item;
          }
        }
      }
    }
  }

  return allTracks;
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

module.exports.sortUserSongs = sortUserSongs;

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