var mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

mongoose.connect('mongodb+srv://test:test@cluster0-bujef.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  password: String,
  auth_key: String,
  refresh_token: String,
});

var ListenSchema = new Schema({
    userid: String,
    songid: String,
    played: String,
  });

var Users = mongoose.model('Users', UserSchema );
var Listens = mongoose.model('Listens', ListenSchema );

function addListenInfo(data, userid) {
    data.forEach(function(item) {
        try {
        Listens.count({'songid': item.track.id, 'played': item.played_at}, function (err, count){ 
            if(count == 0) {
                Listens.create({'userid': userid, 'songid': item.track.id, 'played': item.played_at}, function (err, instance) {
                    if (err) return handleError(err);
                });
            }
        }); 
    }
    catch (e) {
        console.log(e);
    }
    });
}

function getDayListenInfo(userid, day) {
    return new Promise(function(resolve, reject) {
        Listens.find({'userid': userid}, function(err, listens) {
            var listenMap = [];
            listens.forEach(function(listen) {
                var date = new Date(listen.played);
                if (compareDates(date, day)) {
                    listenMap.push(listen);
                }
            });
            resolve(listenMap);
        });
    });
}

function getAllListenInfo(userid) {
    return new Promise(function(resolve, reject) {
        var count = {};
        Listens.find({'userid': userid}, function(err, listens) {
            listens.forEach(function(listen) {
                if (listen.songid in count) {
                    count[listen.songid] += 1;
                }
                else {
                    count[listen.songid] = 1;
                }
            });
            resolve(count);
        });
    });
}

function compareDates(a, b) {
    if (a.getDate() == b.getDate() && a.getMonth() == b.getMonth() && a.getFullYear() == b.getFullYear()) {
        return true;
    }
    return false;
}

function addUser(username, password) {
    return new Promise(function(resolve, reject) {
        argon2.hash(password).then((hash) => {
            Users.create({'username': username, 'password': hash, 'auth_key': makeid(48)}, function (err, instance) {
                if (err) return handleError(err);
                resolve(instance._id);
            });
        });
    });
}

function getUsers() {
    try {
    return new Promise(function(resolve, reject) {
        Users.find({}, function(err, users) {
            var userMap = [];
        
            users.forEach(function(user) {
                userMap.push(user);
            });

            resolve(userMap);
        });
    });

  }
  catch (err) {

    console.log(err);
  }
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

function getAuthToken(username) {
    return new Promise(function(resolve, reject) {
        Users.findOne({'username': username }, function(err, userData){            
            if(userData){
                resolve(userData.auth_key);
            }
        });
    });
}

function getRefreshToken(username) {
    return new Promise(function(resolve, reject) {
        Users.findOne({'username': username }, function(err, userData){            
            if(userData){
                resolve(userData.refresh_token);
            }
        });
    });
}

function updateAuthInfo(tempKey, newKey, refreshToken) {
    return new Promise(function(resolve, reject) {
        Users.findOneAndUpdate({'auth_key': tempKey }, { 'auth_key': newKey, 'refresh_token': refreshToken }, (err) => {
            if (err) {
                resolve(false);
            }
            resolve(true);
        });
    });
}

function checkLoginDetails(username, password) {
    return new Promise(function(resolve, reject) {

        Users.find({'username': username}, function(err, users) {
            if (users.length > 0) {
                argon2.verify(users[0].password, password).then(function(isValid) 
                {
                    if (isValid == true) {
                        resolve({ 'valid': true, 'id': users[0].id });
                    }
                    else {
                        resolve({'valid': false });
                    }
                }).catch(() => {
                    resolve({'valid': false });
                });
            }
        });
    });
}

function checkIfUserExists(username) {
    return new Promise(function(resolve, reject) {
        Users.find({'username': username}, function(err, users) {
            if (users.length > 0) {
                resolve(true);
            }
                resolve(false);
        });
    });
}

module.exports.addUser = addUser;
module.exports.addListenInfo = addListenInfo;

module.exports.checkIfUserExists = checkIfUserExists;
module.exports.getUsers = getUsers;
module.exports.getRefreshToken = getRefreshToken;
module.exports.checkLoginDetails = checkLoginDetails;
module.exports.updateAuthInfo = updateAuthInfo;
module.exports.getAuthToken = getAuthToken;
module.exports.getDayListenInfo = getDayListenInfo;
module.exports.getAllListenInfo = getAllListenInfo;