// entry point when server starts

// setup env
require('dotenv').load();
var express = require('express'),
app = express(),
http = require('http').Server(app),
io = require('socket.io')(http),
//redis = require("redis"),
//url = require('url'),
//redisURL = url.parse(process.env.REDISCLOUD_URL),
//client = redis.createClient(),
methodOverride = require("method-override"),
roomNumber=1,
playerPair=0,
bodyParser = require("body-parser"),
waitingRoom =[], 
controller, //for turns
gameRooms=[],
drydockA=[],   //ship placeholders
drydockB=[]; 
// allows us to use ejs instead of html
app.set("view engine", "ejs");

//client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
//client.auth(redisURL.auth.split(":")[1]);

//console.log(process.env.REDISCLOUD_URL);

// more middleware  Christian added this... found in my class examples... do we need? body parser to get the player's name from the form withing the modal. method override for the routes that add to redis. wondering about this one since we already are emitting the moves, I'm thinking the controller would handle the action based on that.
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method')); // probably not needed.

// location for static files
app.use(express.static(__dirname + '/public'));

// root route
app.get('/', function(req, res){
  res.render("index.ejs");
});

// about us route
app.get('/about', function(req, res){
  res.render("about.ejs");
});

// game instructions route
app.get('/instructions', function(req, res){
  res.render("instructions.ejs");
});

// game communication. ALL game emit events need to be handled within this block
io.on('connection', function(socket){  //step #1 connection
  socket.join(roomNumber);  //each game gets a room 
  console.log(roomNumber);
  console.log(socket.id + " connected");
 
  socket.on('playerName', function(playerName) { 
    socket.nickname=playerName;
  });
  //SAVE USERNAME FROM playername TO REDIS FOR WIN/LOSS KEEPING, ALSO SESSION KEEPING use SOCKET.ID FOR THAT PART
  //client.HSETNX("playersName", socket.id, socket.id);  //this is the socket has not the actual user name
  //client.HSETNX("gameIDs", socket.id, socket.id);  //connecting the first player as a game id ref point 
  waitingRoom.push(socket);
  playerPair++;
  //assign a game, roomNumber, and reset queue when two players are in the waiting room
  if (playerPair===2){
    //client.HSETNX("opponent", socket.id, socket.id);  ? will we still need this...since player is being saved above as a player with session?
    // in case line above doesn't work client.HSETNX("opponent", gameObj.playerID, gameObj.opponentID); 
    
    gameRooms.push(new Game(waitingRoom[0],waitingRoom[1],roomNumber));
    waitingRoom=[];   //outside of the game object, socket controller is ready to add more players
    roomNumber++;
    playerPair=0;
  }
    
  socket.on('disconnect', function(){   //disconnections for outside of "game"
    console.log(socket.id + " disconnected");            
  });

});

