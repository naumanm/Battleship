$(document).ready(function(){

var socket = io(),
  // gameStarted = false ==> disallows firing and allows placing ships.
  // gameStarted = true ==> disallows placing ships and allows firing.
  gameStarted = gameStarted || false;

// objects to emit to backend
// Christian thinks gameObj should be an object with key value pairs. gameObj['battleship']['name']  ==> "battleship"  THIS works. I tested it in console.
// This way, the checkShipPlacement function can receive the ship name to check then use the global gameObj and work.
// Once we do game persistance, we should have function here to check any existing game then add that to the gameObj
var gameObj = {
    aircraftCarrier: {
      name: "aircraftCarrier", // gameObj['aircraftCarrier']['name']
      cell: "",      // gameObj['aircraftCarrier']['cell']
      rotation: "0" // gameObj['aircraftCarrier']['rotation']
      },
    battleship: {
      name: "battleship",
      cell: "",
      rotation: "0"
      },
    destroyer: {
      name: "destroyer",
      cell: "",
      rotation: "0"
      },
    submarine: {
      name: "submarine",
      cell: "",
      rotation: "0"
      },
    ptBoat: {
      name: "ptBoat",
      cell: "",
      rotation: "0"
      },
    gameStarted: false, // gameStarted: gameObj['gameStarted'] || false   <== doesn't seem to work. Tried several options in console.
    playerName: ""    
  };

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
  // $('#playerSignIn').modal('show'); // shows the get player's name modal
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
          console.log('\nshotObj (player name - cell ID)' , shotObj);
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
  // draggable

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

  // function to consolidate and emit ship object 
  function emitShip(shipObj) {
    socket.emit('shipObj', shipObj);
    console.log("emitting " + shipObj);
  }


$( ".droppable" ).droppable({
  drop: function( event, ui ) {
    var targetElem = $(this).data("id");
    var placedShip = ui.draggable.attr('id'); // at this point it is in the form of "draggableAircraftCarrier"
    // remove "draggable" from the passed ship's name
    placedShip = placedShip.slice( 9, placedShip.length ); //  remove 'draggable'
<<<<<<< HEAD
    // console.log( "The", placedShip, "was dropped on", targetElem ); // this is the ship that was placed and where

    // set the values to the global gameObj to then check then emit
    placedShipObj = {};
    placedShipObj.name = placedShip;
    placedShipObj.location = targetElem;
// Christian finnish this
    // placedShipObj.rotation = this.orientation;

    console.log( "placedShipObj", placedShipObj );
    
    // checks if valid drop. if not, it corrects to closest valid grid space
// ***************************************************************
// UNCOMMENT ONCE WE'RE FURTHER ALONG... this is not MVP
    // checkShipPlacement( "checkDrop", placedShip, targetElem );
// ***************************************************************

//    socket.emit('place_ship', gameObj[ placedShip ] );  // Christian thinks we should emit the gameObj[ placedShip ] object which contains all ship info (name, grid, orientation)
//    therefore, the next lines are invalid
    socket.emit('place_ship', placedShipObj);

    socket.emit('shipLocation', targetElem);
    socket.emit('shipName', placedShip);
// ===== TAKE ABOVE LINES OUT??? SEE REASON IN COMMENT ABOVE =======
=======

    if (placedShip === "AircraftCarrier") {
      aircraftCarrier.cellID = targetElem;
      emitShip(aircraftCarrier);
    }
    if (placedShip === "Battleship") {
      battleship.cellID = targetElem;
      emitShip(battleship);
    }
    if (placedShip === "Destroyer") {
      destroyer.cellID = targetElem;
      emitShip(destroyer);
    }
    if (placedShip === "Submarine") {
      submarine.cellID = targetElem;
      emitShip(submarine);
    }
    if (placedShip === "PtBoat") {
      ptBoat.cellID = targetElem;
      emitShip(ptBoat);
    }

>>>>>>> 65c3be5abea56d9494c1dc356e242179fc5e062c

  } // END of drop definition
}); // END of droppable

  // ship rotation
  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
      if( !gameStarted ){
        if ( gameObj.aircraftCarrier.rotation === 0 ) {
          gameObj.aircraftCarrier.rotation = 90;
          $('#draggableAircraftCarrier').addClass('ver');
          $('#draggableAircraftCarrier').removeClass('hor');

          aircraftCarrier.rotation = '90';  

        } else {
          gameObj.aircraftCarrier.rotation = 0;
          $('#draggableAircraftCarrier').addClass('hor');
          $('#draggableAircraftCarrier').removeClass('ver');

          aircraftCarrier.rotation = '0';  
        }
        // $(this).rotate({ animateTo:aircraftCarrierRotation});
        socket.emit('aircraftCarrierRotation', gameObj.aircraftCarrier.rotation );
        console.log('aircraftCarrierRotation', gameObj.aircraftCarrier.rotation );
      }
     }//,
    // 'mouseover': function(){      // this highlights the ship when hover but it adds pixels to border which makes the ships shift.
    //   $('#draggableAircraftCarrier').addClass('highlight');
      
    // },
    // 'mouseout': function(){
    //   $('#draggableAircraftCarrier').removeClass('highlight');
      
    // }
  });

  $('#draggableBattleship').on({
    'dblclick': function() {
      if( !gameStarted ){
        if ( gameObj.battleship.rotation === 0 ) {
          gameObj.battleship.rotation = 90;
          $('#draggableBattleship').addClass('ver');
          $('#draggableBattleship').removeClass('hor');
        } else {
          gameObj.battleship.rotation = 0;
          $('#draggableBattleship').addClass('hor');
          $('#draggableBattleship').removeClass('ver');
        }
        // $(this).rotate({ animateTo:battleshipRotation});
        socket.emit('battleshipRotation', gameObj.battleship.rotation );
        console.log('battleshipRotation', gameObj.battleship.rotation );
      }
    }
  });

  $('#draggableDestroyer').on({
    'dblclick': function() {
      if( !gameStarted ){
        if ( gameObj.destroyer.rotation === 0 ) {
          gameObj.destroyer.rotation = 90;
          $('#draggableDestroyer').addClass('ver');
          $('#draggableDestroyer').removeClass('hor');
        } else {
          gameObj.destroyer.rotation = 0;
          $('#draggableDestroyer').addClass('hor');
          $('#draggableDestroyer').removeClass('ver');
        }
        // $(this).rotate({ animateTo:destroyerRotation});
        socket.emit('destroyerRotation', gameObj.destroyer.rotation );
        console.log('destroyerRotation', gameObj.destroyer.rotation );
      }
    }
  });

  $('#draggableSubmarine').on({
    'dblclick': function() {
      if( !gameStarted ){
        if ( gameObj.submarine.rotation === 0 ) {
          gameObj.submarine.rotation = 90;
          $('#draggableSubmarine').addClass('ver');
          $('#draggableSubmarine').removeClass('hor');
        } else {
          gameObj.submarine.rotation = 0;
          $('#draggableSubmarine').addClass('hor');
          $('#draggableSubmarine').removeClass('ver');
        }
        // $(this).rotate({ animateTo:submarineRotation});
        socket.emit('submarineRotation', gameObj.submarine.rotation );
        console.log('submarineRotation', gameObj.submarine.rotation );
      }
    }
  });

  $('#draggablePtBoat').on({
    'dblclick': function() {
      if( !gameStarted ){
        if ( gameObj.ptBoat.rotation === 0 ) {
          gameObj.ptBoat.rotation = 90;
          $('#draggablePtBoat').addClass('ver');
          $('#draggablePtBoat').removeClass('hor');
        } else {
          gameObj.ptBoat.rotation = 0;
          $('#draggablePtBoat').addClass('hor');
          $('#draggablePtBoat').removeClass('ver');
        }
        // $(this).rotate({ animateTo:ptBoatRotation});
        socket.emit('ptBoatRotation', gameObj.ptBoat.rotation );
        console.log('ptBoatRotation', gameObj.ptBoat.rotation );
      }
    }
  });

