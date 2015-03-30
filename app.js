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
    bodyParser = require("body-parser"),
    waitingRoom =[], 
    gameRooms=[]; 

// allows us to use ejs instead of html
app.set("view engine", "ejs");

// more middleware  Christian added this... found in my class examples... do we need? body parser to get the player's name from the form withing the modal. method override for the routes that add to redis. wondering about this one since we already are emitting the moves, I'm thinking the controller would handle the action based on that.
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method')); // probably not needed.
 
// location for static files
app.use(express.static(__dirname + '/public'));

// root route
app.get('/', function(req, res){
  res.render("index.ejs");
});

// place ships route
app.get('/place_ship', function(req, res){
  if( player1ID ){
    // set player 1's fleet to redis table
    if( HEXISTS( player1 + "Fleet", session.id ) ){

    }
  } else if( player2ID ) {
    // set player 2's fleet to redis table
  }

  res.render("index.ejs");
});

// player's name route
app.get('/player', function(req, res){
  res.redirect("/");  // redirects are to routes while renders are to views
  res.render("index.ejs"); // thinking not to redirect since modal will show again. need this to be ajaxified
});

// shot fired route 
app.get('/shot/shotObj', function(req, res){
  // gameID is the first player's socket.io ID stored in hash "gameID"
  // gameID 
  if( HEXISTS("gameIDs", gameObj.playerID) && shotObj ){
    var gameID = client.HGET("gameIDs", gameObj.playerID); // This gets the game's ID from the data dictionary

    // check if shot is a hit or miss  should be game prototyped?
    if( HEXISTS("opponent", gameObj.playerID) ){
      var opponentID = client.HGET("opponent", gameObj.playerID); // this gets the opponent player's ID from the opponent dictionary

      if( HEXISTS("ships", gameObj.opponentID) ){
        var opponentsShips = client.HGETALL("ships"); // this gets the opponent player's ship placements
        if( opponentsShips.contains(shotObj.shot) ){ // Christian needs answer from Christian ===> syntax?? is the shot contained within the opponentsShips array?
          // shot is a hit

          if (1){ // Christian needs answer from ???===>HOW TO check if the ship is sunk!!
            // the ship is sunk
            // flash message ship sunk
            // do something

          } else {
            // ship hit but NOT sunk!
            // flash message a hit
            // do something
          } // END if ship sunk

        } else {
          // shot is a miss
          // do something
        } // END if shot hit

        client.RPUSH(gameID, gameObj.playerID, shotObj ); // WHAT DATA FORMAT SHOULD I USE???? Here, RPUSH adds the info to the end otherwise, LPUSH I would have to reverse the shotObj with playerID. I think I need to consider the socket.io ID as the list's key for the data, then I should use SET?  
        gameObj.currentPlayerID = ( gameObj.currentPlayerID === gameObj.gameID ) ? gameObj.player1ID : gameObj.player2ID;
      } else {
        // no opponent ships found??? what to do
      } // END if( opponentsShips.contains(shotObj.shot) 

    } else {
      // no opponent found. what to do???
    }// END if( HEXISTS("opponent", playerID)

    // render or redirect???
  }
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

  socket.on('playerJoined', function(player) {
    socket.nickname=player;
    client.HSETNX("playersName", socket.id, player);
    client.HSETNX("gameIDs", socket.id, socket.id);  //connecting the first player as a game id ref point
    waitingRoom.push(socket.nickname);
    playerPair++;
    //assign a game, roomNumber, and reset queue when two players are in the waiting room
    if (playerPair===2){
      client.HSETNX("opponent", socket.id, socket.id);
      // in case line above doesn't work client.HSETNX("opponent", gameObj.playerID, gameObj.opponentID); 
      gameRooms.push(GameObj.new(waitingRoom[0],waitingRoom[1],roomNumber));
      waitingRoom=[];
      roomNumber++;
      playerPair=0;
    }
  });

  socket.on('shot', function(shotObj){
    io.emit('shot', shotObj);
    client.LPUSH("shotFired", shotObj); //needs to merge with shot html route
    console.log(shotObj);
  });

  socket.on('disconnect', function(){
    console.log(socket.nickname + " disconnected");
    if (!socket.nickname) return;              
  });
  
});

//game logic 
function GameObj (player1,player2,player1name,player2name,player1fleet,player2fleet,id){
  this.player1=player1;  //socket
  this.player1name=player1name; //name
  this.player1fleet=player1fleet;
  this.player2=player2;
  this.player2name=player2name;
  this.player2fleet=player2fleet;
  this.id=id;  //gameroom
  gameOver=false;
  while (gameOver===false){//hits and misses
  }
  //save results to database and then delete item from GameRoom array?
  //need to reset game if they want to play again, how to put player(s) back into waiting queue
}

GameObj.prototype.hitOrMiss = function(shotdata,shootingPlayer,targetPlayer) {
  // if firing player hit's target player's ship
  //search fleet location arrays
  //if hit, see if ship sunk
  //if sunk, see if fleet destroyed, aka game over and return winner
}

// load our server
http.listen(3000, function(){
  console.log('listening on *:3000');
});




