express = require("express");
fs = require("fs");

const test = require("./spotify");

var my_client_id = "295687b97d8f4da38afd639684a8a60e";
var redirect_uri = "https://csed-server.herokuapp.com/callback";
router = express.Router();

router.get("/", function (req, res, next) {
    res.send("UH OH");
});

router.get("/test", function (req, res, next) {
    res.send("Big test hours");
});

router.get('/login', function(req, res) {
    var scopes = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + my_client_id +
      (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
      '&redirect_uri=' + encodeURIComponent(redirect_uri));
    });
  
  router.post('/callback', function(req, res) {
    console.log('POST /');
    console.dir(req.body);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
  });

  router.get('/callback', function(req, res) {
    res.redirect('landing.html');
  });

module.exports = router;