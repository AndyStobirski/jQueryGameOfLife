; (function($) {
    var DEFAULT_SETTINGS = {
        prefix: 'GameOfLife_'	
		, width: 25
		, height: 25
		, cell_size: 16
		, tick_length: 250
		, pattern: null
		 
		
    }


    // Additional public (exposed) methods
    var methods = {

        //
        //	pArgs
        //
        init: function(pArgs) {

            var settings = $.extend({}, DEFAULT_SETTINGS, pArgs || {});

            return this.each(function() {
                $(this).data("settings", settings);
                $(this).data("GameOfLifeObject", new $.GameOfLife(this, settings));
            });
        }
    };

    $.fn.GameOfLife = function(method) {

        if (methods[method]) {//method recognised		  
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {//constructor
            return methods.init.apply(this, arguments);
        }
    };


    $.GameOfLife = function(input, settings) {
		
		//game variables stored here
		//$(input).data("settings")
		


		var CELL_STATES = {ALIVE: 1, DEAD: 0};
		var COLOURS = { GRID:"#fff", GRIDLINE:"#8CEFFD", CELL:"#7BCAE1"};
		var CONDITIONS = {MIN:2, MAX: 3, SPAWN:3};

		var $source_element = $(input);
		var $container_element = null;
		var $label_generations = null;
		var $canvas = null;
															
		//game state
		var _Generation = 0;
		var _Cells;
		var _Paused;
		var _Ctx = null;
		
		//used in animation loop
		var _StopMain = null;
		var _LastTick = null;
		var _LastRender = null;
		
		
	    $container_element = $("<div/>")
						.attr("id", $(input).data("settings").prefix + $source_element[0].id )
						.append
						(	
							 $label_generations = $("<div/>")
						)
						//add Canvas
						.append(
							$canvas = $("<canvas>").attr("style", "border:1px black solid")
										.click (function (event){
											
											      var x;
													var y;
													if (event.pageX || event.pageY) {
													  x = event.pageX;
													  y = event.pageY;
													} else {
													  x = event.clientX
														+ document.body.scrollLeft
														+ document.documentElement.scrollLeft;
													  y = event.clientY
														+ document.body.scrollTop
														+ document.documentElement.scrollTop;
													}
											
											
											        x -= _Ctx.canvas.offsetLeft;
													y -= _Ctx.canvas.offsetTop;
																						
											x = Math.floor((x - 1) / $(input).data("settings").cell_size);
											y = Math.floor((y - 1) / $(input).data("settings").cell_size);
																														
											var state = _Cells[y][x] == CELL_STATES.ALIVE ? CELL_STATES.DEAD : CELL_STATES.ALIVE;													
											
											_Cells[y][x] =  state;
											
										})									
						)
						.append("<br/>")
						.append($("<button>").html("Start").click(function(){
							_Paused = false;
						}))						
						//add Stop Button
						.append($("<button>").html("Stop").click(function(){
							_Paused = true;
						}))
						//add Reset Button
						.append($("<button>").html("Reset").click(function(){
							Reset();
						}))
						//add Step Button
						.append($("<button>").html("Step").click(function(){
							Step();
						}));

		_Ctx = $container_element.find("canvas")[0].getContext('2d');
		_Ctx.canvas.width = $(input).data("settings").width * $(input).data("settings").cell_size;
		_Ctx.canvas.height = $(input).data("settings").height * $(input).data("settings").cell_size;
					
        $source_element.after($container_element);
        $source_element.hide();	

		Reset();
		
		
		//Any predefined patterns?
		if ($(input).data("settings").pattern != null){			
			$(input).data("settings").pattern.map(function(p){				
				for (var y = 0 ; y < p.Data.length; y++){
					for (var x = 0 ; x < p.Data[y].length; x++){ 
						_Cells[p.StartY + y][p.StartX + x] = p.Data[y][x];
					}
				}				
			})			
		}

		/*
			Animation loop, described in more detail here: https://developer.mozilla.org/en-US/docs/Games/Anatomy
		*/
		;(function () {
		  function main( tFrame ) {
			_StopMain = window.requestAnimationFrame( main );
			var nextTick = _LastTick + $(input).data("settings").tick_length;
			var numTicks = 0;
				
				//If tFrame < nextTick then 0 ticks need to be updated (0 is default for numTicks).
				//If tFrame = nextTick then 1 tick needs to be updated (and so forth).
				//Note: As we mention in summary, you should keep track of how large numTicks is.
				//If it is large, then either your game was asleep, or the machine cannot keep up.
				if (tFrame > nextTick) {
				  var timeSinceTick = tFrame - _LastTick;
				  numTicks = Math.floor( timeSinceTick / $(input).data("settings").tick_length);
				}

				queueUpdates( numTicks );
				render( tFrame );
				_LastRender = tFrame;
			
		  }

		  function queueUpdates( numTicks ) {
			for(var i=0; i < numTicks; i++) {
			  _LastTick = _LastTick + $(input).data("settings").tick_length; //Now lastTick is this tick.
			  if (!_Paused)
				Step();
			}
		  }

		  _LastTick = performance.now();
		  _LastRender = _LastTick; //Pretend the first draw was on first update.
		  

		  main(performance.now()); // Start the cycle
		})();	
		

	

		
		function Reset(){
			_Generation = 0;
			_Cells = GetGrid();
			_Paused = true;			
			UpdateGenerationLabel();
		}
		
		//
		//	Calculate one Generation
		//		
		function Step(){
			
			var neighbours;
			var nextgen = GetGrid();
			for (var y = 0 ; y < $(input).data("settings").height; y++){
				for (var x = 0 ; x < $(input).data("settings").width; x++){
										
					neighbours =  CountCellNeighbours(x,y);
					
					if (_Cells[y][x] == CELL_STATES.ALIVE){			
													
						if (neighbours >= CONDITIONS.MIN
							&& neighbours <= CONDITIONS.MAX){
							
							nextgen[y][x] = CELL_STATES.ALIVE;
							
						}										
					}	
					else if (neighbours == CONDITIONS.SPAWN ){
						nextgen[y][x] = CELL_STATES.ALIVE;
					}
				}				
			}				

			//now copy over
			for (y = 0 ; y <$(input).data("settings").height; y++){
				_Cells[y] = nextgen[y];					
			}					
						
			_Generation++;
			UpdateGenerationLabel();
															
		}
		
		//
		//	Draw evrything
		//
		function render(){
			
			_Ctx.fillStyle = COLOURS.GRID;		
			_Ctx.fillRect(0,0, _Ctx.canvas.width, _Ctx.canvas.height);
						
			//draw the canvas
			_Ctx.strokeStyle = COLOURS.GRIDLINE;	
			for (var x = 0; x <= $(input).data("settings").width; x++) {
				_Ctx.beginPath();		
				_Ctx.moveTo(x * $(input).data("settings").cell_size, 0);
				_Ctx.lineTo(x * $(input).data("settings").cell_size, _Ctx.canvas.height);		
				_Ctx.stroke();
			}

			
			for (var y = 0; y <= $(input).data("settings").height; y++) {
				_Ctx.beginPath();
				_Ctx.moveTo(0, y * $(input).data("settings").cell_size);
				_Ctx.lineTo(_Ctx.canvas.width, y * $(input).data("settings").cell_size);
				_Ctx.stroke();
			}
			

			//draw the cells
			for (var y = 0; y < $(input).data("settings").height; y++) {
				for (var x = 0; x < $(input).data("settings").width; x++) {
				  if (_Cells[y][x] === CELL_STATES.ALIVE) {

					_Ctx.fillStyle = COLOURS.CELL;
					_Ctx.fillRect(
					x * $(input).data("settings").cell_size +2,
					y * $(input).data("settings").cell_size +2,
					$(input).data("settings").cell_size -4,
					$(input).data("settings").cell_size -4);				
				  }
				}
			}	
			
		}
		
		
		function UpdateGenerationLabel(){
			$label_generations.html("Generations: " + _Generation);
		}

		
		//
		//	Get a blank grid
		//
		function GetGrid(){		
			var g = [];			
			g = new Array ($(input).data("settings").height);
			for (var x=0 ; x < $(input).data("settings").width; x++){			
				g[x] = new Array($(input).data("settings").width);
			}
									
			for (var y=0 ; y < $(input).data("settings").height; y++)
				for (x=0 ; x < $(input).data("settings").width; x++){
					g[y][x] = CELL_STATES.DEAD;
			}
			
			return g;
		}		
		
		//
		//	Return the number of alive neighbours of the specified cell
		//
		//	Note the use of the modulus in the if statement to allow wraparound
		//
		function CountCellNeighbours (cX,cY){		
		
			var t = (_Cells[cY][cX] !== CELL_STATES.DEAD) ? -1 : 0;
		
			for(var y=-1;y < 2; y++){			
				for(var x=-1;x < 2; x++){				
					if (_Cells[($(input).data("settings").height + (cY + y)) % $(input).data("settings").height]
						[($(input).data("settings").width + (cX + x)) % $(input).data("settings").width] === CELL_STATES.ALIVE) {
						t++;	
					}													
				}			
			}						
			return t;			
		}		
		
	
		
    };

} (jQuery));
