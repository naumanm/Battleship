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
  //PUT PRE GAME SHIP HANDLER HERE?
  socket.on('playerName', function(playerName) {  //step # building a lobby
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
    gameRooms.push(new Game(waitingRoom[0],waitingRoom[1],roomNumber));
    waitingRoom=[];
    roomNumber++;
    playerPair=0;
  }

  socket.on('disconnect', function(){
    console.log(socket.id + " disconnected");
    //need to add session for reconnection             
  });

});  

//game logic step 2(A) building the board
function Game (player1,player2,gameId){  
  //NEED TO EMIT TO BOTH THAT GAME HAS STARTED AND NEED TO LOCK DOWN DRAGABLE

  this.player1=player1;
  this.player2=player2;
  this.gameId=gameId;  //gameroom
  console.log(gameId + " game id");
  gameOver=false;
  var hitFinder;
  var turnController=1;
  //dummy data
  var player1Fleet = new Fleet(["a1","a2","a3","a4","a5"],["b1","b2","b3","b4"],["c1","c2","c3"],["d1","d2"]);
  var player2Fleet = new Fleet(["a1","a2","a3","a4","a5"],["b1","b2","b3","b4"],["c1","c2","c3"],["d1","d2"]);
  //keep this for live play, seeding dummy test fire data
  // player1.on('place_ship',function(data){
  //console.log("placedShipObj", placedShipObj);    
  //    carrier=[]; 
  //    battle=[];
  //    sub=[];
  //    pt =[];
  //    var player1Fleet = newFleet(carrier,battle,sub,pt); 
  //  });
  // player2.on('place_ship',function(data){
  // console.log("placedShipObj", placedShipObj);   
  //    carrier=[]; //get this from client end hard code test
  //    battle=[];
  //    sub=[];
  //    pt =[];
  //    var player2Fleet = newFleet(carrier,battle,sub,pt); 
  //  }); 
  if (!turnController%2===0)
  {
    console.log("move# "+ turnController);
    player1.on('shot', function(shotObj){  //#step 3 firing a shot in the game
      console.log(shotObj.id); //this is the actual targeted square, but will have to 'stringify'
      io.emit('shot', shotObj); 
      //need to add flash event for player click while not their turn
      //need to disable other person's ability to shoot when not their turn
      //ugly but...
      hitOrMiss(shotObj.id,player2Fleet.carrier,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.battleship,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.submarine,player2Fleet);
      hitOrMiss(shotObj.id,player2Fleet.ptboat,player2Fleet);
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
     turnController++;
    });  
  }
}

function hitOrMiss(shotObj,ship,fleet){  
  if (ship!==[]){
    if (ship.indexOf(shotObj)!==-1){
      if(ship.length===1){ //last hit sinks ship
        fleet.shipcount--;
        io.emit(ship+"sunk at"+shotObj);
        console.log(ship+" sunk at "+shotObj);
        if(fleet.shipcount===0)
        {
         console.log("gameover"); //need to add game over functionality
        }
      }
      hitFinder=ship.indexOf(shotObj);
      ship.splice(hitFinder,1); //removes from ship's working "length"
      io.emit("Hit detected at "+shotObj);
      console.log("hit detected at "+ shotObj);
      console.log(ship);
    }
  }
}

function Fleet (carrier,battleship,submarine,ptboat){
  this.carrier=carrier;
  this.battleship=battleship;
  this.submarine=submarine;
  this.ptboat=ptboat;
  this.shipcount=4;
} 

// load our server
http.listen(3000, function(){
  console.log('listening on *:3000');
});




