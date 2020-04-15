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

const distinct = (value, index, self) => {
  return self.indexOf(value) === index;
}

const getTracksInfo = async function(username, userid) {
  await getAccessToken(username);
  var listens = await database.getListenInfo(userid);

  trackIDs = [];
  tracks = [];
  var stopped = 0;
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

  try {
    var allTracks = {};
    var playlistNext = true;

    while (playlistNext) {
      var playlists = (await spotifyApi.getUserPlaylists({limit: 50})).body;
      if (playlists.next == null) {
        playlistNext = false;
      }
      if (playlists.items == undefined) {
        break;
      }
      for (var i = 0; i < playlists.items.length; i++) {
        var trackNext = true;
        var offset = 0;
        while (trackNext) {
          var tracks = (await getTracks(playlists.items[i].id, offset, 3)).body;
          if (tracks.next == null) {
            trackNext = false;
          }
          offset += 100;
          if (playlists.items == undefined) {
            break;
          }
          for (var j = 0; j < tracks.items.length; j++) {
            var item = tracks.items[j].track;
            if (!(item.id in allTracks) && item.id != null) {

              allTracks[item.id] = item;
            }

          }
        }
      }
    }

    var likedNext = true;

    var offset = 0;
    while (likedNext) {
      var liked = (await getLikedTracks(offset, 3)).body;
      offset += 100;
      if (liked.next == null) {
        likedNext = false;
      }
      if (liked.items == undefined) {
        break;
      }
      for (var i = 0; i < liked.items.length; i++) {
        var item = liked.items[i].track;
        if (!(item.id in allTracks) && item.id != null) {
          allTracks[item.id] = item;
        }      
      }
    }
  }
  catch (e) {
    console.log(e);
  }
  allTracks = await getSortedTracksInfo(allTracks);

  return allTracks;
}

const getSortedTracksInfo = async function(tracks) {
  var keys = Object.keys(tracks);

  for (var i = 0; i <= keys.length; i+=48) {
    var data = (await getTracksFeatures(keys.slice(i, i+48))).body.audio_features;
    for (var j = 0; j < data.length; j++) {
      tracks[data[j].id].mood = classify(data[j]);
      tracks[data[j].id].features = data[j];
    }
  }
  return tracks;
}

