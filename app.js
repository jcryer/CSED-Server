const express = require('express');
const app = express();
const bodyparse = require('body-parser');
app.use(bodyparse.json());

const index = require('./index');

app.use(express.static('public'));

app.use("/", index);

module.exports = app;