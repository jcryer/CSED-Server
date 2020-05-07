express = require("express");
fs = require("fs");
const dotenv = require('dotenv');

const jwt = require('jsonwebtoken');
const database = require("./db");
const spotify = require("./spotify");

var my_client_id = "295687b97d8f4da38afd639684a8a60e";
var redirect_uri = "https://csed-server.herokuapp.com/callback";
router = express.Router();

dotenv.config();

const verifyToken = async (req, res, next) => {
  var Cookies = JSON.stringify(req.cookies);
  var token = req.cookies.token || '';
  try {
    if (!token) {
      return res.status(401).json('You need to Login')
    }

    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) {
      }
      else {
        req.user = {
          id: decoded.id,
          username: decoded.username,
          access_token: decoded.access_token,
          is_valid: decoded.is_valid
        };
        next();
      }
    });
    
  } catch (err) {
    return res.status(500).json(err.toString());
  }
};

router.post("/api/login", async function (req, res, next) {
  var data = await database.checkLoginDetails(req.body.username, req.body.password);
  if (data.valid) {
    var id = data.id;
    var username = req.body.username;
    var expiration = process.env.DB_ENV === 'testing' ? 30000 : 3600000;
    var access_token = await spotify.getAccessToken(username);
    var isValid = true;
    if (access_token == "false") {
      isValid = false;
    }
    var token = jwt.sign({ 'id': id, 'username': username, 'access_token':  access_token, 'is_valid': isValid}, process.env.JWT_SECRET, {
      expiresIn: process.env.DB_ENV === 'testing' ? '30s' : '1h',
    });
    
    res.cookie('token', token, {
      expires: new Date(Date.now() + expiration),
      secure: false,
      httpOnly: true
    });
    res.send("true");
  }
  else {
    res.send("false");
  }
});

router.post("/api/register", async function (req, res, next) {
  var data = await database.checkIfUserExists(req.body.username);
  if (!data) {
   
    var id = await database.addUser(req.body.username, req.body.password);
    var username = req.body.username;
    var expiration = process.env.DB_ENV === 'testing' ? 30000 : 3600000;
    var token = jwt.sign({ 'id': id, 'username': username, 'access_token': "false", 'is_valid': false }, process.env.JWT_SECRET, {
      expiresIn: process.env.DB_ENV === 'testing' ? '30s' : '1h',
    });
    
    res.cookie('token', token, {
      expires: new Date(Date.now() + expiration),
      secure: false,
      httpOnly: true
    });
    res.send("true");
  }
  else {
    res.send("false");
  }
});

router.get('/api/dayMood', verifyToken, async function(req, res) {
  var date = new Date(req.query.date);
  var data = await spotify.getRecentTracks(req.user.username, req.user.id, date, req.user.access_token);
  var out = [];
  for (var key in data) {
    var date = new Date(data[key].listen.played);

    out.push({'hour': date.getHours(), 'mood': data[key].mood});
  }
  res.send(JSON.stringify(out, null, "\t"));

});


router.get('/api/topTen', verifyToken, async function(req, res) {
  var data = await spotify.getTopTen(req.user.id, req.user.access_token);
  
  res.send(JSON.stringify(data));

});

router.get('/api/monthMood', verifyToken, async function(req, res) {
  var data = await spotify.getRecentTracks(req.user.username, req.user.id, req.user.access_token);
  var output = "test<br><br>";
  var out = [];
  for (var key in data) {
    var date = new Date(data[key].listen.played);

    out.push({'hour': date.getHours(), 'mood': data[key].mood});
  }
  res.send(JSON.stringify(out, null, "\t"));

});


router.get('/landing', verifyToken, async function(req, res) {
  fs.readFile('public/landing.html', 'utf8', function(err, data) {
    if (err) throw err;
    res.send(data);
  });
});

