$(document).ready(function(){

var socket = io(),
  // gameStarted = false ==> disallows firing and allows placing ships.
  // gameStarted = true ==> disallows placing ships and allows firing.
  gameStarted = gameStarted || false;

// objects to emit to backend
// Christian thinks gameObj should be an object with key value pairs. gameObj['battleship']['name']  ==> "battleship"  THIS works. I tested it in console.
// This way, the checkShipPlacement function can receive the ship name to check then use the global gameObj and work.
// Once we do game persistance, we should have function here to check any existing game then add that to the gameObj

  var placedShipObj = {
    rotation: 0
  };

  var gameObj = {
    AircraftCarrier: {
      name: "AircraftCarrier", // gameObj['aircraftCarrier']['name']
      rotation: 0 // gameObj['aircraftCarrier']['rotation']
      },
    Battleship: {
      name: "Battleship",
      rotation: 0
      },
    Destroyer: {
      name: "Destroyer",
      rotation: 0
      },
    Submarine: {
      name: "Submarine",
      rotation: 0
      },
    PtBoat: {
      name: "PtBoat",
      rotation: 0
      },
    gameStarted: false, // gameStarted: gameObj['gameStarted'] || false   <== doesn't seem to work. Tried several options in console.
    playerName: ""    
  };

  $("#readyToPlay").css("visibility","visible");
  $("#placeShips").css("visibility","visible");

  // as the user types, populate the client side "Hello xyz" but wait for the sumbit to sent the info to redis
  // gameObj.playerName = $( "#personsName" ).keyup(function() { // #personsName is the id of the name input field in the modal
  /*var playerName = */
  $( "#personsName" ).keyup(function() { // #personsName is the id of the name input field in the modal
      gameObj.playerName = $('#personsName').val();  // var playerName = $('#personsName').val();
      $( "#userName" ).text( "Hello " + /* playerName */ gameObj.playerName );
  }).keyup();

  // listener for the form submit
  $('form').submit(function(e){
    e.preventDefault();
    var playerName = document.getElementsByTagName("input")[0].value; // wasn't working using same code from above function like like 10 (  var playerName = $('#personsName').val();  )

    $('#playerSignIn').modal('hide'); // shows the get player's name modal
    console.log("playerName", /* playerName */ gameObj.playerName );

    socket.emit('playerName', /* playerName */ gameObj.playerName );



    return /* playerName */ gameObj.playerName;
    // HOW DO WE WANT TO DO THIS???? Many scenarios!!!
    // 1) Player already connected to the game and refreshed.
    // 2) Player started a new game (using a different player name)
    // 3) New player but their entered name already exists with another player. I think the socet ID needs to be the "PK" of the player's data

  }); // END listener for the form submit


// *******************UN-COMMENT ONCE DONE WITH TESTING**************************
//TEMPORARY DISABLE SINCE IT'S SO ANNOYING WHILE TESTING
  var isNameEmpty = function(a){
    $('#playerSignIn').modal('show'); // shows the get player's name modal
  }();

  function gamePlay(){

    var selectedArr = selectedArr || []; // array of all shots

    // color change on hover
    $("td").mouseover(function(){
      var cellState = $(this).data("state");
      var cellId = $(this).data("id");
      var cellTable = $(this).closest("table").attr("class");
      if (cellId !== "header" && cellState === "unselected" && cellTable === "opponent") {
        $(this).css("background-color", "red");
      }
    });  // end of color change on hover

    // revert color if not clicked
    $("td").mouseleave(function(){
      var cellState = $(this).data("state");
      var cellTable = $(this).closest("table").attr("class");

      if (cellState === "unselected" && cellTable === "opponent") {
        $(this).css("background-color", "gray");  // if not selected change color back
      }
    });  // end of revert color if not clicked


    // NEED logic in here to prevent the wrong person from shooting
    // also need logic to prompt who's turn it is.  

    // select to take a shot
    $("td").click(function(){
      var cellId = $(this).data("id"); // get the cellId for the current cell
      var cellState = $(this).data("state");
      var cellTable = $(this).closest("table").attr("class");
      if (cellId !== 'header' && cellState === "unselected" && cellTable === "opponent") {
        $(this).css("background-color", "blue"); // add the hit/miss animation here?
        $(this).data("state", "miss");
        if (selectedArr.indexOf(cellId) === -1) { // prevent duplicates in the selectedArr
          selectedArr.push(cellId); // push the selected cell into the selectedArr
          var shotObj = {};
          shotObj.player = $('#personsName').val(); //person;
          shotObj.id = cellId;
          //console.log('\nshotObj (player name - cell ID)' , shotObj);
          socket.emit('shot', shotObj);
        } // END of (selectedArr.indexOf(cellId) === -1)
      } // END of (cellId !== 'header' && cellState === "unselected" && cellTable === "opponent")
    });  // end of select to take a shot

    // update the ship board with other players shots
    socket.on('shot', function(shotObj){
      // Updates the Header UI for who took a shot and the cell location
      if (shotObj.player !== person) {
        document.getElementById("shotPlayer").innerHTML = shotObj.player + " took a shot at " + shotObj.id + ". It's your turn!";
        // gets the shot fired and updates the gameboard
        // this is klugy, needs a better way...
        var hitArr = document.querySelectorAll('[data-id=' + shotObj.id + ']');
        $(hitArr[1]).css("background-color", "red");
      }
    }); // END of socket.on 'shot'

    // make this into game_status to start or end game
    socket.on('game_status', function( gameOver ){
      if ( gameOver ) {
        document.getElementById("shotPlayer").innerHTML = "Game Over. Thanks for playing."; // Add Play again?
      } else {
        // Does something need to go here for gameOver = false???
      }
    }); // END of socket.on 'game_status'

  } // End of gamePlay function


  // -----   SHIP PLACEMENT AND ROTATION   ----

  $( "#draggableAircraftCarrier" ).draggable({ 
    containment: "#snaptarget",
    grid: [25, 25] 
  });

  $( "#draggableBattleship" ).draggable({ 
    containment: "#snaptarget",
    grid: [25, 25] 
  });
  $( "#draggableDestroyer" ).draggable({ 
    containment: "#snaptarget",
    grid: [25, 25] 
  });
  $( "#draggableSubmarine" ).draggable({ 
    containment: "#snaptarget",
    grid: [25, 25] 
  });
  $( "#draggablePtBoat" ).draggable({ 
    containment: "#snaptarget",
    grid: [25, 25]
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
    }
    if (name === "Battleship"){
      gameObj.Battleship.cell = cell;
      rotation = gameObj.Battleship.rotation;
    }
    if (name === "Destroyer"){
      gameObj.Destroyer.cell = cell;
      rotation = gameObj.Destroyer.rotation;
    }
    if (name === "Submarine"){
      gameObj.Submarine.cell = cell;
      rotation = gameObj.Submarine.rotation;
    }
    if (name === "PtBoat"){
      gameObj.PtBoat.cell = cell;
      rotation = gameObj.PtBoat.rotation;
    }

    emitShip(name, cell, rotation);

    // checks if valid drop. if not, it corrects to closest valid grid space
    //checkShipPlacement( placedShipObj );
  }
});

  // ship rotation
  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
      if( !gameStarted ){
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
      if( !gameStarted ){
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
      if( !gameStarted ){
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
      if( !gameStarted ){
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
      if( !gameStarted ){
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
  var checkShipPlacement = function( placedShipObj ){
    placedShip = placedShipObj.name;
    placedLocation = placedShipObj.cell;
    placedOrientation = placedShipObj.rotation;
    //console.log("placedShip",placedShip,"placedLocation",placedLocation,"placedOrientation",placedOrientation);

    var placedHGrid = placedLocation.substr(1, 2).toString(); //check the 2nd (and maybe the 3rd) char of the grid location
    var placedVGrid = placedLocation.substr(0, 1).toString(); //check the 1st char of the grid location
    //console.log("placedVGrid", placedVGrid, "placedHGrid", placedHGrid);

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
      // use validHGrid
      var validH = validHGrid[ placedShip ].indexOf( parseInt(placedHGrid, 10) ); // .toString()
      //console.log(placedShip, "is at", parseInt(placedHGrid, 10), "and can be in",validHGrid[ placedShip ]);
      if ( validH === -1 ) {
        //console.log("not valid Horiz placement");//invalid drop. change change ship_grid location to closest valid value validHGrid[ ship_name.toString() ][ validHGrid[ ship_name.toString() ].length-1 ];
        // correct the grid location here
        // get the last array element of the given ships validHGrid
        var lastValidElement = validHGrid[ placedShip ][ validHGrid[ placedShip ].length-1 ];
        // console.log( "lastValidElement", lastValidElement );
        var fixedCell = placedVGrid + lastValidElement.toString(); // add that after the current placedVGrid
        //console.log( "fixedCell", fixedCell );
        placedLocation = fixedCell;

      } // END invalid HORIZONTAL placement with ship placement fix

    } else { // VERTICAL
      // use validVGrid
      var validV = validVGrid[ placedShip ].indexOf( placedVGrid );
      //console.log(placedShip, "is at", placedVGrid, "and can be in",validVGrid[ placedShip ]);
      if ( validV === -1 ) {
        //console.log("not valid Vert placement");//invalid drop. change change ship_grid location to closest valid value validHGrid[ ship_name.toString() ][ validHGrid[ ship_name.toString() ].length-1 ];
        // correct the grid location here
        // get the last array element of the given ships validVGrid
        var lastValidElement = validVGrid[ placedShip ][ validVGrid[ placedShip ].length-1 ];
        // console.log( "lastValidElement", lastValidElement );
        var fixedCell = lastValidElement + placedVGrid; // add that after the current placedVGrid
        //console.log( "fixedCell", fixedCell );
        placedLocation = fixedCell;
      } // END invalid VERTICAL placement with ship placement fix

    } // END of placedOrientation check for rotaion at 0 or 90 degrees

    // put the dropped cell location or fixed cell location into the global gameObj
    gameObj[ placedShip ].cell = placedLocation;

  }; // END of checkShipPlacement function

// toggle ships droppable
  var gameReady = function( setTo ){
  // accepts val to set . gameStarted is a global var. Should only be called by player clicking "Ready To Play" button, by starting a new game
    setTo = setTo || gameStarted;
    gameStarted = setTo;
    $( ".ship" ).draggable( "option", "disabled", gameStarted );
    socket.emit('game_status', gameStarted);
  }; // END disable gameReady funct

// "Ready To Play" button to dissable ship draggable and rotation.

// need to add check to see if all ships have a cell value if if so enable the button.

console.log(gameObj.AircraftCarrier.cell);

function shipsPlaced () {
  if ((gameObj.AircraftCarrier.cell !== undefined) &&
      (gameObj.Battleship.cell !== undefined) &&
      (gameObj.Destroyer.cell !== undefined) &&
      (gameObj.Submarine.cell !== undefined) &&
      (gameObj.PtBoat.cell !== undefined))
  {
    return true;  
  }
}

  $('#readyToPlay').on({
    'click': function() {
      if (shipsPlaced()) {
        event.preventDefault();
        // disable droppable
        $('#shotPlayer').text("Game ON!");
        gameReady(true);
        // emit to server player is ready
        $("#readyToPlay").css("display","none");  
      }
    }
  });

  gamePlay();

});
