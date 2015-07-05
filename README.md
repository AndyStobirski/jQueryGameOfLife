# jQueryGameOfLife
First publish

An jQuery plugin of Conway's Game of Life. Check the html file for implementation, and you see it's pretty simple. 

The grid size, cell size and time between generations (width, height, cell_size and tick_length, respectively) are set using plugin constructor, like so:

````
$("#gol").GameOfLife({width:50,cell_size:16, height:45, tick_length:650});
````

See a working version here: www.evilscience.co.uk/AndyStobirski/jQueryGameOfLife/GameOfLife.html
