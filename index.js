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
  console.log(Cookies);
  var token = req.cookies.token || '';
  console.log(token);
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
  console.log(req.body);
});

router.post("/api/register", function (req, res, next) {
  database.checkIfUserExists(req.body.username).then(
    function(data) {
      if (!data) {
        
        database.addUser(req.body.username, req.body.password);
        res.send("true");
      }
      else {
        res.send("false");
      }
    }
  )
  console.log(req.body);
  //res.send("UH OH AGAIN");
});

router.get("/getUsers", verifyToken, function (req, res, next) {

    var x = database.getUsers().then(
      function(data) {
        console.log(data);
        res.send(data);
      });
});

router.get('/connect', verifyToken, function(req, res) {
  //res.send("test");
  /*
  res.send('<a href="https://accounts.spotify.com/authorize'
  + '?response_type=code' 
    + '&client_id=' + my_client_id 
  + '">aaa</a>');
  */
 var scopes = 'user-read-playback-state streaming playlist-read-collaborative user-modify-playback-state playlist-modify-public user-top-read user-read-currently-playing playlist-read-private user-follow-read user-read-recently-played playlist-modify-private ';

  database.getAuthToken(req.user.username).then(
    function (data) {
      console.log(req.user.username);

      res.send('<a href="https://accounts.spotify.com/authorize' 
      + '?response_type=code' 
      + '&client_id=' + my_client_id 
      + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') 
      + '&redirect_uri=' + encodeURIComponent(redirect_uri)
      + '&state=' + data
      + '">Login to Spotify here</a>');
    }
  );
    
    /*
    res.send('https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + my_client_id +
      (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
      '&redirect_uri=' + encodeURIComponent(redirect_uri));*/
    });
  
  router.get('/callback', function(req, res) {
    console.log(req.query.state);
    spotify.getData2(req.query.code);

    database.updateUserAuthKey(req.query.state, req.query.code).then(
      function(data) {
        res.redirect('landing.html');
      }
    )
    res.redirect('landing.html');
  });


  router.get('/info', verifyToken, function(req, res) {
      spotify.getData3();
  });

module.exports = router;