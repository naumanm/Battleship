$(document).ready(function(){

  // initialize socket.io
  var socket = io();

  // for dragging and dropping ships
  var placedShipObj = {
    rotation: 0
  };

  // stores all the game data for the client
  var gameObj = {
    AircraftCarrier: {
      name: "AircraftCarrier",
      cellId:  "",
      rotation: 0
      },
    Battleship: {
      name: "Battleship",
      cellId:  "",
      rotation: 0
      },
    Destroyer: {
      name: "Destroyer",
      cellId:  "",
      rotation: 0
      },
    Submarine: {
      name: "Submarine",
      cellId:  "",
      rotation: 0
      },
    PtBoat: {
      name: "PtBoat",
      cellId:  "",
      rotation: 0
      },
    playerName: "",
    opponentName: "",
    player1: false,
    signedIn: false,
    shipsPlaced: false,
    gameReady: false,
    readyToPlay: false,
    gameStarted: false,
    isTurn: false,
    controllerIndex: 0
  };

  // player login

  // set classes for css
  $("#readyToPlayButton").css("visibility","visible");
  $("#placeShips").css("visibility","visible");

  // show sign in modal
  $('#playerSignIn').on('shown.bs.modal', function () {
      $('#personsName').focus();
  });

  // enter player name
  $( "#personsName" ).keyup(function() {
      gameObj.playerName = $('#personsName').val();
      $( "#userName" ).text( "Hello " + gameObj.playerName );
  }).keyup();

  // hides the get player's name modal
  $('form').submit(function(e){
    e.preventDefault();
    $('#playerSignIn').modal('hide'); 
    gameObj.signedIn = true;
    console.log("test " + gameObj.playerName);
    socket.emit('playerName', gameObj.playerName );
    return gameObj.playerName;
  });

  // shows the get player's name modal
  var isNameEmpty = function(a){  
    $('#playerSignIn').modal('show'); 
  }();

  function gamePlay(){

    var selectedArr = selectedArr || []; // array of all shots

    // catch turn emits from server
    socket.on('turn', function(controller){ 
      if (gameObj.controllerIndex === 0){
        if (gameObj.readyToPlay){
          document.getElementById("userName").innerHTML =  "FIRE " + gameObj.playerName + "!";
        } else {
          document.getElementById("userName").innerHTML =  "Place your ships...";
        }
      }

      // sets gameObj.isTurn for game flow based on controller
      if (controller===true){
        gameObj.controllerIndex++;
        gameObj.isTurn = true;
      } else {
        gameObj.isTurn = false;
      }
    });

    // color change on hover
    $("td").mouseover(function(){
      var cellState = $(this).data("state");
      var cellId = $(this).data("id");
      var cellTable = $(this).closest("table").attr("class");
      console.log("isTurn = " + gameObj.isTurn);
      if (gameObj.isTurn){
        if (cellId !== "header" && cellState === "unselected" && cellTable === "opponent") {
          $(this).css("background-color", "red");
        }
      }
    }); 

    // revert color if not clicked
    $("td").mouseleave(function(){
      var cellState = $(this).data("state");
      var cellTable = $(this).closest("table").attr("class");
      if (gameObj.isTurn){
        if (cellState === "unselected" && cellTable === "opponent") {
          $(this).css("background-color", "lightyellow");  // if not selected change color back
        }
      }
    });

    // select to take a shot
    $("td").click(function(){
      var cellId = $(this).data("id"); // get the cellId for the current cell
      var cellState = $(this).data("state");
      var cellTable = $(this).closest("table").attr("class");
      if (gameObj.isTurn){        
        if (cellId !== 'header' && cellState === "unselected" && cellTable === "opponent") {
          $(this).css("background-color", "blue"); // add the hit/miss animation here?
          $(this).data("state", "miss");
          if (selectedArr.indexOf(cellId) === -1) { // prevent duplicates in the selectedArr
            selectedArr.push(cellId); // push the selected cell into the selectedArr
            var shotObj = {};
            shotObj.player = $('#personsName').val(); //person;
            shotObj.id = cellId;
            socket.emit('shot', shotObj);
          }
        }
      }
    });

    // update both players shipboards with each shot
    socket.on('shot', function(shotObj){
      // adds the current shooter to the gameObj as the opponentName
      gameObj.opponentName = shotObj.player;
      // the data-id is the cell, then select imgages.
      var hitArr = document.querySelectorAll('[data-id=' + shotObj.id + '] img');
      // Updates the Header UI for who took a shot and the cell location
      if (shotObj.hitORmiss){
        if(shotObj.sunk!==null){
          document.getElementById("shotPlayer").innerHTML = gameObj.opponentName + " sunk "+shotObj.sunk+ " at " + shotObj.id;}
        else{
          document.getElementById("shotPlayer").innerHTML = gameObj.opponentName + " HIT at " + shotObj.id;}
      }
      else {
        document.getElementById("shotPlayer").innerHTML = gameObj.opponentName + " missed at " + shotObj.id;        
      }

      // this is the current player (shooter)
      if (gameObj.opponentName !== gameObj.playerName) {
        document.getElementById("userName").innerHTML =  "FIRE " + gameObj.playerName + "!";
        if( shotObj.hitORmiss ){
          $(hitArr[0]).removeClass("hide"); // the hit img
        } else { // this block is the miss scenario
          $(hitArr[1]).removeClass("hide"); // the miss img
        }
      } 

      // this is the opponent (waiting)
      if (gameObj.opponentName === gameObj.playerName) {
        document.getElementById("userName").innerHTML =  "Not your turn";
        if( shotObj.hitORmiss ){
          $(hitArr[2]).removeClass("hide"); // the hit img
        } else { // this block is the miss scenario
          $(hitArr[3]).removeClass("hide"); // the miss img
        }
      }
    });

    // make this into game_status to start or end game
    socket.on('game_status', function( gameOver ){
      if ( gameOver ) {
        document.getElementById("shotPlayer").innerHTML = gameOver.winner+" won, " +gameOver.loser+ " lost. Thanks for playing."; // Add Play again?
        document.getElementById("userName").innerHTML =  "Game Over!";
        //alert("Game Over");
      }
    }); 

  } // end gamePlay


  // -----   SHIP PLACEMENT AND ROTATION   ----

  $( "#draggableAircraftCarrier" ).draggable({
    snap: ".snapCell",
    snapMode: "inner",
    containment: "#snaptarget"
    // grid: [13, 13] 
  });

  $( "#draggableBattleship" ).draggable({
    snap: ".snapCell",
    snapMode: "inner",
    containment: "#snaptarget"
    // grid: [25, 25] 
  });
  $( "#draggableDestroyer" ).draggable({
    snap: ".snapCell",
    snapMode: "inner",
    containment: "#snaptarget"
    // grid: [25, 25] 
  });
  $( "#draggableSubmarine" ).draggable({
    snap: ".snapCell",
    snapMode: "inner",
    containment: "#snaptarget"
    // grid: [25, 25] 
  });
  $( "#draggablePtBoat" ).draggable({
    snap: ".snapCell",
    snapMode: "inner",
    containment: "#snaptarget"
    // grid: [25, 25]
  });

function emitShip(name, cellId, rotation) {

  placedShipObj.name = name;
  placedShipObj.cell = cellId;
  placedShipObj.rotation = rotation;

  socket.emit('place_ship', placedShipObj);
  console.log(placedShipObj);  
}

$( ".droppable" ).droppable({
  drop: function( event, ui ) {
    var placedShip = ui.draggable.attr('id'); // at this point it is in the form of "draggableAircraftCarrier"
    placedShip = placedShip.slice( 9, placedShip.length ); //  remove 'draggable' from the ships name
    name = placedShip;
    cell = $(this).data("id");

    if (name === "AircraftCarrier"){
      gameObj.AircraftCarrier.cell = cell;
      rotation = gameObj.AircraftCarrier.rotation;
    } else if (name === "Battleship"){
      gameObj.Battleship.cell = cell;
      rotation = gameObj.Battleship.rotation;
    } else if (name === "Destroyer"){
      gameObj.Destroyer.cell = cell;
      rotation = gameObj.Destroyer.rotation;
    } else if (name === "Submarine"){
      gameObj.Submarine.cell = cell;
      rotation = gameObj.Submarine.rotation;
    } else if (name === "PtBoat"){
      gameObj.PtBoat.cell = cell;
      rotation = gameObj.PtBoat.rotation;
    }

    emitShip(name, cell, rotation);

    // checks if valid drop. if not, it corrects to closest valid grid space
    checkShipPlacement( placedShipObj );
  }
});

  // ship rotation
  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
      if( !gameObj.gameStarted ){
        if ( gameObj.AircraftCarrier.rotation === 0 ) {
          $('#draggableAircraftCarrier').removeClass('hor');
          $('#draggableAircraftCarrier').addClass('ver');
          gameObj.AircraftCarrier.rotation = 90;

        } else {
          $('#draggableAircraftCarrier').removeClass('ver');
          $('#draggableAircraftCarrier').addClass('hor');
          gameObj.AircraftCarrier.rotation = 0;
        }
        emitShip("AircraftCarrier", gameObj.AircraftCarrier.cell, gameObj.AircraftCarrier.rotation);
      }
     }
  });

  $('#draggableBattleship').on({
    'dblclick': function() {
      if( !gameObj.gameStarted ){
        if ( gameObj.Battleship.rotation === 0 ) {
          $('#draggableBattleship').removeClass('hor');
          $('#draggableBattleship').addClass('ver');
          gameObj.Battleship.rotation = 90;
        } else {
          $('#draggableBattleship').removeClass('ver');
          $('#draggableBattleship').addClass('hor');
          gameObj.Battleship.rotation = 0;
        }
        // $(this).rotate({ animateTo:battleshipRotation});
        cell = $(this).data("id");
        emitShip("Battleship", gameObj.Battleship.cell, gameObj.Battleship.rotation);
      }
    }
  });

  $('#draggableDestroyer').on({
    'dblclick': function() {
      if( !gameObj.gameStarted ){
        if ( gameObj.Destroyer.rotation === 0 ) {
          $('#draggableDestroyer').removeClass('hor');
          $('#draggableDestroyer').addClass('ver');
          gameObj.Destroyer.rotation = 90;
        } else {
          $('#draggableDestroyer').removeClass('ver');
          $('#draggableDestroyer').addClass('hor');
          gameObj.Destroyer.rotation = 0;
        }
        cell = $(this).data("id");
        emitShip("Destroyer", gameObj.Destroyer.cell, gameObj.Destroyer.rotation);
      }
    }
  });

  $('#draggableSubmarine').on({
    'dblclick': function() {
      if( !gameObj.gameStarted ){
        if ( gameObj.Submarine.rotation === 0 ) {
          $('#draggableSubmarine').removeClass('hor');
          $('#draggableSubmarine').addClass('ver');
          gameObj.Submarine.rotation = 90;
        } else {
          $('#draggableSubmarine').removeClass('ver');
          $('#draggableSubmarine').addClass('hor');
          gameObj.Submarine.rotation = 0;
        }
        cell = $(this).data("id");
        emitShip("Submarine", gameObj.Submarine.cell, gameObj.Submarine.rotation);
      }
    }
  });

  $('#draggablePtBoat').on({
    'dblclick': function() {
      if( !gameObj.gameStarted ){
        if ( gameObj.PtBoat.rotation === 0 ) {
          $('#draggablePtBoat').removeClass('hor');
          $('#draggablePtBoat').addClass('ver');
          gameObj.PtBoat.rotation = 90;
        } else {
          $('#draggablePtBoat').removeClass('ver');
          $('#draggablePtBoat').addClass('hor');
          gameObj.PtBoat.rotation = 0;
        }
        cell = $(this).data("id");
        emitShip("PtBoat", gameObj.PtBoat.cell, gameObj.PtBoat.rotation);
      }
    }
  });