// checks each ship's placement on the grid if it is a valid location. IE a ship isn't off the grid.
// checkWhat can be "checkDrop", "checkRotate"
  var checkShipPlacement = function( checkWhat, ship_name, ship_grid, ship_orientation ){
    // placedShipObj.name = placedShip;
    // placedShipObj.location = targetElem;
    // need ship's orientation
    //check the 1st char of the grid location
    validVGrid = {
      "draggableAircraftCarrier": ["a","b","c","d","e","f"],
      "draggableBattleship": ["a","b","c","d","e","f","g"],
      "draggableDestroyer": ["a","b","c","d","e","f","g","h"],
      "draggableSubmarine": ["a","b","c","d","e","f","g","h"],
      "draggablePtBoat": ["a","b","c","d","e","f","g","h","i"],
    };

    //check the 2nd char of the grid location
    validHGrid = {
      "draggableAircraftCarrier": [1,2,3,4,5,6],
      "draggableBattleship": [1,2,3,4,5,6,7],
      "draggableDestroyer": [1,2,3,4,5,6,7,8],
      "draggableSubmarine": [1,2,3,4,5,6,7,8],
      "draggablePtBoat": [1,2,3,4,5,6,7,8,9],
    };

//if switched to horiz use validHGrid
    // if( checkWhat === "checkRotate"){

    //   if(ship_orientation === "Horizontal", ship_grid){
    //     //do something using validHGrid
    //     var validH = validHGrid[ ship_name.toString() ].indexOf( ship_grid );
    //     if ( validH == -1 ) {
    //       //invalid drop. change change ship_grid location to closest valid value validHGrid[ ship_name.toString() ][ validHGrid[ ship_name.toString() ].length-1 ];
    //     }

    //   } else {
    //     //do something using validVGrid
    //     var validV = validVGrid[ ship_name.toString() ].indexOf( ship_grid );
    //     if ( validV == -1 ) {
    //       //invalid drop. change change ship_grid location to closest valid value validHGrid[ ship_name.toString() ][ validHGrid[ ship_name.toString() ].length-1 ];
    //     }

    //   } // END of if(ship_orientation === "Horizontal", ship_grid){

    // } // END of check if rotation check

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
  $('#readyToPlay').on({
    'click': function() {
      event.preventDefault();
      // disable droppable
      $('#shotPlayer').text("Game ON!");
      gameReady(true);
      // emit to server player is ready
    }
  });

  gamePlay();

});
