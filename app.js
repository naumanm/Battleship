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
io.on('connection', function(socket){  //step #1 connection
  socket.join(roomNumber);
  console.log(roomNumber);
  
  console.log('a user connected');

  socket.on('playerName', function(playerName) {  //step # building a lobby
    socket.nickname=playerName;
    client.HSETNX("playersName", socket.id, socket.id);  //this is the socket has not the actual user name
    //unsure of the use of this, as this is maintained by the game object and socket io room, which is temporary
    client.HSETNX("gameIDs", socket.id, socket.id);  //connecting the first player as a game id ref point
    waitingRoom.push(socket.id); //need to save in session as value with nickname as key for reconnect?
    playerPair++;
    //assign a game, roomNumber, and reset queue when two players are in the waiting room
    if (playerPair===2){
      client.HSETNX("opponent", socket.id, socket.id);
      // in case line above doesn't work client.HSETNX("opponent", gameObj.playerID, gameObj.opponentID); 
      gameRooms.push(GameObj.new(waitingRoom[0],waitingRoom[1],roomNumber));
     // gameRooms[length-1].runGame(); //starts the game DO NOT DELETE, CAN'T ACTIVATE YET
      waitingRoom=[];
      roomNumber++;
      playerPair=0;
    }
  });
  
  //ORIGINAL SHOT FUNCTION KEEP THIS 
  // socket.on('shot', function(shotObj){  //#step 3 firing a shot in the game
  //   io.emit('shot', shotObj); 
  //   //needs to merge with shot html route
  //   console.log(shotObj);
  // });

  socket.on('disconnect', function(){
    console.log(socket.nickname + " disconnected");
    if (!socket.nickname) return;              
  });
  
});

//game logic step 2(A) building the board
function Game (player1,player2,player1Name,player2Name,gameId){  
  this.player1=player1;  //socket
  this.player1Fleet=[]; //not exactly sure how to handle this, depends on how data is passed
  //after set up of ships how to handle ship coordinates
  this.player2=player2;
  this.player2Fleet=[];//not exactly sure how to handle this, depends on how data is passed
  //after set up of ships
  this.gameId=gameId;  //gameroom
  gameOver=false;
  turnController=1;
  if (turnController%2===0)
   {
    player1.on('shot', function(shotObj){  //#step 3 firing a shot in the game
      io.emit('shot', shotObj); 
      //need to add flash event for player click while not their turn
      console.log("player 1 shot"+shotObj);
      turnController++;
    });
    this.hitOrMiss(shotObj,this.player2Fleet);
   }
    else  //refactor into recursively switching firecontroller function
   {
    player2.on('shot', function(shotObj){  //#step 3 firing a shot in the game
     io.emit('shot', shotObj); 
     //need to add flash event for player click while not their turn
     console.log("player 1 shot"+shotObj);
      turnController++;
    });
     this.hitOrMiss(shotObj,this.player1Fleet);
   }
  }

//step 3(A) firing and turn switching
Game.prototype.hitOrMiss = function(shotObj,targetPlayerFleet) {  //what is in shotObj
 //this has to control what to listen to in the shot event on socket.io
}

//game controller
Game.prototype.runGame = function(){
  while (this.gameOver===false){
    this.hitOrMiss();
  }
}

function Ship (location){
 this.location=[]
}

// load our server
http.listen(3000, function(){
  console.log('listening on *:3000');
});




