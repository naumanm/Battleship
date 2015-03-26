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
    });

    // revert color if not clicked
    $("td").mouseleave(function(){
      var cellState = $(this).data("state");
      if (cellState === "unselected") {
        $(this).css("background-color", "gray");  // if not selected change color back
      }
    });

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
    });
  }  

  function initialize() {
    gamePlay();
  }

  initialize();

});
