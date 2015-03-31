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

// player's name route
app.get('/player', function(req, res){
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
io.on('connection', function(socket){  //step #1 connection
  socket.join(roomNumber);
  console.log(roomNumber);
  console.log(socket.id + " connected");

  //socket.on('playerName', function(playerName) {  //step # building a lobby
    socket.nickname=socket.id; 
    console.log(socket.id);//change to player name once modal is working correctly
    //client.HSETNX("playersName", socket.id, socket.id);  //this is the socket has not the actual user name
    //unsure of the use of this, as this is maintained by the game object and socket io room, which is temporary
    //client.HSETNX("gameIDs", socket.id, socket.id);  //connecting the first player as a game id ref point
    waitingRoom.push(socket); //need to save in session as value with nickname as key for reconnect?
    playerPair++;
    //assign a game, roomNumber, and reset queue when two players are in the waiting room
    if (playerPair===2){
      //client.HSETNX("opponent", socket.id, socket.id);
      // in case line above doesn't work client.HSETNX("opponent", gameObj.playerID, gameObj.opponentID); 
      gameRooms.push(new Game(waitingRoom[0],waitingRoom[1],roomNumber));
      waitingRoom=[];
      roomNumber++;
      playerPair=0;
    }

  //});
  
  //ORIGINAL SHOT FUNCTION KEEP THIS 
  // socket.on('shot', function(shotObj){  //#step 3 firing a shot in the game
  //   io.emit('shot', shotObj); 
  //   //needs to merge with shot html route
  //   console.log(shotObj);
  // });

  socket.on('disconnect', function(){
    console.log(socket.id + " disconnected");
    //if (!socket.nickname) return;              
  });
  
});

//game logic step 2(A) building the board
function Game (player1,player2,gameId){  
  this.player1=player1;
  console.log(player1 + "player 1");
  this.player2=player2;
  console.log(player2 +"player2");
  this.gameId=gameId;  //gameroom
  console.log(gameId + "game id");
  gameOver=false;
  //dummy data
  var player1Fleet=new Fleet(player1,["a1","a2","a3","a4","a5"],["b1","b2","b3","b4"],["c1","c2","c3"],["d1","d2"]);
  var player2Fleet=new Fleet(player2,["a1","a2","a3","a4","a5"],["b1","b2","b3","b4"],["c1","c2","c3"],["d1","d2"]);
  //keep this for live play, seeding dummy test fire data
  // player1.on('fleetReady',function(data){
  //    carrier=[]; //get this from client end hard code test
  //    battle=[];
  //    sub=[];
  //    pt =[];
  //    var player1Fleet = newFleet(carrier,battle,sub,pt); 
  //  });
  // player2.on('fleetReady',function(data){
  //    carrier=[]; //get this from client end hard code test
  //    battle=[];
  //    sub=[];
  //    pt =[];
  //    var player2Fleet = newFleet(carrier,battle,sub,pt); 
  //  }); 
  turnController=1;
  console.log("move# " + turnController);
  if (!turnController%2===0)
   {
    player1.on('shot', function(shotObj){  //#step 3 firing a shot in the game
      io.emit('shot', shotObj); 
      //need to add flash event for player click while not their turn
      console.log("player 1 shot"+shotObj);
      turnController++;
      console.log("move# "+ turnController);
    });
    this.hitOrMiss(shotObj,this.player2Fleet);
   }
    else
   {
    player2 .socket.on('shot', function(shotObj){  //#step 3 firing a shot in the game
     io.emit('shot', shotObj); 
     //need to add flash event for player click while not their turn
     console.log("player 1 shot"+shotObj);
     turnController++;
     console.log("move# "+ turnController);
    });
     this.hitOrMiss(shotObj,this.player1Fleet);
   }
  }

//step 3(A) firing and turn switching
Game.prototype.hitOrMiss = function(shotObj,targetPlayerFleet) {  
  //is there a hit
  targetPlayerFleet.formation.forEach(ship,function(shotobj){
     if(ship.indexOf(shotObj)===true){
       ship.pop(shotObj); //removes from ship's working "length"
       console.log("hit detected at"+shotObj); //add broadcasting capability
        if (ship===[]){
          console.log("ship sunk"); //add broadcasting capability
          targetPlayerFleet.shipcount--;
            if (targetPlayerFleet.shipcount===0){
              console.log("gameOver");
              return;
            }
        }
     }
   });
};

function Fleet (owner,carrier,battleship,submarine,ptboat){
  this.owner=owner; //socket who placed ship
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




