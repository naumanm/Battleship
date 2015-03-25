var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    redis = require("redis"),
    client = redis.createClient(),
    methodOverride = require("method-override"),
    bodyParser = require("body-parser");


// allows us to use ejs instead of html
app.set("view engine", "ejs");
 
// for static files
app.use(express.static(__dirname + '/public'));

// root route
app.get('/', function(req, res){
  //res.sendFile(__dirname + '/index.ejs');
  res.render("index.ejs");
});





// load our server
http.listen(3000, function(){
  console.log('listening on *:3000');
});