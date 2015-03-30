// entry point when server starts

// setup env
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    redis = require("redis"),
    client = redis.createClient(),
    methodOverride = require("method-override"),
    roomNumber=1,
    playerPair=0,
    bodyParser = require("body-parser");

// allows us to use ejs instead of html
app.set("view engine", "ejs");

// more middleware    Christian added this... found in my class examples... do we need? body parser to get the player's name from the form withing the modal. method override for the routes that add to redis. wondering about this one since we already are emitting the moves, I'm thinking the controller would handle the action based on that.
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method')); // probably not needed.
 
// location for static files
app.use(express.static(__dirname + '/public'));

// root route
app.get('/', function(req, res){
  res.render("index.ejs");
});

// player's name route
app.get('/player', function(req, res){

  client.LPUSH("player", req.body.player);

  // what if this route doesn't render or redirect? 
  res.redirect("/");  // redirects are to routes while renders are to views

  res.render("index.ejs"); // thinking not to redirect since modal will show again. need this to be ajaxified
});

// about us route
app.get('/about', function(req, res){
  res.render("about.ejs");
});

// game instructions route
app.get('/instructions', function(req, res){
  res.render("instructions.ejs");
});

// game communication
io.on('connection', function(socket){
  socket.join(roomNumber);
  console.log(roomNumber);

  console.log('a user connected');

  socket.on('shot', function(shotObj){
    io.emit('shot', shotObj);
    client.LPUSH("shotFired", shotObj);
    console.log(shotObj);
  });

  socket.on('playerJoined', function(player) {
    console.log(player);
    playerPair++;
    if (playerPair===2){
      roomNumber++;
      playerPair=0;
    }
    // push player to redis & designate socket owner
    client.LPUSH("playerList", player);
    socket.nickname=player; 
  });

  socket.on('disconnect', function(){
    console.log(socket.nickname + " disconnected");
    if (!socket.nickname) return;              
    client.LREM("playerList",0,socket.nickname); //removes player from redis list
  });

});

// loop to check for players to start game
// need to replace this with a form and be 
// setInterval(function(){checkTwoPlayers()}, 5000);

function checkTwoPlayers() {
  console.log("Start Game check");

  client.lrange('playerList', 0, -1, function(err, reply) {
      console.log(reply);
      if (reply.length === 2) {
        startGame(reply);
      }
  });
}


function startGame(playerList){
  console.log("game started");

}

// when get to the point when there is a winner
// use this function on each move to check if either player lost all of their ships
//pseudo code
//function (--==somePlayerObject==--) {
//  boatArray.each
//}


// load our server
http.listen(3000, function(){
  console.log('listening on *:3000');
});