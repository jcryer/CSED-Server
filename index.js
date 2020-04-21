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
        };
        next();
      }
    });
    
  } catch (err) {
    return res.status(500).json(err.toString());
  }
};

router.post("/api/login", function (req, res, next) {
  database.checkLoginDetails(req.body.username, req.body.password).then(
    function(data) {
      if (data.valid) {
        var id = data.id;
        var username = req.body.username;
        var expiration = process.env.DB_ENV === 'testing' ? 30000 : 86400000;
        var token = jwt.sign({ 'id': id, 'username': username }, process.env.JWT_SECRET, {
          expiresIn: process.env.DB_ENV === 'testing' ? '30s' : '1d',
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
    }
  )
});

router.post("/api/register", function (req, res, next) {
  database.checkIfUserExists(req.body.username).then(
    function(data) {
      if (!data) {
        
        database.addUser(req.body.username, req.body.password).then(
          function(userID) {
            var id = userID;
            var username = req.body.username;
            var expiration = process.env.DB_ENV === 'testing' ? 30000 : 86400000;
            var token = jwt.sign({ 'id': id, 'username': username }, process.env.JWT_SECRET, {
              expiresIn: process.env.DB_ENV === 'testing' ? '30s' : '1d',
            });
            
            res.cookie('token', token, {
              expires: new Date(Date.now() + expiration),
              secure: false,
              httpOnly: true
            });
            res.send("true");
          }
        )
      }
      else {
        res.send("false");
      }
    }
  )
  //res.send("UH OH AGAIN");
});

router.get('/api/yesterdayMood', verifyToken, async function(req, res) {
  var data = await spotify.getRecentTracks(req.user.username, req.user.id);
  var output = "test<br><br>";
  var out = [];
  for (var key in data) {
    var date = new Date(data[key].listen.played);

    out.push({'hour': date.getHours(), 'mood': data[key].mood});
  }
  res.send(JSON.stringify(out, null, "\t"));

});

router.get('/api/monthMood', verifyToken, async function(req, res) {
  var data = await spotify.getRecentTracks(req.user.username, req.user.id);
  var output = "test<br><br>";
  var out = [];
  for (var key in data) {
    var date = new Date(data[key].listen.played);

    out.push({'hour': date.getHours(), 'mood': data[key].mood});
  }
  res.send(JSON.stringify(out, null, "\t"));

});

router.get("/getUsers", verifyToken, function (req, res, next) {

    var x = database.getUsers().then(
      function(data) {
        res.send(data);
      });
});

router.get('/connect', verifyToken, function(req, res) {
 var scopes = 'user-read-playback-state streaming playlist-read-collaborative user-library-read user-modify-playback-state playlist-modify-public user-top-read user-read-currently-playing playlist-read-private user-follow-read user-read-recently-played playlist-modify-private ';

  database.getAuthToken(req.user.username).then(
    function (data) {

      res.send('<a href="https://accounts.spotify.com/authorize' 
      + '?response_type=code' 
      + '&client_id=' + my_client_id 
      + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') 
      + '&redirect_uri=' + encodeURIComponent(redirect_uri)
      + '&state=' + data
      + '">Login to Spotify here</a>');
    }
  );
});
  
  router.get('/callback', function(req, res) {
    spotify.finaliseAuth(req.query.code).then(
      function(data) {
        database.updateAuthInfo(req.query.state, req.query.code, data).then(
          function(data) {
            res.redirect('landing.html');
          }
        )
      }
    );
  });

  router.get('/info', verifyToken, function(req, res) {
      spotify.getData(req.user.username, req.user.id);
      res.send("aaa");
  });

  router.get('/testData', verifyToken, async function(req, res) {
    var data = await spotify.getTracksInfo(req.user.username, req.user.id);
    var output = "test<br><br>";
    for (var i = 0; i < data.length; i++) {
      output += i+1 + ": <b>" + data[i].name + "</b>, by " + data[i].artist + "  | " + data[i].listen.played + " | <a href='" + data[i].uri + "'>Click here</a><br><br>";
    }
    res.send(output);
});

router.get('/api/getTracks', verifyToken, async function(req, res) {
  var data = await spotify.getTracksInfo(req.user.username, req.user.id);
  var output = "test<br><br>";
  for (var i = 0; i < data.length; i++) {
    output += i+1 + ": <b>" + data[i].name + "</b>, by " + data[i].artist + "  | " + data[i].listen.played + " | <a href='" + data[i].uri + "'>Click here</a><br><br>";
  }
  res.send(output);
});

const moods = Object.freeze({0: "Neutral", 1: "Happy", 2: "Sad", 3: "Calm", 4: "Energetic", 5: "Exuberance", 6: "Lively", 7: "Joyful", 8: "Contentment", 9: "Relaxing", 10: "Frantic", 11: "Depressing", 12: "Melancholic", 13: "For Concentration", 14: "Motivational" });

router.get('/moodClassification', verifyToken, async function(req, res) {
  var data = await spotify.sortUserSongs(req.user.username, req.user.id);
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

module.exports = router;