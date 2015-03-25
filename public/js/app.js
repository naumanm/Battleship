$(document).ready(function() {

  // globals
  var selectedArr = []; // array of all shots

  // color change on hover
  $("td").mouseover(function(){
    var cellState = $(this).data("state");
    var cellId = $(this).data("id");
    console.log(cellState);
    if (cellId !== "header" && cellState === "unselected") {
      $(this).css("background-color", "red");
    }
  });

  // revert color if not clicked
  $("td").mouseleave(function(){
    var cellState = $(this).data("state");
    console.log(cellState);

    if (cellState === "unselected") {
      $(this).css("background-color", "gray");  // if not selected change color back
    }
  });

  // select to take a shot
  // need to use data-state instead of colors
  $("td").click(function(){
    var cellId = $(this).data("id"); // get the cellId for the current cell
    var cellState = $(this).data("state");
    console.log(cellId);
    console.log(cellState);
    if (cellId !== 'header' && cellState === "unselected") {
      //change the cell color to blue
      $(this).css("background-color", "blue");
      $(this).data("state", "miss");
      console.log(cellState);
      if (selectedArr.indexOf(cellId) === -1) { // prevent duplicates in the selectedArr
        selectedArr.push(cellId); // push the selected cell into the selectedArr
        console.log(selectedArr); // for debugging
      }

    }
  });


  function initialize() {
    console.log("board is loaded");
  }

  initialize();

});
