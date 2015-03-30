$(document).ready(function() {

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
        $(this).css("background-color", "blue");
        $(this).data("state", "miss");
        if (selectedArr.indexOf(cellId) === -1) { // prevent duplicates in the selectedArr
          selectedArr.push(cellId); // push the selected cell into the selectedArr
          var shotObj = {};
          shotObj.player = person;
          shotObj.id = cellId;
          socket.emit('shot', shotObj);
        }
      }
    });  // end of select to take a shot

  } // End of gamePlay function


  function initialize() {
    // var selectedArr = []; // array of all shots

    //clear REDIS tables
    //initialize all variables
    //establish new boat arrays
    navListeners();
    gamePlay();
  }


  // make ships draggable
  $(function() {
    $( "#draggableAircraftCarrier" ).draggable({ snap: "#snaptarget", grid: [25, 25] });
    $( "#draggableBattleship" ).draggable({ snap: "#snaptarget", grid: [25, 25] });
    $( "#draggableDestroyer" ).draggable({ snap: "#snaptarget", grid: [25, 25] });
    $( "#draggableSubmarine" ).draggable({ snap: "#snaptarget", grid: [25, 25] });
    $( "#draggablePtBoat" ).draggable({ snap: "#snaptarget", grid: [25, 25] });
  });



  gamePlay();

});
