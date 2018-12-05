'use strict';
var urlExists = require('url-exists');
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var bodyParser = require("body-parser");
var cors = require('cors');
var dns = require('dns');

var app = express();

var connection = mongoose.connect(###CONNECTIONSTRING###);
autoIncrement.initialize(connection);

var Schema = mongoose.Schema;


var recordSchema = new Schema({
  url: String,
  recordId: Number
});

recordSchema.plugin(autoIncrement.plugin, { model: 'Record', field: 'recordId', startAt: 1 });

var Record = mongoose.model('Record', recordSchema);

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.post("/api/shorturl/new", function (req, res) {
  var url = req.body.url;
  urlExists(url, function(err, exists) {
    if(!exists) res.json({"error":"invalid URL"});
    else {
      var record = new Record({
        url: url
      });
      record.save((err, data) => {
        if (err) {
          console.log(err);
        }
        res.json({"original_url": data.url, "short_url": data.recordId});
      });
    }
  });
});

app.get("/api/shorturl/:id", function(req, res){
  var recordId = req.params.id;
  Record.findOne({recordId: recordId} , function (err, data) {
    if(err){
      res.json(err);
    }
    var forwardUrl = data.url;
    res.writeHead(301,
      {Location: forwardUrl}
    );
    res.end();
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