// checks each ship's placement on the grid if it is a valid location. i.e. a ship isn't off the grid.
  function checkShipPlacement( placedShipObj ){
    placedShip = placedShipObj.name;
    placedLocation = placedShipObj.cell;
    placedOrientation = placedShipObj.rotation;

    var placedHGrid = placedLocation.substr(1, 2).toString(); //check the 2nd (and maybe the 3rd) char of the grid location
    var placedVGrid = placedLocation.substr(0, 1).toString(); //check the 1st char of the grid location

    var validHGrid = { // use with rotation === 0
      "AircraftCarrier": [1,2,3,4,5,6],
      "Battleship": [1,2,3,4,5,6,7],
      "Destroyer": [1,2,3,4,5,6,7,8],
      "Submarine": [1,2,3,4,5,6,7,8],
      "PtBoat": [1,2,3,4,5,6,7,8,9],
    };

    var validVGrid = { // use with rotation === 90
      "AircraftCarrier": ["a","b","c","d","e","f"],
      "Battleship": ["a","b","c","d","e","f","g"],
      "Destroyer": ["a","b","c","d","e","f","g","h"],
      "Submarine": ["a","b","c","d","e","f","g","h"],
      "PtBoat": ["a","b","c","d","e","f","g","h","i"],
    };

    if( placedOrientation === 0 ){ // HORIZONTAL
      var validH = validHGrid[ placedShip ].indexOf( parseInt(placedHGrid, 10) ); // .toString()
      if ( validH === -1 ) {
        var lastValidElement = validHGrid[ placedShip ][ validHGrid[ placedShip ].length-1 ];
        var fixedCell = placedVGrid + lastValidElement.toString(); // add that after the current placedVGrid
        console.log( "fixedCell", fixedCell );
        placedLocation = fixedCell;
        var fixedDistance = validHGrid[ placedShip ].indexOf( parseInt(placedHGrid, 10) ) - validHGrid[ placedShip ].indexOf( parseInt(lastValidElement, 10) );// index of place cell minus the index of the fixed cell
        fixedDistance = fixedDistance * 25;
        var getTheShip = "#draggable"+ placedShip.name;
        var theShipStyle = $(getTheShip).attr('style');
        console.log("theShipStyle", theShipStyle);
      }
    } else { // VERTICAL
      var validV = validVGrid[ placedShip ].indexOf( placedVGrid );
      console.log(placedShip, "is at", placedVGrid, "and can be in",validVGrid[ placedShip ]);
      if ( validV === -1 ) {
        var lastValidElement = validVGrid[ placedShip ][ validVGrid[ placedShip ].length-1 ]; // the linter incorrectly thinks this var has already been defined. There is another assignment but inside the conditional. The logic will only use one or the other.
        var fixedCell = lastValidElement + placedHGrid; // add that after the current placedVGrid
        console.log( "fixedCell", fixedCell );
        placedLocation = fixedCell;
        var fixedDistance = validVGrid[ placedShip ].indexOf( parseInt(placedVGrid, 10) ) - validVGrid[ placedShip ].indexOf( parseInt(lastValidElement, 10) );// index of place cell minus the index of the fixed cell
        fixedDistance = fixedDistance * 25;
        var getTheShip = "#draggable"+ placedShip.name;
        var theShipStyle = $(getTheShip).attr('style');
        console.log("theShipStyle", theShipStyle);
      }
    }

  };

  // toggle ships droppable
  var gameReady = function( setTo ){
  // accepts val to set . gameStarted is a global var. Should only be called by player clicking "Ready To Play" button, by starting a new game
    setTo = setTo || gameObj.gameStarted;
    gameObj.gameStarted = setTo;
    $( ".ship" ).draggable( "option", "disabled", gameObj.gameStarted );
    socket.emit('game_status', gameObj.gameStarted);
  };


  function checkShipsPlaced () {
    if ((gameObj.AircraftCarrier.cell !== "") &&
        (gameObj.Battleship.cell !== "") &&
        (gameObj.Destroyer.cell !== "") &&
        (gameObj.Submarine.cell !== "") &&
        (gameObj.PtBoat.cell !== ""))
    {
      gameObj.shipsPlaced = true;   
    }
  }

  $('#readyToPlayButton').on({
    'click': function() {
      checkShipsPlaced();
      if (gameObj.shipsPlaced) {
        event.preventDefault();
        // disable droppable
        $('#shotPlayer').text("Game ON!");
        gameReady(true);
        // emit to server player is ready
        $("#readyToPlayButton").css("display","none");  
        $('h4').text(''); 
        gameObj.readyToPlay = true;
        if (gameObj.controllerIndex === 1) {
            document.getElementById("userName").innerHTML =  "Take the first shot!"; //kludge to make first shot work
        }
      }
      else {
        console.log("should prompt user");
      }
    }
  });


  gamePlay();

});
