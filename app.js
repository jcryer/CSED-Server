const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const argon2 = require('argon2');
const cookieParser = require('cookie-parser');
const app = express();
const bodyparse = require('body-parser');
app.use(bodyparse.json());
app.use(cookieParser());

const index = require('./index');

app.use(express.static('public'));

app.use("/", index);

module.exports = app;