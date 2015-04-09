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
      name: "AircraftCarrier",
      rotation: 0
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

  $('#playerSignIn').on('shown.bs.modal', function () {
      $('#personsName').focus();
        console.log("test");
  });

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
    var isTrue;

    socket.on('turn', function(controller){ 
      if (controller===true){
        //jquery magic to allow clickable spaces, shoudl be off by default
        console.log("Controller is TRUE");
        isTrue = true;
        $(".opponent").prop('disabled', false);
      }

      if(controller===false){
        //jquery magic to not allow client to click on squares
        console.log("Controller is FALSE");
        isTrue = false;
        $(".opponent").prop('disabled', true);
      }
    });

      // color change on hover
      $("td").mouseover(function(){
        var cellState = $(this).data("state");
        var cellId = $(this).data("id");
        var cellTable = $(this).closest("table").attr("class");
        if (isTrue){
          if (cellId !== "header" && cellState === "unselected" && cellTable === "opponent") {
            $(this).css("background-color", "red");
          }
        }
      });  // end of color change on hover

      // revert color if not clicked
      $("td").mouseleave(function(){
        var cellState = $(this).data("state");
        var cellTable = $(this).closest("table").attr("class");
        if (isTrue){
          if (cellState === "unselected" && cellTable === "opponent") {
            $(this).css("background-color", "lightyellow");  // if not selected change color back
          }
        }
      });  // end of revert color if not clicked

      // select to take a shot
      $("td").click(function(){
        var cellId = $(this).data("id"); // get the cellId for the current cell
        var cellState = $(this).data("state");
        var cellTable = $(this).closest("table").attr("class");

        if (isTrue){

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
        }

      });  // end of select to take a shot

    // update the ship board with other players shots
    socket.on('shot', function(shotObj){

      // Updates the Header UI for who took a shot and the cell location
      if (shotObj.hitORmiss){
        document.getElementById("shotPlayer").innerHTML = shotObj.player + " HIT at " + shotObj.id;
      }
      else {
        document.getElementById("shotPlayer").innerHTML = shotObj.player + " missed at " + shotObj.id;        
      }

      var hitArr = document.querySelectorAll('[data-id=' + shotObj.id + '] img'); // the data-id is the cell, then select imgages.

      if (shotObj.player !== gameObj.playerName) {
        // this is the current shooter

        document.getElementById("userName").innerHTML =  "FIRE " + gameObj.playerName + "!";
        if( shotObj.hitORmiss ){
          $(hitArr[0]).removeClass("hide"); // the hit img
        } else { // this block is the miss scenario
          $(hitArr[1]).removeClass("hide"); // the miss img
        }
      } 
  
      if (shotObj.player === gameObj.playerName) {
        // this is NOT the current shooter

        document.getElementById("userName").innerHTML =  "Not " + gameObj.playerName + "'s turn";
        //var hitArr = document.querySelectorAll('[data-id=' + shotObj.id + '] img'); // the data-id is the cell, then select imgages.
        if( shotObj.hitORmiss ){
          $(hitArr[2]).removeClass("hide"); // the hit img
        } else { // this block is the miss scenario
          $(hitArr[3]).removeClass("hide"); // the miss img
        }
      }

    }); // END of socket.on 'shot'


    socket.on('player1Turn', function(test){
      console.log("player1Turn = " + test);
    });

    //  from server code, need to catch this
    //  socket.broadcast.to(player1).emit('turn',controller)

    // make this into game_status to start or end game
    socket.on('game_status', function( gameOver ){
      if ( gameOver ) {
        document.getElementById("shotPlayer").innerHTML = "Game Over. Thanks for playing."; // Add Play again?
      } else {
      }
    }); 

  } // End of gamePlay function


  // -----   SHIP PLACEMENT AND ROTATION   ----

  $( ".draggableAircraftCarrier" ).draggable({
    snap: ".snapCell",
    snapMode: "inner"
    // containment: "#snaptarget",
    // grid: [13, 13] 
  });

  $( "#draggableBattleship" ).draggable({
    snap: ".snapCell",
    snapMode: "inner"
    // containment: "#snaptarget",
    // grid: [25, 25] 
  });
  $( "#draggableDestroyer" ).draggable({
    snap: ".snapCell",
    snapMode: "inner"
    // containment: "#snaptarget",
    // grid: [25, 25] 
  });
  $( "#draggableSubmarine" ).draggable({
    snap: ".snapCell",
    snapMode: "inner"
    // containment: "#snaptarget",
    // grid: [25, 25] 
  });
  $( "#draggablePtBoat" ).draggable({
    snap: ".snapCell",
    snapMode: "inner"
    // containment: "#snaptarget",
    // grid: [25, 25]
  });


function emitShip(name, cellId, rotation) {

  placedShipObj.name = name;
  placedShipObj.cell = cellId;
  placedShipObj.rotation = rotation;

  console.log("placedShipObj", placedShipObj);  
  socket.emit('place_ship', placedShipObj);
}