router.get('/connect', verifyToken, async function(req, res) {
 var scopes = 'user-read-playback-state streaming playlist-read-collaborative user-library-read user-modify-playback-state playlist-modify-public user-top-read user-read-currently-playing playlist-read-private user-follow-read user-read-recently-played playlist-modify-private ';

  var token = await database.getAuthToken(req.user.username);
  res.redirect("https://accounts.spotify.com/authorize"
  + '?response_type=code' 
  + '&client_id=' + my_client_id 
  + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') 
  + '&redirect_uri=' + encodeURIComponent(redirect_uri)
  + '&state=' + token);
});
  
  router.get('/callback', async function(req, res) {
    var data = await spotify.finaliseAuth(req.query.code);
    await database.updateAuthInfo(req.query.state, req.query.code, data);
    res.redirect('landing');
  });

  router.get('/info', verifyToken, function(req, res) {
      spotify.getData(req.user.username, req.user.id, req.user.access_token);
      res.send("aaa");
  });

  router.get('/testData', verifyToken, async function(req, res) {
    var data = await spotify.getDayListenInfo(req.user.username, req.user.id, req.user.access_token);
    var output = "test<br><br>";
    for (var i = 0; i < data.length; i++) {
      output += i+1 + ": <b>" + data[i].name + "</b>, by " + data[i].artist + "  | " + data[i].listen.played + " | <a href='" + data[i].uri + "'>Click here</a><br><br>";
    }
    res.send(output);
});

router.get('/api/getTracks', verifyToken, async function(req, res) {
  var date = new Date(req.query.date);
  console.log(date.toDateString());
  //var data = await spotify.getDayListenInfo(req.user.username, req.user.id, req.user.access_token);
  //res.send(JSON.stringify(data));
  /*
  var output = [];
  for (var i = 0; i < data.length; i++) {
    tracks.push({'image': data[i].image, 'album': data[i].album, 'artist': actualList[j].artists[0].name, 'track': actualList[j].name, 'uri': actualList[j].uri, 'time': listens[stopped + j] });

    output.push({});
    output += i+1 + ": <b>" + data[i].name + "</b>, by " + data[i].artist + "  | " + data[i].listen.played + " | <a href='" + data[i].uri + "'>Click here</a><br><br>";
  }
  res.send(output);*/
});



function backOneDay(a) {
  return new Date(a.setDate(a.getDate()-1));
}

router.get('/api/getRecentTracks', verifyToken, async function(req, res) {
  var date = new Date(req.query.date);
  date = backOneDay(date);
  var data = await spotify.getDayListenInfo(req.user.username, req.user.id, date, req.user.access_token);
  var out = {'date': date, 'data': data};
  res.send(JSON.stringify(out));
  /*
  var output = [];
  for (var i = 0; i < data.length; i++) {
    tracks.push({'image': data[i].image, 'album': data[i].album, 'artist': actualList[j].artists[0].name, 'track': actualList[j].name, 'uri': actualList[j].uri, 'time': listens[stopped + j] });

    output.push({});
    output += i+1 + ": <b>" + data[i].name + "</b>, by " + data[i].artist + "  | " + data[i].listen.played + " | <a href='" + data[i].uri + "'>Click here</a><br><br>";
  }
  res.send(output);*/
});

const moods = Object.freeze({0: "Neutral", 1: "Happy", 2: "Sad", 3: "Calm", 4: "Energetic", 5: "Exuberance", 6: "Lively", 7: "Joyful", 8: "Contentment", 9: "Relaxing", 10: "Frantic", 11: "Depressing", 12: "Melancholic", 13: "For Concentration", 14: "Motivational" });

router.get('/moodClassification', verifyToken, async function(req, res) {
  try {
  var data = await spotify.sortUserSongs(req.user.access_token);
  console.log(data);
  }
  catch (err) {
    console.log(err);
  }
  var output = Object.keys(data).length + " <br>";
  for (var mood in moods) {
    output += "<a href='#" + mood + "'>" + moods[mood] + "</a>   ";
  }
  output += "<br><br>";
  for (var mood in moods) {
    output += "<h2 id='" + mood + "'>" + moods[mood] + "</h2>";
    var filtered = Object.keys(data).reduce(function (filtered, key) {
      if (data[key].mood == mood) filtered[key] = data[key];
      return filtered;
    }, {});
    for (var i in filtered) {
      output += i + ": <b>" + filtered[i].name + "</b>, by " + filtered[i].artists[0].name + " - <b>" + moods[filtered[i].mood] + "</b><br><br>";
    }
    output += "<br><br>";
  }
  res.send(output);
});

router.get('/api/moodCount', verifyToken, async function(req, res) {
  var data = await spotify.sortUserSongs(req.user.access_token);
      
  var out = [];
  for (var mood in moods) {
    var filtered = Object.keys(data).reduce(function (filtered, key) {
      if (data[key].mood == mood) filtered[key] = data[key];
      return filtered;
    }, {});

    out.push({'mood': parseInt(mood), 'val': Object.keys(filtered).length });
  }
res.send(JSON.stringify(out));

});

module.exports = router;