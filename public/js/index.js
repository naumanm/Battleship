$(document).ready(function() {

  function initialize() {
    // var selectedArr = []; // array of all shots

    //clear REDIS tables
    //initialize all variables
    //establish new boat arrays
    navListeners();
    gamePlay();
  }

  function gamePlay() {

    var socket = io();
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
        }
      }
    });  // end of select to take a shot

  } // End of gamePlay function


  // -----   SHIP PLACEMENT AND ROTATION   ----

  function setStyle(_this,offSize,orientation) {
    var imgOrientation = (orientation === 'goVert') ? offSize : '0px;';  // sets the offset
    var currentStyle = $(_this).attr('style'); // gets the inline style that the draggable creates. Using this to reset the "top: xpx;" value
    var pos = currentStyle.indexOf("top: ")+ 5; // gets the position of the needed top: attribute
    currentStyle = currentStyle.slice(0,pos); // removes the old value
    currentStyle = currentStyle + imgOrientation; // adds the new value
    $(_this).attr('style', currentStyle); // applies the new value
  }


  // draggable
  $(function() {
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
  });

  $('.droppable').each(function() {
    console.log("Dropped!");
    var $td = $(this);
    $td.droppable({
      drop: function() {
        $('.droppable').addClass('dropped').
          css({
              top: $td.offset().top,
              left: $td.offset().left
          });
          //$('#grid').addClass('focus');
      }
    });
  });


  // // droppable
  // $( "#droppable" ).droppable({
  //   //accept: ".special",
  //   drop: function( event, ui ) {
  //     console.log("droppable event", event, "droppable ui", ui);
  //     $( this )
  //       // .addClass( "ui-state-highlight" )  // change this. it is leftover from copied example
  //       .find( "p" )  // change this to appropriate notice element
  //         .html( "Dropped!" ); // change this to trigger boat placement check
  //   } 
  // });


  // Christian attempt at making the images of the ships rotate on the Your Ships grid
  $('#draggableAircraftCarrier').on({
    'dblclick': function() {
        var _this = this;
        var orientation = ($(_this).attr('src') === '/images/wholeCarrier.png') ? 'goVert' : 'goHoriz'; // determines which orientation to set for the following executables
        setStyle(_this,'105px;',orientation);
//            var imgOrientation = (orientation === 'goVert') ? '105px;' : '0px;';  // sets the offset
//           var currentStyle = $(_this).attr('style'); // gets the inline style that the draggable creates. Using this to reset the "top: xpx;" value
//          var pos = currentStyle.indexOf("top: ")+ 5; // gets the position of the needed top: attribute
//         currentStyle = currentStyle.slice(0,pos); // removes the old value
//        currentStyle = currentStyle + imgOrientation; // adds the new value
 //       $(_this).attr('style', currentStyle); // applies the new value
        // console.log("new style",this);

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
