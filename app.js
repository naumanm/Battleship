// entry point when server starts

// setup env
require('dotenv').load();
var express = require('express'),
app = express(),
http = require('http').Server(app),
io = require('socket.io')(http),
redis = require("redis"),
url = require('url'),
redisURL = url.parse(process.env.REDISCLOUD_URL),
client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);
// client = redis.createClient(),
var methodOverride = require("method-override"),
roomNumber=1,
playerPair=0,
bodyParser = require("body-parser"),
waitingRoom =[], 
gameRooms=[],
drydockA=[], //have to use two to keep player ships separated until game assignment of player one and two
drydockB=[]; //at this point, before game start they are sitting in the waiting queue p1 =waitingroom[0]
// allows us to use ejs instead of html
app.set("view engine", "ejs");

console.log(process.env.REDISCLOUD_URL);

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
  socket.join(roomNumber);
  console.log(roomNumber);
  console.log(socket.id + " connected");

 // //worry about rotation when rotation event occurs 

  socket.on('playerName', function(playerName) { 
  socket.nickname=playerName;
  });
  //SAVE USERNAME FROM playername TO REDIS FOR WIN/LOSS KEEPING, ALSO SESSION KEEPING use SOCKET.ID FOR THAT PART
  //client.HSETNX("playersName", socket.id, socket.id);  //this is the socket has not the actual user name
  //client.HSETNX("gameIDs", socket.id, socket.id);  //connecting the first player as a game id ref point -
  waitingRoom.push(socket);
  playerPair++;
  //assign a game, roomNumber, and reset queue when two players are in the waiting room
  if (playerPair===2){
    //client.HSETNX("opponent", socket.id, socket.id);  ? will we still need this...since player is being saved above as a player with session?
    // in case line above doesn't work client.HSETNX("opponent", gameObj.playerID, gameObj.opponentID); 
    gameRooms.push(new Game(waitingRoom[0],waitingRoom[1],roomNumber,drydockA,drydockB));
    waitingRoom=[];
    roomNumber++;
    playerPair=0;
  }

  socket.on('disconnect', function(){
    console.log(socket.id + " disconnected");            
  });

});