$( ".droppable" ).droppable({
  drop: function( event, ui ) {
    var placedShip = ui.draggable.attr('id'); // at this point it is in the form of "draggableAircraftCarrier"
    console.log("placedShip", placedShip);
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
    checkShipPlacement( placedShipObj );
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

    var alphaMap = { "a":1, "b":2, "c":3, "d":4, "e":5, "f":6, "g":7, "h":8, "i":9 }; // associates a number to each character to later calculate the distance of one grid space to another

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
// console.log(placedShip, "is at", parseInt(placedHGrid, 10), "and can be in",validHGrid[ placedShip ]);
      if ( validH === -1 ) {
console.log("not valid Horiz placement");//invalid drop. change change ship_grid location to closest valid value validHGrid[ ship_name.toString() ][ validHGrid[ ship_name.toString() ].length-1 ];
        // correct the grid location here
        // get the last array element of the given ships validHGrid
        var lastValidElement = validHGrid[ placedShip ][ validHGrid[ placedShip ].length-1 ];
// console.log( "lastValidElement", lastValidElement );
        var fixedCell = placedVGrid + lastValidElement.toString(); // add that after the current placedVGrid
// console.log( "fixedCell", fixedCell );
        placedLocation = fixedCell; // placedLocation is a global variable
        // calculate the grid distance of placed cell minus the grid distance of the fixed cell. Needed to relocate the ship on screen's grid
        var placedIndex = parseInt(placedHGrid, 10);
        var fixedIndex = parseInt(lastValidElement, 10);
        var fixedDistance = placedIndex - fixedIndex;
        // multiply by 25 px
        fixedDistance = fixedDistance * 25;
console.log("fixedDistance", fixedDistance);
        // get the draggable style and
        var getTheShip = "#draggable"+ placedShip; //.name;
// console.log("getTheShip", getTheShip);
        var theShipStyle = $(getTheShip).attr('style');
console.log("theShipStyle", theShipStyle);

        // capture the left value within the style string
        var indexLeft = theShipStyle.indexOf("left:");
        var indexTop = theShipStyle.indexOf("top:");
        if( indexLeft < indexTop ){
          var leftString = theShipStyle.slice( indexLeft, indexTop-1);  // gets the whole sub-string ex. "left: 311px;"
          var leftValue = theShipStyle.slice( indexLeft+6, indexTop-4);  // gets just the value... +6 to not take the "left: " and -4 to not take the "px;"
        } else {
          var leftValue = theShipStyle.slice( indexLeft+6, theShipStyle.length-4);
        }
        var newLeftValue = "left: " + (leftValue - fixedDistance).toString() + "px;";
        theShipStyle = theShipStyle.replace(leftString, newLeftValue);  // replace the old "left: xxxpx;" with the new value

        // add the corrected style back to the elements so as to reposition it on the page
        $(getTheShip).attr('style', theShipStyle);




        // once working, add the companion fix to the else block
// var result = str.replace(/top: -?\d+/, "top: " + val.toString() ); // works


      } // END invalid HORIZONTAL placement with ship placement fix

    } else { // VERTICAL
      // use validVGrid
      var validV = validVGrid[ placedShip ].indexOf( placedVGrid );
console.log(placedShip, "is at", placedVGrid, "and can be in",validVGrid[ placedShip ]);
      if ( validV === -1 ) {
console.log("not valid Vert placement");//invalid drop. change change ship_grid location to closest valid value validHGrid[ ship_name.toString() ][ validHGrid[ ship_name.toString() ].length-1 ];
        // correct the grid location here
        // get the last array element of the given ships validVGrid
        var lastValidElement = validVGrid[ placedShip ][ validVGrid[ placedShip ].length-1 ]; // the linter incorrectly thinks this var has already been defined. There is another assignment but inside the conditional. The logic will only use one or the other.
console.log( "lastValidElement", lastValidElement );
        // var fixedCell = lastValidElement + placedHGrid; // I think this is the incorrect code. Suspect needs placedVGrid which is next line
        var fixedCell = lastValidElement + placedHGrid; // add that after the current placedVGrid
console.log( "fixedCell", fixedCell );
        placedLocation = fixedCell;
        // count the difference from placed cell to fixed cell
        var fixedDistance = alphaMap;
console.log( "alphaMap", alphaMap[placedVGrid] );

        // not valid code      validVGrid[ placedShip ].indexOf( parseInt(placedVGrid, 10) ) - validVGrid[ placedShip ].indexOf( parseInt(lastValidElement, 10) );// index of place cell minus the index of the fixed cell
        // multiply by 25 px
        fixedDistance = fixedDistance * 25;
        // get the draggable style and
        var getTheShip = "#draggable"+ placedShip.name;
console.log("getTheShip", getTheShip);
        var theShipStyle = $(getTheShip).attr('style');
console.log("theShipStyle", theShipStyle);
        // subtract the fixed cell distance from the style's location

        //*********          var rightValue = theShipStyle.slice( indexTop, indexLeft-1);

        // add that to the img style
        // once working, add the companion fix to the else block
// var result = str.replace(/top: -?\d+/, "top: " + val.toString() ); // works
// var result2 = str.replace(/left: -?\d+/, "left: " + val.toString() ); // works



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
        $('h4').text(''); 
      }
      else {

        console.log("should prompt user");
      }

    }
  });

  gamePlay();

});
