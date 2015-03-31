$(document).ready(function(){

  var socket = io();

 $('#playerSignIn').modal('show'); // shows the get player's name modal

  // as the user types, populate the client side "Hello xyz" but wait for the sumbit to sent the info to redis
  var playerName = 
    $( "#personsName" ).keyup(function() { // #personsName is the id of the name input field in the modal
      var playerName = $('#personsName').val();
      $( "#userName" ).text( "Hello " + playerName );
    }).keyup();

  // listener for the form submit
  $('form').submit(function(e){
    e.preventDefault();
    var playerName = document.getElementsByTagName("input")[0].value;
// -------if ( SOME CHECK WITH REDIS ) { // don't need to check if playerName is null since the form prevents that.
      
      // document.getElementById("userName").innerHTML = "Hello " + playerName + "!";
      socket.emit(playerName, ' Joined the game.');
// -------}
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
          shotObj.player = person;
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
        document.getElementById("shotPlayer").innerHTML = shotObj.player + " took a shot at " + shotObj.id + " Your turn!";
        // gets the shot fired and updates the gameboard
        // this is klugy, needs a better way...
        var hitArr = document.querySelectorAll('[data-id=' + shotObj.id + ']');
        $(hitArr[1]).css("background-color", "red");
      }
      // else 
      // {
      //   document.getElementById("shotPlayer").innerHTML = shotObj.player + " took a shot at " + shotObj.id + " Your turn!";
      // }
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
    grid: [25, 25],
  });

  // droppable
  $( ".droppable" ).droppable({
    drop: function( event, ui ) {
      var targetElem = $(this).data("id");
      console.log(ui.draggable.attr('id'));
      console.log(targetElem);
      // need to emit targetElem back to server for ship location
    } 
  });

  // the below function keeps it DRY for changing the ship's img when DBL-clicked. Works with 
  function setStyle(_this,offSize,orientation) {
    var imgOrientation = (orientation === 'goVert') ? offSize : '0px;';  // sets the offset
    var currentStyle = $(_this).attr('style'); // gets the inline style that the draggable creates. Using this to reset the "top: xpx;" value
    var pos = currentStyle.indexOf("top: ")+ 5; // gets the position of the needed top: attribute
    currentStyle = currentStyle.slice(0,pos); // removes the old value
    currentStyle = currentStyle + imgOrientation; // adds the new value
    $(_this).attr('style', currentStyle); // applies the new value
  }

  // making the images of the ships rotate on the 'Your Ships' grid
  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
        var _this = this;
        var orientation = ($(_this).attr('src') === '/images/wholeCarrier.png') ? 'goVert' : 'goHoriz'; // determines which orientation to set for the following executables
        setStyle(_this,'105px;',orientation);
        // var imgOrientation = (orientation === 'goVert') ? '105px;' : '0px;';  // sets the offset
        // var currentStyle = $(_this).attr('style'); // gets the inline style that the draggable creates. Using this to reset the "top: xpx;" value
        // var pos = currentStyle.indexOf("top: ")+ 5; // gets the position of the needed top: attribute
        // currentStyle = currentStyle.slice(0,pos); // removes the old value
        // currentStyle = currentStyle + imgOrientation; // adds the new value
        // $(_this).attr('style', currentStyle); // applies the new value
        var src = (orientation === 'goVert') ? '/images/wholeCarrierVert.png' : '/images/wholeCarrier.png'; // toggles between the two images
        $(this).attr('src', src);  // applies the new image
    }
  });  // END rotate Carrier image

  $('#draggableBattleship').on({
    'dblclick': function() {
        var _this = this;
        var orientation = ($(this).attr('src') === '/images/wholeBattleship.png') ? 'goVert' : 'goHoriz';
        setStyle(_this,'57px;',orientation);
        var src = (orientation === 'goVert') ? '/images/wholeBattleshipVert.png' : '/images/wholeBattleship.png';
        $(this).attr('src', src);
    }
  });  // END rotate Battleship image

  $('#draggableDestroyer').on({
    'dblclick': function() {
        var _this = this;
        var orientation = ($(this).attr('src') === '/images/wholeCruiser.png') ? 'goVert' : 'goHoriz';
        setStyle(_this,'45px;',orientation);
        var src = (orientation === 'goVert') ? '/images/wholeCruiserVert.png' : '/images/wholeCruiser.png';
        $(this).attr('src', src);
    }
  });  // END rotate Destroyer image

  $('#draggableSubmarine').on({
    'dblclick': function() {
        var _this = this;
        var orientation = ($(this).attr('src') === '/images/wholeSub.png') ? 'goVert' : 'goHoriz';
        setStyle(_this,'25px;',orientation);
        var src = (orientation === 'goVert') ? '/images/wholeSubVert.png' : '/images/wholeSub.png';
        $(this).attr('src', src);
    }
  });  // END rotate Submarine image

  $('#draggablePtBoat').on({
    'dblclick': function() {
        var _this = this;
        var orientation = ($(this).attr('src') === '/images/wholePatrol.png') ? 'goVert' : 'goHoriz';
        setStyle(_this,'20px;',orientation);
        var src = (orientation === 'goVert') ? '/images/wholePatrolVert.png' : '/images/wholePatrol.png';
        $(this).attr('src', src);
    }
  });  // END rotate Patrol Boat image

  gamePlay();

});