//game logic 
function Game (player1,player2,gameId,player1Fleet,player2Fleet){  
  //NEED TO EMIT TO BOTH THAT GAME HAS STARTED AND NEED TO LOCK DOWN DRAGABLE
  //have to handle game over
  //game_status is true if player clicked "Ready To Play" button
  //game_status is false if player clicked "Surrender" button
// socket.on('game_status', function(game_status){
  // gameOver = true;
// });
  this.player1=player1;
  this.player2=player2;
  this.player1Fleet=player1Fleet;
  this.player2Fleet=player2Fleet;
  this.gameId=gameId;  //gameroom
  gameOver=false;
  readyCount=0;
  readyToPlay=false;
  console.log(gameId + " game id");
  console.log("matchmaking complete, watiing for player ready and ship lockdown");
  turnResult=false;
  
  player1.on('place_ship', function(placedShipObj){
    var name=placedShipObj.name;
    var firstLocation = placedShipObj.location.charAt(0);
    var secondLocation = placedShipObj.location.charAt(1);
    if (name==="AircraftCarrier"){
      //if (placedShipObj.rotation===0){
        var carrier =[placedShipObj.location];
        for (var i = 0; i < 5; i++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          carrier.push(newloc);
        }
   //  } 
        drydockA[0]=carrier;
    }
    if (name==="Battleship"){
       var battleship =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var h = 0; h < 4; h++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          battleship.push(newloc);
        }
      // } 
        drydockA[1]=battleship;
    }
    if (name==="Submarine"){
      var submarine =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var j = 0; j < 2; j++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          submarine.push(newloc);
        }
     //}

        drydockA[2]=submarine;
    }
    if (name==="Destroyer"){
       var destroyer =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var k = 0; k < 2; k++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          destroyer.push(newloc);
        }
      //}  
        drydockA[3]=destroyer;
    }
    if (name==="PtBoat"){
       //if (placedShipObj.rotation===0){
       var ptboat =[placedShipObj.location];
       secondLocation++; //increments the location of the 2nd letter of the coordinate
       newloc=firstLocation+secondLocation; //concat as a string thanks javascript
       ptboat.push(newloc);
    // }
        drydockA[4]=ptboat;
    }
  });
   //refactor into a function, along with some of the items within.
  player2.on('place_ship', function(placedShipObj){
    var name=placedShipObj.name;
    var firstLocation = placedShipObj.location.charAt(0);
    var secondLocation = placedShipObj.location.charAt(1);
    if (name==="AircraftCarrier"){
      //if (placedShipObj.rotation===0){
        var carrier =[placedShipObj.location];
        for (var i = 0; i < 5; i++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          carrier.push(newloc);
        }
   //  } 
        drydockB[0]=carrier;
    }
    if (name==="Battleship"){
       var battleship =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var h = 0; h < 4; h++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          battleship.push(newloc);
        }
      // } 
        drydockB[1]=battleship;
    }
    if (name==="Submarine"){
      var submarine =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var j = 0; j < 2; j++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          submarine.push(newloc);
        }
     //}
        drydockB[2]=submarine;
    }
    if (name==="Destroyer"){
       var destroyer =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var k = 0; k < 2; k++) {
          secondLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          destroyer.push(newloc);
        }
      //}  
        drydockB[3]=destroyer;
    }
    if (name==="PtBoat"){
       //if (placedShipObj.rotation===0){
       var ptboat =[placedShipObj.location];
       secondLocation++; //increments the location of the 2nd letter of the coordinate
       newloc=firstLocation+secondLocation; //concat as a string thanks javascript
       ptboat.push(newloc);
    // }
        drydockB[4]=ptboat;
    }
  });

  player1.on("game_status",function(){
    readyCount++;
    console.log("player1 is ready");
    console.log(player1Fleet);
    console.log(readyCount);
  });

  player2.on("game_status", function(){
    readyCount++;
    console.log("player2 is ready");
    console.log(player2Fleet);
    console.log(readyCount);
  });
  
  //make sure that the fleets are ready for firing
  if (readyCount===2){
    if ((player1Fleet || player2Fleet) ===[]){
    console.log("game not ready");
    // io.emit('shot',"Please Confirm Readiness by Clicking ready to play, thank you!"); 
    //need event to tell client to reclick ready button
    } 
    else readyToPlay=true;
  }

  if(readyToPlay===true){
    console.log("Player 1 Start!");
    var turnController=1;
    if (turnController%2 !==0) 
    {
      // player1.emit('shot',"your turn, player1"); //need an event on client side to announce turn
      console.log("move# "+ turnController);
      player1.on('shot', function(shotObj){  
      console.log(shotObj.id); 
      io.emit('shot', shotObj);
      hitOrMiss(shotObj.id,player2Fleet.carrier,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.battleship,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.submarine,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.ptboat,player2Fleet);
      hitOrMiss(shotObj.id,player1Fleet.destroyer,player1Fleet);
      if (turnResult===true)
        io.emit('shot',"Hit!");
      turnResult=false;
      turnController++;
      }); 
    }
    else
    { 
      // player2.emit('shot',"your turn, player2"); need an event to announe to player that it's their turn
      console.log("move# "+ turnController);
      player2.on('shot', function(shotObj){  //#step 3 firing a shot in the game
      console.log(shotObj.id); //this is the actual targeted square, but will have to 'stringify'
      io.emit('shot', shotObj); 
      hitOrMiss(shotObj.id,player1Fleet.carrier,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.battleship,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.submarine,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.ptboat,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.destroyer,player1Fleet);
      if (turnResult===true)
      // io.emit('hit_confirmation',"Hit! at "+shot.obj); //some client event needed for announcing shot hits
      turnResult=false;
      turnController++;
     });  
    }
   } 
}

function hitOrMiss(shotObj,ship,fleet){  
  var hitFinder;
  if (ship!==[]){
    if (ship.indexOf(shotObj)!==-1){
      if(ship.length===1){ //last hit sinks ship
        fleet.shipcount--;
      }
      hitFinder=ship.indexOf(shotObj);
      ship.splice(hitFinder,1); //removes from ship's working "length"
    }
  }
}

function Fleet (carrier,battleship,submarine,destroyer,ptboat){
  this.carrier=carrier;
  this.battleship=battleship;
  this.submarine=submarine;
  this.destroyer=destroyer;
  this.ptboat=ptboat;
  this.shipcount=5;
} 
//use for vertical code 

function LetterChanges(str) {
    return str.replace(/[a-j]/, function(c){
        return String.fromCharCode(c.charCodeAt(0)+1);
    });
}


// load our server with port switching for local or production
http.listen((process.env.PORT || 3000), function(){
  console.log('listening on *:3000');
});