//game logic 
function Game (player1,player2,gameId){  
  //Game Setup
  this.player1=player1;
  this.player2=player2;
  this.gameId=gameId;  //gameroom
  var gameOver={},
  player1ReadyStatus=false,
  player2ReadyStatus=false,
  readyToPlay=false,
  player1turn=false,
  player2turn=false;
  console.log(gameId + " game #");
  console.log("matchmaking complete, waiting for player ready and ship lockdown");
  
player1.on('place_ship', function(placedShipObj){  
  var name=placedShipObj.name;      //dropped ships from client
  var firstLocation = placedShipObj.cell.charAt(0);
  var secondLocation = placedShipObj.cell.charAt(1);
  var rotation=placedShipObj.rotation;
  switch(name){   //location calculated based on which ship and rotation
    case "AircraftCarrier":
      buildCarrier(placedShipObj,rotation,drydockA,firstLocation,secondLocation);
      break;
    case "Battleship":
      buildBattleship(placedShipObj,rotation,drydockA,firstLocation,secondLocation);
      break;
    case "Submarine": 
      buildSubmarine(placedShipObj,rotation,drydockA,firstLocation,secondLocation);
      break;
    case "Destroyer":
      buildDestroyer(placedShipObj,rotation,drydockA,firstLocation,secondLocation);
      break;
    case "PtBoat": 
      buildPtBoat(placedShipObj,rotation,drydockA,firstLocation,secondLocation);
      break;
  }
});
  
player2.on('place_ship', function(placedShipObj){  
  var name=placedShipObj.name;
  var firstLocation = placedShipObj.cell.charAt(0);
  var secondLocation = placedShipObj.cell.charAt(1);
  var rotation=placedShipObj.rotation;
  switch(name){
    case "AircraftCarrier":
      buildCarrier(placedShipObj,rotation,drydockB,firstLocation,secondLocation);
      break;
    case "Battleship":
      buildBattleship(placedShipObj,rotation,drydockB,firstLocation,secondLocation);
      break;
    case "Submarine": 
      buildSubmarine(placedShipObj,rotation,drydockB,firstLocation,secondLocation);
      break;
    case "Destroyer":
      buildDestroyer(placedShipObj,rotation,drydockB,firstLocation,secondLocation);
      break;
    case "PtBoat": 
      buildPtBoat(placedShipObj,rotation,drydockB,firstLocation,secondLocation);
      break;
  }
});

//game setup for gameboard logic
player1.on("game_status",function(){  
  if(drydockA.length===5){
    player1ReadyStatus=true;    
    player1Fleet = new Fleet(drydockA[0],drydockA[1],drydockA[2],drydockA[3],drydockA[4]);
    console.log(player1Fleet);
    console.log("player1 "+player1.nickname+" is ready");
  }
});

player2.on("game_status", function(){
  if(drydockB.length===5){
    player2ReadyStatus=true;
    player2Fleet = new Fleet(drydockB[0],drydockB[1],drydockB[2],drydockB[3],drydockB[4]);
    console.log(player2Fleet);
    console.log("player2"+ player2.nickname+" is ready");
    player1turn=true;  //activating turn switch mechanism
    controller=true;
    player1.emit('turn',controller);
  }
});
  
 //firing mechanism, turn controller, and game over emitter
  player1.on('shot', function(shotObj){
    if (player1turn===true){
      shotObj.player=player1.nickname;
      shotObj.hitORmiss=false;
      shotObj.sunk=null;
      hitOrMiss(shotObj,player2Fleet);
      io.emit('shot',shotObj);
      endGameCheck(player2Fleet,player1,player2);
      controller=false;
      player1.emit('turn',controller);
      controller=true;
      player2.emit('turn',controller);
      player1turn=false;  //switching turn 'receptor' on server, now waiting for client
      player2turn=true;
    }
  });

  player2.on('shot', function(shotObj){  
    if (player2turn===true){
      shotObj.player=player2.nickname;
      shotObj.hitORmiss=false;
      shotObj.sunk=null;
      hitOrMiss(shotObj,player1Fleet);
      io.emit('shot',shotObj);
      endGameCheck(player1Fleet,player2,player1);
      controller=true;
      player1.emit('turn',controller);
      controller=false;
      player2.emit('turn',controller);
      player1turn=true;  //switching turn info to server, now waiting for client
      player2turn=false;
    }
  }); 

//game is dependent on the following functions
function hitOrMiss(shotObj,fleet){  
  for (var i = 0; i < fleet.formation.length; i++) {  //iterates through targed fleet
    if (fleet.formation[i]!==[]){  //iterates through each non-sunk ship
      if (fleet.formation[i].indexOf(shotObj.id)!==-1){
        if(fleet.formation[i].length===1){ //last hit sinks ship
          fleet.shipcount--;
          shotObj.sunk=fleet.names[fleet.formation.indexOf(fleet.formation[i])]; //which ship is sunk
          console.log(shotObj.sunk+" sunk at "+shotObj.id);
        }
        hitFinder=fleet.formation[i].indexOf(shotObj.id);
        fleet.formation[i].splice(hitFinder,1); //removes from ship's working "length"
        shotObj.hitORmiss=true;
        console.log("hit detected at "+ shotObj.id); 
      }
    }
  }
}

function endGameCheck(targetedFleet,shooter,target){
  if(targetedFleet.shipcount===0){
        gameOver.result=true;
        gameOver.winner=shooter.nickname;
        gameOver.loser=target.nickname;
        io.emit("game_status",gameOver);
      }
}
//used for determining what got sank and for hit/miss
function Fleet (carrier,battleship,submarine,destroyer,ptboat){
  this.shipcount=5;
  this.names=["Carrier","Battleship","Submarine","Destroyer","PT Boat"];
  this.formation=[carrier,battleship,submarine,destroyer,ptboat];
} 

//assists with vertical adjustments by droppable ships
function nextLetter(str) {
  return str.replace(/[a-j]/, function(c){
    return String.fromCharCode(c.charCodeAt(0)+1);
  });
}

//ship builder functions, sligthly different depending on class of ship
function buildCarrier(shipStart,rotation,docklocation,first,second){
  var carrier=[];             //ship 'container'
  var newloc; //where the next coordinates will go
  carrier[0]=shipStart.cell;   //first cell from clientside
  if (rotation===0){       //fill out of ship coords if horizontal
    for (var i = 0; i < 4; i++) {
      second++; 
      newloc=first+second; 
      carrier.push(newloc);
    }
  }
  if (rotation===90){   //vertical handling
    for (var j = 0; j < 4; j++) {
      first=nextLetter(first); 
      newloc=first+second; 
      carrier.push(newloc);
    }
  }
  docklocation[0]= carrier;   //placing completed ship in correct drydocklocation
}

function buildBattleship(shipStart,rotation,docklocation,first,second){
  var battleship=[];             //ship 'container'
  var newloc;
  battleship[0]=shipStart.cell;   //first cell from clientside
  if (rotation===0){       //fill out of ship coords if horizontal
    for (var i = 0; i < 3; i++) {
      second++; 
      newloc=first+second; 
      battleship.push(newloc);
    }
  }
  if (rotation===90){   //vertical handling
    for (var j = 0; j < 3; j++) {
      first=nextLetter(first); 
      newloc=first+second; 
      battleship.push(newloc);
    }
  }
  docklocation[1]= battleship;   //placing completed ship in correct drydocklocation
}

function buildSubmarine(shipStart,rotation,docklocation,first,second){
  var submarine=[];             //ship 'container'
  var newloc;
  submarine[0]=shipStart.cell;   //first cell from clientside
  if (rotation===0){       //fill out of ship coords if horizontal
    for (var i = 0; i < 2; i++) {
      second++; 
      newloc=first+second; 
      submarine.push(newloc);
    }
  }
  if (rotation===90){   //vertical handling
    for (var j = 0; j < 2; j++) {
      first=nextLetter(first); 
      newloc=first+second; 
      submarine.push(newloc);
    }
  }
  docklocation[2]= submarine;   //placing completed ship in correct drydocklocation
}

function buildDestroyer(shipStart,rotation,docklocation,first,second){
  var destroyer=[];             //ship 'container'
  var newloc;
  destroyer[0]=shipStart.cell;   //first cell from clientside
  if (rotation===0){       //fill out of ship coords if horizontal
    for (var i = 0; i < 2; i++) {
      second++; 
      newloc=first+second; 
      destroyer.push(newloc);
    }
  }
  if (rotation===90){   //vertical handling
    for (var j = 0; j < 2; j++) {
      first=nextLetter(first); 
      newloc=first+second; 
      destroyer.push(newloc);
    }
  }
  docklocation[3]= destroyer;   //placing completed ship in correct drydocklocation
}

function buildPtBoat(shipStart,rotation,docklocation,first,second){
  var ptboat=[];             //ship 'container'
  var newloc;
  ptboat[0]=shipStart.cell;   //first cell from clientside
  if (rotation===0){       //fill out of ship coords if horizontal
      second++; 
      newloc=first+second; 
      ptboat.push(newloc);
  }
  if (rotation===90){   //vertical handling
      first=nextLetter(first); 
      newloc=first+second; 
      ptboat.push(newloc);
  }
  docklocation[4]= ptboat;   //placing completed ship in correct drydocklocation
}

//game over in case of accidental disconnect
player1.on('disconnect', function(){
        gameOver.result=true;
        gameOver.winner="You";
        gameOver.loser="Disconnected";
        io.emit("game_status",gameOver);
});

player2.on('disconnect', function(){
        gameOver.result=true;
        gameOver.winner="You";
        gameOver.loser="Disconnected";
        io.emit("game_status",gameOver);
});


} //game object ending

// load our server with port switching for local or production
http.listen((process.env.PORT || 3000), function(){
  console.log('listening on *:3000');
});