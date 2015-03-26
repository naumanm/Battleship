// entry point when server starts

// setup env
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
 
// location for static files
app.use(express.static(__dirname + '/public'));

// root route
app.get('/', function(req, res){
  res.render("index.ejs");
});

// game communication
io.on('connection', function(socket){
  socket.join("Game");

  console.log('a user connected');

  socket.on('shot', function(shotObj){
    io.emit('shot', shotObj);
    console.log(shotObj);
  });

  socket.on('playerJoined', function(player) {
    console.log(player);
    // push player to redis
    client.LPUSH("playerList", player);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

// loop to check for players to start game
setInterval(function(){checkTwoPlayers()}, 5000);


function checkTwoPlayers() {
  console.log("Start Game check");
  //console.log(client.LLEN(playerList));
}


function startGame(playerList){


}

// when get to the point when there is a winner
// use 


// load our server
http.listen(3000, function(){
  console.log('listening on *:3000');
});