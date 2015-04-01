$(document).ready(function(){

// objects to emit to backend
var aircraftCarrier = {
  name: "aircraftCarrier",
  cell: "",
  rotation: "0"
};
var battleship = {
  name: "battleship",
  cell: "",
  rotation: "0"
};
var destroyer = {
  name: "destroyer",
  cell: "",
  rotation: "0"
};
var submarine = {
  name: "submarine",
  cell: "",
  rotation: "0"
};
var ptBoat = {
  name: "ptBoat",
  cell: "",
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

$( ".droppable" ).droppable({
  drop: function( event, ui ) {
    var targetElem = $(this).data("id");
    var placedShip = ui.draggable.attr('id'); // at this point it is in the form of "draggableAircraftCarrier"

    // remove "draggable" from the passed ship's name
    placedShip = placedShip.slice( 9, placedShip.length ); //  remove 'draggable'
    console.log( placedShip ); // this is the ship that was placed
    socket.emit('shipName', placedShip);

    console.log( targetElem ); // this is the grid location the ship was placed
    socket.emit('shipLocation', targetElem);

    // need to emit targetElem back to server for ship location
    var placedShipObj = {};
    placedShipObj.name = placedShip;
    placedShipObj.location = targetElem;
    socket.emit('place_ship', placedShipObj);
  } // END of drop definition
}); // END of droppable

  // ship rotation

  // making the images of the ships rotate on the 'Your Ships' grid
  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (aircraftCarrierRotation === 0) {aircraftCarrierRotation +=90;}
        else {aircraftCarrierRotation = 0;}
        $(this).rotate({ animateTo:aircraftCarrierRotation});
        socket.emit('aircraftCarrierRotation', aircraftCarrierRotation);
        console.log('aircraftCarrierRotation ' + aircraftCarrierRotation);
      }
    }
  });

  $('#draggableBattleship').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (battleshipRotation === 0) {battleshipRotation +=90;}
        else {battleshipRotation = 0;}
        $(this).rotate({ animateTo:battleshipRotation});
        socket.emit('battleshipRotation', battleshipRotation);
        console.log('battleshipRotation ' + battleshipRotation);
      }
    }
  });

  $('#draggableDestroyer').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (destroyerRotation === 0) {destroyerRotation +=90;}
        else {destroyerRotation = 0;}
        $(this).rotate({ animateTo:destroyerRotation});
        socket.emit('destroyerRotation', destroyerRotation);
        console.log('destroyerRotation ' + destroyerRotation);
      }
    }
  });

  $('#draggableSubmarine').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (submarineRotation === 0) {submarineRotation +=90;}
        else {submarineRotation = 0;}
        $(this).rotate({ animateTo:submarineRotation});
        socket.emit('submarineRotation', submarineRotation);
        console.log('submarineRotation ' + submarineRotation);
      }
    }
  });

  $('#draggablePtBoat').on({
    'dblclick': function() {
      if( !gameStarted ){
        if (ptBoatRotation === 0) {ptBoatRotation +=90;}
        else {ptBoatRotation = 0;}
        $(this).rotate({ animateTo:ptBoatRotation});
        socket.emit('ptBoatRotation', ptBoatRotation);
        console.log('ptBoatRotation ' + ptBoatRotation);
      }
    }
  });

// toggle ships droppable
  var gameReady = function( setTo ){
// console.log("setTo", setTo);
    // accepts val to set . gameStarted is a global var. Should only be called by player clicking "Ready To Play" button, by starting a new game
    setTo = setTo || gameStarted;
    gameStarted = setTo;
//  Christian testing***********************************************************************
    gameStarted = true;  
//  Christian testing***********************************************************************
// console.log("gameStarted", gameStarted);
    $( ".ship" ).draggable( "option", "disabled", gameStarted );
  }; // END disable gameReady funct

// enable opponent's grid for shoots on connect of 2nd player or when player clicks ready to play?
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
