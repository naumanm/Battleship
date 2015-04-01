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

  //ship placement befor game launch handler for horizontal based ships
  socket.on('place_ship', function(placedShipObj){
    var name=placedShipObj.name;
    var firstLocation = placedShipObj.location.charAt(0);
    var secondLocation = placedShipObj.location.charAt(1);
    if (name==="AircraftCarrier"){
      //if (placedShipObj.rotation===0){
        var carrier =[placedShipObj.location];
        for (var i = 0; i < 5; i++) {
          firstLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          carrier.push(newloc);
        }
   //  } 
      if (socket===waitingRoom[0]){ //making sure the boat matches the correct watiing room player...
        drydockA[0]=carrier;
       }
        else{
          drydockB[0]=carrier;
       } 
    }
    if (name==="Battleship"){
       var battleship =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var h = 0; h < 4; h++) {
          firstLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          battleship.push(newloc);
        }
      // } 
       if (socket===waitingRoom[0]){ //making sure the boat matches the correct watiing room player...
        drydockA[1]=battleship;
       }
        else{
          drydockB[1]=battleship;
       } 
    }
    if (name==="Submarine"){
      var submarine =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var j = 0; j < 2; j++) {
          firstLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          submarine.push(newloc);
        }
     //}
       if (socket===waitingRoom[0]){ //making sure the boat matches the correct watiing room player...
        drydockA[2]=submarine;
       }
        else{
          drydockB[2]=submarine;
       } 
    }
    if (name==="Destroyer"){
       var destroyer =[placedShipObj.location];
       //if (placedShipObj.rotation===0){
        for (var k = 0; k < 2; k++) {
          firstLocation++; //increments the location of the 2nd letter of the coordinate
          newloc=firstLocation+secondLocation; //concat as a string thanks javascript
          destroyer.push(newloc);
        }
      //}  
       if (socket===waitingRoom[0]){ //making sure the boat matches the correct watiing room player...
        drydockA[3]=destroyer;
       }
        else{
          drydockB[3]=destroyer;
       } 
    }
    if (name==="PtBoat"){
       //if (placedShipObj.rotation===0){
       var ptboat =[placedShipObj.location];
       firstLocation++; //increments the location of the 2nd letter of the coordinate
       newloc=firstLocation+secondLocation; //concat as a string thanks javascript
       ptboat.push(newloc);
    // }
       if (socket===waitingRoom[0]){ //making sure the boat matches the correct watiing room player...
        drydockA[4]=ptboat;
       }
        else{
        drydockB[4]=ptboat;
       } 
    }
  });

 //worry about rotation when rotation event occurs 

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

//game logic step 2(A) building the board
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
  console.log(player1Fleet);
  console.log(player2Fleet);
  turnResult=false;
  
  player1.on("game_status",function(){
    readyCount++;
    console.log("player1 is ready");
  });

  player2.on("game_status", function(){
    readyCount++;
    console.log("player2 is ready");
  });

  if (readyCount===2){
    readyToPlay=true;
  }

  if(readyToPlay===true){
    console.log("Player 1 Start!");
    var turnController=1;
    if (turnController%2 !==0) 
    {
      console.log("move# "+ turnController);
      player1.on('shot', function(shotObj){  
      console.log(shotObj.id); 
      io.emit('shot', shotObj);
      //need to add flash event for player click while not their turn
      //need to disable other person's ability to shoot when not their turn
      //ugly but...
      hitOrMiss(shotObj.id,player2Fleet.carrier,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.battleship,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.submarine,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.ptboat,player2Fleet);
      hitOrMiss(shotObj.id,player1Fleet.destroyer,player1Fleet);
      if (turnResult===true)
        io.emit("Hit!");
      turnController++;
      }); 
    }
    else
    {
      console.log("move# "+ turnController);
      player2.on('shot', function(shotObj){  //#step 3 firing a shot in the game
      console.log(shotObj.id); //this is the actual targeted square, but will have to 'stringify'
      io.emit('shot', shotObj); 
      //need to add flash event for player click while not their turn
      //need to disable other person's ability to shoot when not their turn
      //ugly but...
      hitOrMiss(shotObj.id,player1Fleet.carrier,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.battleship,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.submarine,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.ptboat,player1Fleet);
      hitOrMiss(shotObj.id,player1Fleet.destroyer,player1Fleet);
      if (turnResult===true)
        io.emit("Hit!");
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
        io.emit('shot',ship+" Sunk");
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
