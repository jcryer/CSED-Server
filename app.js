const express = require('express');
const app = express();
const bodyparse = require('body-parser');

const index = require('./index');

app.use(bodyparse());
app.use(express.static('public'));

app.use("/", index);

module.exports = app;