const http = require('http');
var SpotifyWebApi = require('spotify-web-api-node');
const database = require("./db");

var credentials = {
  redirectUri: 'https://csed-server.herokuapp.com/callback',
  clientId: '295687b97d8f4da38afd639684a8a60e',
  clientSecret: '5866b2dc04244accbca3215a7281c4b2',
};

var spotifyApi = new SpotifyWebApi(credentials);

async function finaliseAuth(authCode) {
  var data = await spotifyApi.authorizationCodeGrant(authCode);

  return data.body['refresh_token'];
}

const distinct = (value, index, self) => {
  return self.indexOf(value) === index;
}

/*
const getRecentTracks = async function(username, userid) {
  await getAccessToken(username);
  var listens = await database.getYesterdayListenInfo(userid);

  tracks = [];
  var stopped = 0;
  for (var i = 0; i <= listens.length; i+=48) {
      var listensIDs = listens.slice(i, i+48).map(function(item) {
        return item['songid'];
      });
    var data = (await getTracks(listensIDs, 5)).body.tracks;

    for (var j = 0; j < data.length; j++) {
      data[j].listen = listens[stopped];
      tracks.push(data[j]);
      stopped += 1;
    }
  }
*/

const getDayListenInfo = async function(username, userid, day, accessToken) { // good(?)
 setAccessToken(accessToken);
  var listens = await database.getDayListenInfo(userid, day);

  trackIDs = [];
  tracks = [];
  var stopped = 0;

  for (var i = 0; i <= listens.length; i+=48) {
    var listenIDs = listens.slice(i, i+48).map(function(item) {
      return item['songid'];
    });
    var data = (await getTracks(listenIDs, 5)).body.tracks; 
    // Need: ID, artwork, album, artist, track, url
    for (var j = 0; j < data.length; j++) {
      tracks.push({
        'id': data[j].id, 
        'artwork': data[j].album.images[2].url, 
        'album': data[j].album.name, 
        'artist': data[j].artists[0].name, 
        'track': data[j].name,
        'time': listens[stopped].played,
        'url': data[j].uri
      });
      stopped += 1;
    }
  }
  tracks = await getRecentTrackData(tracks);
  return tracks;
}

const getTopTen = async function(userid, accessToken) { // good(?)
  setAccessToken(accessToken);
  var listens = await database.getAllListenInfo(userid);
  var sortable = [];
  for (var listen in listens) {
    sortable.push([listen, listens[listen]]);
  }
  sortable.sort(function(a, b) {
      return b[1] - a[1];
  });
  var ids = []; // Contains top ten IDs
  for (var i = 0; i < 10; i++) {
    ids.push(sortable[i][0]);
  }

  console.log(ids);

  var out = [];
  var songInfo = (await getTracks(ids, 5)).body.tracks;

  for (var i = 0; i < 10; i++) {
    out.push({'id': songInfo[i].id, 'track': songInfo[i].name, 'listens': listens[songInfo[i].id], 'album': songInfo[i].album.name, 'artist': songInfo[i].artists[0].name });
  }
   out = await getRecentTrackData(out);
   return out;
 }