const getNonUniqueSortedTracksInfo = async function(tracks) {
  var keys = tracks.map(function(item) {
    return item['id'];
  }).filter(distinct);

  var tracksInfo = {};
  for (var i = 0; i <= keys.length; i+=48) {
    var data = (await getTracksFeatures(keys.slice(i, i+48))).body.audio_features;
    for (var j = 0; j < data.length; j++) {
      tracksInfo[data[j].id] = classify(data[j]);
    }
  }

  for (var i = 0; i < tracks.length; i++) {
    tracks[i].mood = tracksInfo[tracks[i].id];
  }
  return tracks;
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

const getTracks = async (id, offsetVal, retries) => {
  try {
    const response = await spotifyApi.getPlaylistTracks(id, {limit: 100, offset: offsetVal, fields: 'next,items(track(name,artists, id))'});
    return response;
  } catch (e) {
    if (retries > 0) {
      console.error(e);
      await sleep(1000);
      return getTracks(id, offsetVal, retries - 1);
    }
    throw e;
  }
};

const getLikedTracks = async (offsetVal, retries) => {
  try {

    const response = await spotifyApi.getMySavedTracks({limit: 50, offset: offsetVal});
    return response;
  } catch (e) {
    if (retries > 0) {
      console.error(e);
      await sleep(1000);
      return getLikedTracks(offsetVal, retries - 1);
    }
    throw e;
  }
};

const getTracksFeatures = async (ids, retries) => {
  try {
    const response = await spotifyApi.getAudioFeaturesForTracks(ids);
    return response;
  } catch (e) {
    if (retries > 0) {
      console.error(e);
      await sleep(1000);
      return getTracksFeatures(ids, retries - 1);
    }
    throw e;
  }
};

const getRecentTracks = async function(username, userid) {
  await getAccessToken(username);
  var listens = await database.getYesterdayListenInfo(userid);

  tracks = [];
  var stopped = 0;
  for (var i = 0; i <= listens.length; i+=48) {
      var listensIDs = listens.slice(i, i+48).map(function(item) {
        return item['songid'];
      });
    var data = (await spotifyApi.getTracks(listensIDs)).body.tracks;

    for (var j = 0; j < data.length; j++) {
      data[j].listen = listens[stopped];
      tracks.push(data[j]);
      stopped += 1;
    }
  }
  
  tracks = await getNonUniqueSortedTracksInfo(tracks);
  return tracks;
}

/*
0: Neutral
1: Happy
2: Sad
3: Calm
4: Energetic
5: Exuberant
6: Lively
7: Joyful
8: Contentment
9: Relaxing
10: Frantic
11: Depressing
12: Melancholic
13: For Concentration
14: Motivational

0: Neutral
1: Happy
5: Exuberant
7: Joyful

3: Calm
8: Contentment
9: Relaxing
13: For Concentration
14: Motivational

6: Lively
10: Frantic
4: Energetic

11: Depressing
12: Melancholic
2: Sad

-1: negative
0: neutral
1: positive

*/
function classify (track) {
  var valence = 0;
  var energy = 0;
  var acousticness = 0;
  var instrumentalness = 0;
  var danceability = 0;

  answer = 0;

  if (track.valence >= 0.7) valence = 1;
  else if (track.valence <= 0.3) valence = -1;

  if (track.energy >= 0.7) energy = 1;
  else if (track.energy <= 0.3) energy = -1;

  if (track.acousticness >= 0.7) acousticness = 1;
  else if (track.acousticness <= 0.3) acousticness = -1;

  if (track.instrumentalness >= 0.7) instrumentalness = 1;
  else if (track.instrumentalness <= 0.3) instrumentalness = -1;

  if (track.danceability >= 0.7) danceability = 1;
  else if (track.danceability <= 0.3) danceability = -1;

  if (valence == 1) {
    /*
    Happy, Exuberant, Lively, Joyful, Contentment, Relaxation
    */
   if (energy == 1) {
      // Exuberant, Lively
      if (danceability == 1) {
        // Lively
        return 6;
      }
      else {
        // Exuberant
        return 5;
      }
   }
   else if (energy == -1) {
     // Contentment, Relaxation
     if (acousticness == 1 || instrumentalness == 1) {
       // Relaxation
       return 9;

     }
     else {
       // Contentment
       return 8;

     }
   }
   else {
     // Happy, Joyful
     if (danceability == 1) {
      // Joyful
      return 7;
    }
    else {
      // Happy
      return 1;
    }
   }
  }
  else if (valence == -1) {
    /*
    Sad, Frantic, Depressing, Melancholic
    */
   if (energy == 1) {
    // Frantic
    return 10;
    }
    else if (energy == -1) {
      // Depressing, Melancholic
      if (acousticness == 1 || instrumentalness == 1) {
        // Melancholic
        return 12;
      }
      else {
        // Depressing
        return 11;
      }
      }
    else {
      // Sad
      return 2;
    }
  }
  else {
    // Neutral, Calm, Energetic, For Concentration, Motivational
    if (energy == 1) {
      // Energetic, Motivational
      if (acousticness == 1 || instrumentalness == 1) {
        // Motivational
        return 14;
      }
      else {
        // Energetic
        return 4;
      }
    }
    else if (energy == -1) {
      // Calm, For Concentration
      if (acousticness == 1 || instrumentalness == 1) {
        // For Concentration
        return 13;
      }
      else {
        // Calm
        return 3;
      }
    }
    else {
      // Neutral
      return 0;
    }
  }

}


function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

setInterval(dataListener, 30000);

module.exports.sortUserSongs = sortUserSongs;

module.exports.getTracksInfo = getTracksInfo;
module.exports.getData = getData;
module.exports.finaliseAuth = finaliseAuth;
module.exports.getRecentTracks = getRecentTracks;



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