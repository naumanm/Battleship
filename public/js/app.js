$(document).ready(function() {

  // globals
  var selectedArr = []; // array of all shots

  // color change on hover
  $("td").mouseover(function(){
    var color = $( this ).css( "background-color" );
    if (color !== "rgb(0, 0, 255)") {
      console.log(color);
      $(this).css("background-color", "red");
    }
  });

  // revert color if not clicked
  $("td").mouseleave(function(){
    if ($(this).css("background-color") !== "rgb(0, 0, 255)") { // check to see if the cell has already been clicked
      $(this).css("background-color", "gray");  // if not selected change color back
    }
  });

  // select to take a shot
  $("td").click(function(){
    var cellId = $(this).data("id"); // get the cellId for the current cell
    if (selectedArr.indexOf(cellId) === -1) { // prevent duplicates in the selectedArr
      selectedArr.push(cellId); // push the selected cell into the selectedArr
      console.log(selectedArr); // for debugging
    }
    $(this).css("background-color", "blue"); // change the cell color
  });


  function initialize() {
    console.log("board is loaded");
  }

  initialize();

});
