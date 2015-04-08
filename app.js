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
drydockA=[], 
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
  socket.join(roomNumber);
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
    waitingRoom=[];
    roomNumber++;
    playerPair=0;
  }
    

  socket.on('disconnect', function(){
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
  
  // function shipMover (playersocket,docklocation){  //DO NOT TOUCH!
  //   playersocket.on('place_ship', function(placedShipObj){  
  //     var name=placedShipObj.name;
  //     var firstLocation = placedShipObj.cell.charAt(0);
  //     var secondLocation = placedShipObj.cell.charAt(1);
  //     var rotation=placedShipObj.rotation;
  //     if (name==="AircraftCarrier"){ 
  //       var carrier=[]; 
  //       carrier[0]=placedShipObj.cell;
  //       if (rotation===0){
  //         for (var i = 0; i < 4; i++) {
  //           secondLocation++; 
  //           newloc=firstLocation+secondLocation; 
  //           carrier.push(newloc);
  //         }
  //       }
  //       if (rotation===90){
  //         for (var l = 0; l < 4; l++) {
  //           firstLocation=nextLetter(firstLocation); 
  //           newloc=firstLocation+secondLocation; 
  //           carrier.push(newloc);
  //         }
  //         console.log(carrier);
  //       }
  //       docklocation[0]=carrier;
  //     }
  //     if (name==="Battleship"){ 
  //       var battleship=[]; 
  //       battleship[0]=placedShipObj.cell;
  //       if (rotation===0){
  //         for (var j = 0; j < 3; j++) {
  //           secondLocation++;
  //           newloc=firstLocation+secondLocation; 
  //           battleship.push(newloc);
  //         }
  //       }
  //       if (rotation===90)
  //       {
  //         for (var m = 0; m < 3; m++) {
  //           firstLocation=nextLetter(firstLocation); 
  //           newloc=firstLocation+secondLocation; 
  //           battleship.push(newloc);
  //         }
  //       }
  //       docklocation[1]=battleship;
  //     }
  //     if (name==="Submarine"){ 
  //       var submarine=[]; 
  //       submarine[0]=placedShipObj.cell;
  //       if (rotation===0){
  //         for (var k = 0; k < 2; k++) {
  //           secondLocation++; 
  //           newloc=firstLocation+secondLocation; 
  //           submarine.push(newloc);
  //         }
  //       }
  //       if (rotation===90){
  //         for (var n = 0; n < 2; n++) {
  //           firstLocation=nextLetter(firstLocation); 
  //           newloc=firstLocation+secondLocation; 
  //           submarine.push(newloc);
  //         }
  //         console.log(submarine);
  //       }
  //     docklocation[2]=submarine;
  //   }
  //   if (name==="Destroyer"){ 
  //     var destroyer=[]; 
  //     destroyer[0]=placedShipObj.cell;
  //     if (rotation===0){
  //       for (var p = 0; p < 2; p++) {
  //         secondLocation++;
  //         newloc=firstLocation+secondLocation; 
  //         destroyer.push(newloc);
  //       }
  //     }
  //     if (rotation===90){
  //       for (var o = 0; o < 2; o++) {
  //         firstLocation=nextLetter(firstLocation); 
  //         newloc=firstLocation+secondLocation; 
  //         destroyer.push(newloc);
  //       }
  //       console.log(destroyer);
  //     }
  //     docklocation[3]=destroyer;
  //   }
  //   if (name==="PtBoat"){ 
  //     var ptboat=[]; 
  //     ptboat[0]=placedShipObj.cell;
  //     if (rotation===0){
  //       secondLocation++; 
  //       newloc=firstLocation+secondLocation; 
  //       ptboat.push(newloc);
  //     }
  //     if (rotation===90){
  //       firstLocation=nextLetter(firstLocation); 
  //       newloc=firstLocation+secondLocation; 
  //       ptboat.push(newloc);
  //     }
  //     docklocation[4]=ptboat;
  //   }
  // });
  // }

player1.on('place_ship', function(placedShipObj){  
      var name=placedShipObj.name;
      var firstLocation = placedShipObj.cell.charAt(0);
      var secondLocation = placedShipObj.cell.charAt(1);
      var rotation=placedShipObj.rotation;
      if (name==="AircraftCarrier"){ 
        var carrier=[]; 
        carrier[0]=placedShipObj.cell;
        if (rotation===0){
          for (var i = 0; i < 4; i++) {
            secondLocation++; 
            newloc=firstLocation+secondLocation; 
            carrier.push(newloc);
          }
        }
        if (rotation===90){
          for (var l = 0; l < 4; l++) {
            firstLocation=nextLetter(firstLocation); 
            newloc=firstLocation+secondLocation; 
            carrier.push(newloc);
          }
          console.log(carrier);
        }
        drydockA[0]=carrier;
      }
      if (name==="Battleship"){ 
        var battleship=[]; 
        battleship[0]=placedShipObj.cell;
        if (rotation===0){
          for (var j = 0; j < 3; j++) {
            secondLocation++;
            newloc=firstLocation+secondLocation; 
            battleship.push(newloc);
          }
        }
        if (rotation===90)
        {
          for (var m = 0; m < 3; m++) {
            firstLocation=nextLetter(firstLocation); 
            newloc=firstLocation+secondLocation; 
            battleship.push(newloc);
          }
        }
        drydockA[1]=battleship;
      }
      if (name==="Submarine"){ 
        var submarine=[]; 
        submarine[0]=placedShipObj.cell;
        if (rotation===0){
          for (var k = 0; k < 2; k++) {
            secondLocation++; 
            newloc=firstLocation+secondLocation; 
            submarine.push(newloc);
          }
        }
        if (rotation===90){
          for (var n = 0; n < 2; n++) {
            firstLocation=nextLetter(firstLocation); 
            newloc=firstLocation+secondLocation; 
            submarine.push(newloc);
          }
          console.log(submarine);
        }
      drydockA[2]=submarine;
    }
    if (name==="Destroyer"){ 
      var destroyer=[]; 
      destroyer[0]=placedShipObj.cell;
      if (rotation===0){
        for (var p = 0; p < 2; p++) {
          secondLocation++;
          newloc=firstLocation+secondLocation; 
          destroyer.push(newloc);
        }
      }
      if (rotation===90){
        for (var o = 0; o < 2; o++) {
          firstLocation=nextLetter(firstLocation); 
          newloc=firstLocation+secondLocation; 
          destroyer.push(newloc);
        }
        console.log(destroyer);
      }
      drydockA[3]=destroyer;
    }
    if (name==="PtBoat"){ 
      var ptboat=[]; 
      ptboat[0]=placedShipObj.cell;
      if (rotation===0){
        secondLocation++; 
        newloc=firstLocation+secondLocation; 
        ptboat.push(newloc);
      }
      if (rotation===90){
        firstLocation=nextLetter(firstLocation); 
        newloc=firstLocation+secondLocation; 
        ptboat.push(newloc);
      }
      drydockA[4]=ptboat;
    }
  });
  

player2.on('place_ship', function(placedShipObj){  
      var name=placedShipObj.name;
      var firstLocation = placedShipObj.cell.charAt(0);
      var secondLocation = placedShipObj.cell.charAt(1);
      var rotation=placedShipObj.rotation;
      if (name==="AircraftCarrier"){ 
        var carrier=[]; 
        carrier[0]=placedShipObj.cell;
        if (rotation===0){
          for (var i = 0; i < 4; i++) {
            secondLocation++; 
            newloc=firstLocation+secondLocation; 
            carrier.push(newloc);
          }
        }
        if (rotation===90){
          for (var l = 0; l < 4; l++) {
            firstLocation=nextLetter(firstLocation); 
            newloc=firstLocation+secondLocation; 
            carrier.push(newloc);
          }
          console.log(carrier);
        }
        drydockB[0]=carrier;
      }
      if (name==="Battleship"){ 
        var battleship=[]; 
        battleship[0]=placedShipObj.cell;
        if (rotation===0){
          for (var j = 0; j < 3; j++) {
            secondLocation++;
            newloc=firstLocation+secondLocation; 
            battleship.push(newloc);
          }
        }
        if (rotation===90)
        {
          for (var m = 0; m < 3; m++) {
            firstLocation=nextLetter(firstLocation); 
            newloc=firstLocation+secondLocation; 
            battleship.push(newloc);
          }
        }
        drydockB[1]=battleship;
      }
      if (name==="Submarine"){ 
        var submarine=[]; 
        submarine[0]=placedShipObj.cell;
        if (rotation===0){
          for (var k = 0; k < 2; k++) {
            secondLocation++; 
            newloc=firstLocation+secondLocation; 
            submarine.push(newloc);
          }
        }
        if (rotation===90){
          for (var n = 0; n < 2; n++) {
            firstLocation=nextLetter(firstLocation); 
            newloc=firstLocation+secondLocation; 
            submarine.push(newloc);
          }
          console.log(submarine);
        }
      drydockB[2]=submarine;
    }
    if (name==="Destroyer"){ 
      var destroyer=[]; 
      destroyer[0]=placedShipObj.cell;
      if (rotation===0){
        for (var p = 0; p < 2; p++) {
          secondLocation++;
          newloc=firstLocation+secondLocation; 
          destroyer.push(newloc);
        }
      }
      if (rotation===90){
        for (var o = 0; o < 2; o++) {
          firstLocation=nextLetter(firstLocation); 
          newloc=firstLocation+secondLocation; 
          destroyer.push(newloc);
        }
        console.log(destroyer);
      }
      drydockB[3]=destroyer;
    }
    if (name==="PtBoat"){ 
      var ptboat=[]; 
      ptboat[0]=placedShipObj.cell;
      if (rotation===0){
        secondLocation++; 
        newloc=firstLocation+secondLocation; 
        ptboat.push(newloc);
      }
      if (rotation===90){
        firstLocation=nextLetter(firstLocation); 
        newloc=firstLocation+secondLocation; 
        ptboat.push(newloc);
      }
      drydockB[4]=ptboat;
    }
  });


player1.on("game_status",function(){  //can be refactored in v2
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
  
  //these notices will go to the players upon connection, so they know who is who
  //will not have any impact, it's just a notification
 // socket.broadcast.to(player1).emit('identity',"You will be Player 1");
 // socket.broadcast.to(player2).emit('identity',"You will Player 2");

 //firing mechanism, turn controller, and game over emitter
  player1.on('shot', function(shotObj){
    if (player1turn===true){
      shotObj.player=player1.nickname;
      shotObj.hitORmiss=false;
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

function hitOrMiss(shotObj,fleet){  
  for (var i = 0; i < fleet.formation.length; i++) {  //iterates through targed fleet
    if (fleet.formation[i]!==[]){  //iterates through each non-sunk ship
      if (fleet.formation[i].indexOf(shotObj.id)!==-1){
        if(fleet.formation[i].length===1){ //last hit sinks ship
          fleet.shipcount--;
          console.log(fleet.formation[i]+" sunk at "+shotObj.id);
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

function Fleet (carrier,battleship,submarine,destroyer,ptboat){
  this.shipcount=5;
  this.formation=[carrier,battleship,submarine,destroyer,ptboat];
} 


function nextLetter(str) {
  return str.replace(/[a-j]/, function(c){
    return String.fromCharCode(c.charCodeAt(0)+1);
  });
}

} //game object ending

// load our server with port switching for local or production
http.listen((process.env.PORT || 3000), function(){
  console.log('listening on *:3000');
});