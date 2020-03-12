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
});

var Users = mongoose.model('Users', UserSchema );

function generateToken(res, id, firstname) {
    return new Promise(function(resolve, reject) {
        var expiration = process.env.DB_ENV === 'testing' ? 100 : 604800000;
        var token = jwt.sign({ id, firstname }, process.env.JWT_SECRET, {
            expiresIn: process.env.DB_ENV === 'testing' ? '1d' : '7d',
        });
        console.log(token);
        resolve(token);
        resolve(res.cookie('token', token, {
            expires: new Date(Date.now() + expiration),
            secure: false,
            httpOnly: true,
        }));
    });
}

function addUser(username, password) {
    argon2.hash(password).then((hash) => {
        Users.create({'username': username, 'password': hash, 'auth_key': makeid(48)}, function (err, instance) {
            if (err) return handleError(err);
        });
    });
}

function getUsers() {
    return new Promise(function(resolve, reject) {
        Users.find({}, function(err, users) {
            var userMap = {};
        
            users.forEach(function(user) {
                userMap[user._id] = user;
            });

            resolve(userMap);
        });
    });
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

function updateUserAuthKey(tempKey, newKey) {
    return new Promise(function(resolve, reject) {
        Users.findOneAndUpdate({'auth_key': tempKey }, { 'auth_key': newKey }, (err) => {
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

/*
Users.find({ username: 'test', auth_key: '2r345y6trejh' }, 'username password', function (err, users) {
    if (err) return handleError(err);
    console.log(users);
});*/
module.exports.generateToken = generateToken;

module.exports.addUser = addUser;
module.exports.checkIfUserExists = checkIfUserExists;
module.exports.getUsers = getUsers;
module.exports.checkLoginDetails = checkLoginDetails;
module.exports.updateUserAuthKey = updateUserAuthKey;
module.exports.getAuthToken = getAuthToken;

/*var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";

MongoClient.connect(url + "/mydb", {poolSize: 10}, function(err, db) {
    if (err) throw err;
    console.log("Database created!");

    var dbo = db.db("mydb");

    dbo.createCollection("customers", function(err2, res) {
        if (err2) throw err2;
        console.log("Collection created!");

        var myobj = { name: "Company Inc", address: "Highway 37" };
            dbo.collection("customers").insertOne(myobj, function(err3, res2) {
            if (err3) throw err3;
            console.log("1 document inserted");
            dbo.collection("customers").findOne({}, function(err4, result) {
                if (err4) throw err4;
                console.log(result.name);
              });
        });
    db.close();
  });
});

MongoClient.connect(url, function(err, dbaa) {
    if (err) throw err;
    var dbo = db.db("mydb");

    dbo.createCollection("customers", function(err2, res) {
        if (err2) throw err2;
        console.log("Collection created!");

        var myobj = { name: "Company Inc", address: "Highway 37" };
            dbo.collection("customers").insertOne(myobj, function(err3, res2) {
            if (err3) throw err3;
            console.log("1 document inserted");
            dbo.collection("customers").findOne({}, function(err3, result) {
                if (err) throw err;
                console.log(result.name);
              });
        });
    dbo.close();
    });
});



  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var myobj = { name: "Company Inc", address: "Highway 37" };
    dbo.collection("customers").insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
  */