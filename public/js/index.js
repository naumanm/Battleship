$(document).ready(function(){

// objects to emit to backend
var aircraftCarrier = {
  name: "aircraftCarrier",
  cellID: "",
  rotation: "0"
};
var battleship = {
  name: "battleship",
  cellID: "",
  rotation: "0"
};
var destroyer = {
  name: "destroyer",
  cellID: "",
  rotation: "0"
};
var submarine = {
  name: "submarine",
  cellID: "",
  rotation: "0"
};
var ptBoat = {
  name: "ptBoat",
  cellID: "",
  rotation: "0"
};

var socket = io(),
// gameStarted = false ==> disallows firing and allows placing ships.
// gameStarted = true ==> disallows placing ships and allows firing.
    gameStarted = gameStarted || false;

$('#playerSignIn').modal('show'); // shows the get player's name modal

// as the user types, populate the client side "Hello xyz" but wait for the sumbit to sent the info to redis
var playerName = $( "#personsName" ).keyup(function() { // #personsName is the id of the name input field in the modal
    var playerName = $('#personsName').val();
    $( "#userName" ).text( "Hello " + playerName );
}).keyup();

  // listener for the form submit
  $('form').submit(function(e){
    e.preventDefault();
    var playerName = document.getElementsByTagName("input")[0].value; // wasn't working using same code from above function like like 10 (  var playerName = $('#personsName').val();  )

    $('#playerSignIn').modal('hide'); // shows the get player's name modal
    console.log("playerName", playerName);

    socket.emit('playerName', playerName);

    return playerName;
    // HOW DO WE WANT TO DO THIS???? Many scenarios!!!
    // 1) Player already connected to the game and refreshed.
    // 2) Player started a new game (using a different player name)
    // 3) New player but their entered name already exists with another player. I think the socet ID needs to be the "PK" of the player's data

  }); // END listener for the form submit

  function gamePlay(){

    var selectedArr = []; // array of all shots

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
    });

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


  } // END of drop definition
}); // END of droppable

  // ship rotation

  // making the images of the ships rotate on the 'Your Ships' grid
  // $('#zzzz-draggableAircraftCarrier').on({
  //   'dblclick': function () {
  //     if( !gameStarted ){
  //       if (aircraftCarrierRotation === 0) {
  //         aircraftCarrierRotation +=90;
  //         $('#draggableAircraftCarrier').addClass('ver');
  //         $('#draggableAircraftCarrier').removeClass('hor');
  //       } else {
  //         aircraftCarrierRotation = 0;
  //         $('#draggableAircraftCarrier').addClass('hor');
  //         $('#draggableAircraftCarrier').removeClass('ver');
  //     }
  //       // $(this).rotate({ animateTo:aircraftCarrierRotation});
  //       socket.emit('aircraftCarrierRotation', aircraftCarrierRotation);
  //       console.log('aircraftCarrierRotation ' + aircraftCarrierRotation);
  //     }
  //   }
  // });

  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (aircraftCarrier.rotation === 0) {
          aircraftCarrier.rotation +=90;
          $('#draggableAircraftCarrier').addClass('ver');
          $('#draggableAircraftCarrier').removeClass('hor');

          aircraftCarrier.rotation = '90';  

        } else {
          aircraftCarrier.Rotation = 0;
          $('#draggableAircraftCarrier').addClass('hor');
          $('#draggableAircraftCarrier').removeClass('ver');

          aircraftCarrier.rotation = '0';  
        }
//        $(this).rotate({ animateTo:aircraftCarrierRotation});

        console.log('from rotate '  +  aircraftCarrier); 

        emitShip(aircraftCarrier);
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
        if (battleshipRotation === 0) {battleshipRotation +=90;
          $('#draggableBattleship').addClass('ver');
          $('#draggableBattleship').removeClass('hor');
        } else {
          battleshipRotation = 0;
          $('#draggableBattleship').addClass('hor');
          $('#draggableBattleship').removeClass('ver');
        }
        $(this).rotate({ animateTo:battleshipRotation});
        socket.emit('battleshipRotation', battleshipRotation);
        console.log('battleshipRotation ' + battleshipRotation);
      }
    }
  });

  $('#draggableDestroyer').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (destroyerRotation === 0) {
          destroyerRotation +=90;
          $('#draggableDestroyer').addClass('ver');
          $('#draggableDestroyer').removeClass('hor');
        } else {
          destroyerRotation = 0;
          $('#draggableDestroyer').addClass('hor');
          $('#draggableDestroyer').removeClass('ver');
        }
        $(this).rotate({ animateTo:destroyerRotation});
        socket.emit('destroyerRotation', destroyerRotation);
        console.log('destroyerRotation ' + destroyerRotation);
      }
    }
  });

  $('#draggableSubmarine').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (submarineRotation === 0) {
          submarineRotation +=90;
          $('#draggableSubmarine').addClass('ver');
          $('#draggableSubmarine').removeClass('hor');
        } else {
          submarineRotation = 0;
          $('#draggableSubmarine').addClass('hor');
          $('#draggableSubmarine').removeClass('ver');
        }
        $(this).rotate({ animateTo:submarineRotation});
        socket.emit('submarineRotation', submarineRotation);
        console.log('submarineRotation ' + submarineRotation);
      }
    }
  });

  $('#draggablePtBoat').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (ptBoatRotation === 0) {
          ptBoatRotation +=90;
          $('#draggablePtBoat').addClass('ver');
          $('#draggablePtBoat').removeClass('hor');
        } else {
          ptBoatRotation = 0;
          $('#draggablePtBoat').addClass('hor');
          $('#draggablePtBoat').removeClass('ver');
        }
        $(this).rotate({ animateTo:ptBoatRotation});
        socket.emit('ptBoatRotation', ptBoatRotation);
        console.log('ptBoatRotation ' + ptBoatRotation);
      }
    }
  });

// checks each ship's placement on the grid if it is a valid location. IE a ship isn't off the grid.
  var checkShipPlacement = function(){
    //check the 2nd char of the grid location
    validHGrid = {
      "draggableAircraftCarrier": [1,2,3,4,5,6],
      "draggableBattleship": [1,2,3,4,5,6,7],
      "draggableDestroyer": [1,2,3,4,5,6,7,8],
      "draggableSubmarine": [1,2,3,4,5,6,7,8],
      "draggablePtBoat": [1,2,3,4,5,6,7,8,9],
    };

    //check the 1st char of the grid location
    validVGrid = {
      "draggableAircraftCarrier": [a,b,c,d,e,f],
      "draggableBattleship": [a,b,c,d,e,f,g],
      "draggableDestroyer": [a,b,c,d,e,f,g,h],
      "draggableSubmarine": [a,b,c,d,e,f,g,h],
      "draggablePtBoat": [a,b,c,d,e,f,g,h,i],
    };
  };

// toggle ships droppable
  var gameReady = function( setTo ){
  // accepts val to set . gameStarted is a global var. Should only be called by player clicking "Ready To Play" button, by starting a new game
    setTo = setTo || gameStarted;
    gameStarted = setTo;
    $( ".ship" ).draggable( "option", "disabled", gameStarted );
    socket.emit('game_status', gameStarted);
  }; // END disable gameReady funct

// "Ready To Play" button.
// On click, set gameStarted to true.
// Dissable ship draggable and rotation.
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
