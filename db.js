var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://test:test@cluster0-bujef.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  password: String,
  auth_key: String
});

var UserModel = mongoose.model('Users', UserSchema );

function addUser(username, password) {
    UserModel.create({ 'username': username, 'password': password}, function (err, instance) {
        if (err) return handleError(err);
    });
}

function getUsers() {
    return new Promise(function(resolve, reject) {
        UserModel.find({}, function(err, users) {
            var userMap = {};
        
            users.forEach(function(user) {
                userMap[user._id] = user;
            });

            resolve(userMap);
        });
    });

}

/*
UserModel.find({ username: 'test', auth_key: '2r345y6trejh' }, 'username password', function (err, users) {
    if (err) return handleError(err);
    console.log(users);
});*/
module.exports.addUser = addUser;

module.exports.getUsers = getUsers;

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