async function sortUserSongs(accessToken) {
 setAccessToken(accessToken);

  try {
    var allTracks = {};
    var playlistNext = true;

    while (playlistNext) {
      var playlists = (await getUserPlaylists(5)).body;
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
          var tracks = (await getPlaylistTracks(playlists.items[i].id, offset, 5)).body;
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
    var data = (await getTracksFeatures(keys.slice(i, i+48), 5)).body.audio_features;

    for (var j = 0; j < data.length; j++) {
      tracks[data[j].id].mood = classify(data[j]);
      tracks[data[j].id].features = data[j];
    }
  }
  return tracks;
}

const getRecentTrackData = async function(tracks) { // good
  var keys = tracks.map(a => a.id);
  for (var i = 0; i < tracks.length; i+=48) {
    var data = (await getTracksFeatures(keys.slice(i, i+48), 5)).body.audio_features;
    for (var j = 0; j < data.length; j++) {

      var foundIndexes = [];

      for (var x = 0; x < tracks.length; x++) {
        if (tracks[x].id == data[j].id) {
          foundIndexes.push(x);
        }
      }
      
      for (var l = 0; l < foundIndexes.length; l++) {
        var c = classify(data[j]);
        tracks[foundIndexes[l]].mood = c;
      }
    }

  }

  return tracks;
}

const getNonUniqueSortedTracksInfo = async function(tracks) {
  var keys = tracks.map(function(item) {
    return item['id'];
  }).filter(distinct);

  var tracksInfo = {};
  for (var i = 0; i < keys.length; i+=48) {
    var data = (await getTracksFeatures(keys.slice(i, i+48), 5)).body.audio_features;
    for (var j = 0; j < data.length; j++) {
      tracksInfo[data[j].id] = classify(data[j]);
    }
  }

  for (var i = 0; i < tracks.length; i++) {
    tracks[i].mood = tracksInfo[tracks[i].id];
  }
  return tracks;
}

async function getAccessToken(username) {
  try {
    var refreshToken = await database.getRefreshToken(username);
    spotifyApi.setRefreshToken(refreshToken);
    var data = await spotifyApi.refreshAccessToken();
    return data.body['access_token'];
  }
  catch (err) {
    return "false";
  }
} 

function setAccessToken(accessToken) {
  spotifyApi.setAccessToken(accessToken);
}

const getData = async function(username, userid, accessToken) {
  setAccessToken(accessToken);
  var data = await getMyRecentlyPlayedTracks(5);
  database.addListenInfo(data.body.items, userid);
}


const dataListener = async function() {
  try {
    var users = await database.getUsers();
    var filteredUsers = users.filter(function (data) {
      return data.refresh_token != null;
    });
    filteredUsers.forEach(async function(user) {
      var accessToken = await getAccessToken(user.username);
      if (accessToken != "false") {
        await getData(user.username, user._id, accessToken);
      }
    });
  }
  catch (err) {
    console.log(err);
  }
}

const getMyRecentlyPlayedTracks = async (retries) => {
  try {
    const response = await spotifyApi.getMyRecentlyPlayedTracks({limit: 50});
    return response;
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return getMyRecentlyPlayedTracks(retries);
    }
    throw e;
  }
};

const getUserPlaylists = async (retries) => {
  try {
    const response = await spotifyApi.getUserPlaylists({limit: 50});
    return response;
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return getUserPlaylists(retries);
    }
    throw e;
  }
};

const getTracks = async (ids, retries) => {  
  try {
    const response = await spotifyApi.getTracks(ids, {});
    return response;
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return getTracks(ids, retries - 1);
    }
    throw e;
  }
};

const getPlaylistTracks = async (id, offsetVal, retries) => {
  try {
    const response = await spotifyApi.getPlaylistTracks(id, {limit: 100, offset: offsetVal, fields: 'next,items(track(name,artists, id))'});
    return response;
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return getPlaylistTracks(id, offsetVal, retries - 1);
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
      await sleep(1000);
      return getTracksFeatures(ids, retries - 1);
    }
    throw e;
  }
};

const getRecentTracks = async function(username, userid, date, accessToken) {
  setAccessToken(accessToken);
  var listens = await database.getDayListenInfo(userid, date);
  tracks = [];
  var stopped = 0;
  for (var i = 0; i <= listens.length; i+=48) {
      var listensIDs = listens.slice(i, i+48).map(function(item) {
        return item['songid'];
      });
      var t = await getTracks(listensIDs, 5);

    var data = t.body.tracks;
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

setInterval(dataListener, 10000);

module.exports.getAccessToken = getAccessToken;

module.exports.sortUserSongs = sortUserSongs;

module.exports.getDayListenInfo = getDayListenInfo;
module.exports.getData = getData;
module.exports.finaliseAuth = finaliseAuth;
module.exports.getRecentTracks = getRecentTracks;
module.exports.getTopTen = getTopTen;