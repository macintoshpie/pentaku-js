//////
//GAME CONSTANTS
var blankVal = 0;
var normalDrawWidth = 1
var gridDrawWidth = 3;

//////
//SETUP CANVAS
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

ctx.canvas.width = boardWidth;
ctx.canvas.height = boardHeight;

var canvasx = canvas.getBoundingClientRect().left;
var canvasy = canvas.getBoundingClientRect().top;

ctx.lineWidth = normalDrawWidth;

// add a resize function to the window to update the canvas drawing
addEvent(window, "resize", function(event) {
  resizeCanvas();
});

function resizeCanvas() {
	let update = false;

	if (window.innerWidth < boardWidth) {
		boardWidth = window.innerWidth
		ctx.canvas.width = boardWidth;
		ctx.canvas.height = boardWidth;
		textSize = Math.floor(boardWidth * .05)
		update = true;
	} else if (window.innerWidth >= boardWidth && boardWidth < 600) {
		boardWidth = window.innerWidth > 600 ? 600 : window.innerWidth;
		ctx.canvas.width = boardWidth;
		ctx.canvas.height = boardWidth;
		textSize = Math.floor(boardWidth * .05)
		update = true;
	}

	if (update && currentGame) {
		currentGame.cellSize = boardWidth / currentGame.nCols
		currentGame.gridCellSize = currentGame.rotateDiameter * currentGame.cellSize
		//adjust cells
		currentGame.board.forEach( row => {
			row.forEach( cell => {
				cell.x = cell.j*currentGame.cellSize;
				cell.y = cell.i*currentGame.cellSize;
			})
		})
		//adjust grid
		currentGame.grid.forEach( gridCell => {
			gridCell.x = gridCell.j*currentGame.gridCellSize;
			gridCell.y = gridCell.i*currentGame.gridCellSize;
			gridCell.width = currentGame.gridCellSize;
			gridCell.height = currentGame.gridCellSize;
		})
		//remove overlay and change move if rotating
		if (currentGame.currentAction === "chooseRotate") {
			clearOverlay();
			currentGame.currentAction = "rotate";
		}
	}
}


//////
//CANVAS CLICK EVENT
canvas.addEventListener('click', (e) => {

	if (currentGame.aiPlaying == false || currentGame.winner != undefined) {

		let mousePos = getMousePos(e);

		//Check overlay content, if there is any
		if (currentGame.overlay != null) {
			currentGame.overlay.forEach( element => {
				if (isIntersect(mousePos, element)) {
					//Call element's action if it has one
					if (element.action) {
						element.action();
					}
				}
			});
		}
		//Check the grid, if choosing a rotation location
		else if (currentGame.currentAction == "rotate") {
			currentGame.grid.forEach( gridCell => {
				if (isIntersect(mousePos, gridCell)) {
					let linkedCell = currentGame.board[gridCell.linkedCelli][gridCell.linkedCellj];
					
					createRotationChoices(gridCell, linkedCell);

					gridCell.hilight = 0;

					nextMove();
				}
			});
		}
		//Otherwise, check the individual board cells
		else {
			currentGame.board.forEach( row => {
				row.forEach(cell => {
					if (isIntersect(mousePos, cell)) {
						//Place player's token in cell and check for a win
						cell.value = currentGame.currentPlayer;
						let winner = checkForWin(cell);
						if(winner) {
							endGame(winner);
							return;
						}

						if(boardIsFull() && currentGame.rotateRadius == 0) {
							endGame(false);
							return
						}

						cell.hilight = 0;
						
						nextMove();
					}
				});
			});
		}
	}
});


//////
//CANVAS HOVER EVENT
canvas.onmousemove = function(e) {

	if (currentGame.winner == undefined && currentGame.aiPlaying == false) {

		let mousePos = getMousePos(e);

		//if placing a piece, hilight the cell player is hovering over
		if (currentGame.currentAction == "place") {
			currentGame.board.forEach( row => {
				row.forEach(cell => {
					if (isIntersect(mousePos, cell) && cell.value == blankVal) {
						cell.hilight = 1;
					} else {
						cell.hilight = 0;
					}
				});
			});

		}

		//if choosing a rotation grid, hilight the grid player is hovering over
		else if (currentGame.currentAction == "rotate") {
			currentGame.grid.forEach( gridCell => {
				if (isIntersect(mousePos, gridCell)) {
					gridCell.hilight = 1;
				} else {
					gridCell.hilight = 0;
				}
			})
		}
	}
}


//////
//BASIC UTILITY FUNCTIONS
/**
* returns true if a value is in the array, otherwise it returns false
*/
function inArray(value, array) {
	return array.indexOf(value) > -1;
}

/**
* returns the the position of the mouse
*/
function getMousePos(e) {
	let rect = canvas.getBoundingClientRect();
	return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
}

/**
* determines if the mouse position is within the bounds of the object
*/
function isIntersect(mousePos, cell) {

	let cellWidth = cell.width || currentGame.cellSize;
	let cellHeight = cell.height || currentGame.cellSize;

	let withinX = mousePos.x >= cell.x && mousePos.x < (cell.x + cellWidth),
		withinY = mousePos.y >= cell.y && mousePos.y < (cell.y + cellHeight);

	if (withinX && withinY) {
		return true;
	} else {
		return false;
	}
}

/**
* Used to add an event to an object
*/
function addEvent (object, type, callback) {
    if (object == null || typeof(object) == 'undefined') return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
}

/**
* pauses processing wen called
*/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


//////
//GAME FUNCTIONS
/**
* returns true if the board has no blank spaces, false otherwise
*/
function boardIsFull() {
	for (let row=0; row<currentGame.board.length; row++) {
		for (let cell=0; cell<currentGame.board[row].length; cell++){
			if (currentGame.board[row][cell].value == blankVal) {
				//a blank cell was found
				return false;
			}
		}
	}
	//no blank cells were found
	return true;
}

/**
* checks the 8 cells surrounding the centerCell for a win. Returns true if ther
* was a win, false otherwise
*/
function checkPerimeterForWin(centerCell) {
	let radius = currentGame.rotateRadius;

	let firstRow = centerCell.i-radius,
		firstCol = centerCell.j-radius;

	for(let i=0; i<currentGame.rotateDiameter; i++) {
		for(let j=0; j<currentGame.rotateDiameter; j++) {
			//Booleans for whether or not the cell is on the edge of a grid cell
			let onHorizontalEdge = ((i == 0) || (i == currentGame.rotateDiameter-1));
			let onVerticalEdge = ((j == 0) || (j == currentGame.rotateDiameter-1));

			if (onHorizontalEdge || onVerticalEdge) {
				let celli = firstRow + i;
				let cellj = firstCol + j;

				let winner = checkForWin(currentGame.board[celli][cellj]);
				if (winner) {
					//return winner player num
					return winner;
				}
			}
		}
	}
	// if a win was not found, return false
	return false;
}

/**
* adds rotation choices to the games overlay property
*/
function createRotationChoices(gridCell, linkedCell) {
	
	let diameter = currentGame.rotateDiameter;
	let choiceBoxHeight = (currentGame.cellSize * diameter);
	let choiceBoxWidth = choiceBoxHeight / 2;

	let imageSize = choiceBoxWidth - Math.floor(choiceBoxWidth * 0.3);
	let imageXOffset = (choiceBoxWidth - imageSize) / 2;
	let imageYOffset = (choiceBoxHeight - imageSize) / 2;

	//Create rotation option objects
	let counterclockwise = {
		x: gridCell.x, 
		y: gridCell.y, 
		width: choiceBoxWidth, 
		height: choiceBoxHeight, 
		action: function() {
			//rotate matrix in the desired direction
						rotateCells(linkedCell, "counterclockwise");

						//removeOptions
						clearOverlay();

						//Check the perimeter of grid square for win
						winner = checkPerimeterForWin(linkedCell);
						if (winner) {
							endGame(winner);
							return;
						}
						if (boardIsFull()) {
							endGame(false);
							return;
						}

						nextMove();
		},
		linkedCell: linkedCell, 
		linkedImage: {
			img: counterclockwiseImg,
			width: imageSize,
			height: imageSize,
			x: gridCell.x + imageXOffset,
			y: gridCell.y + imageYOffset
			}
		};

	let clockwise = {
		x: gridCell.x + choiceBoxWidth, 
		y: gridCell.y, 
		width: choiceBoxWidth, 
		height: choiceBoxHeight, 
		action: function() {
			//rotate matrix in the desired direction
						rotateCells(linkedCell, "clockwise");

						//removeOptions
						clearOverlay();

						//Check the perimeter of grid square for win
						let winner = checkPerimeterForWin(linkedCell)
						if (winner) {
							endGame(winner);
							return;
						}
						if (boardIsFull()) {
							endGame(false);
							return;
						}

						nextMove();
		},
		linkedCell: linkedCell, 
		linkedImage: {
			img: clockwiseImg,
			width: imageSize,
			height: imageSize,
			x: gridCell.x + choiceBoxWidth + imageXOffset,
			y: gridCell.y + imageYOffset
			}
		};
	currentGame.overlay = [clockwise, counterclockwise];
	
}

/**
* sets the game's overlay property to null
*/
function clearOverlay() {
	currentGame.overlay = null;
}

/**
* rotates the 8 cells surrounding the centerCell 90 degrees in the direcion specified
*/
function rotateCells(centerCell, direction) {
	if (direction == "counterclockwise") {
		rotateCellsClockwise(centerCell, 3);
	} else {
		rotateCellsClockwise(centerCell, 1);
	}
}

/**
* rotates the 8 cells surrounding the center cell 90 degrees clockwise, nRotations times
*/
function rotateCellsClockwise(centerCell, nRotations) {
	if (nRotations != 0) {
		let radius = currentGame.rotateRadius;

		let diameter = currentGame.rotateDiameter;

		//Make temporary matrix to perform rotation
		let newMatrix = new Array(diameter);
		for (let i=0; i<diameter; i++) {
			newMatrix[i] = new Array(diameter);
		}

		let firstRow = centerCell.i-radius,
			firstCol = centerCell.j-radius,
			lastCol = centerCell.j+radius;

		//Fill temporary matrix with values from the board
		for (let ii = 0; ii < diameter; ii++) {
			newMatrix[ii] = currentGame.board[firstRow + ii].slice(firstCol, lastCol + 1);
		}

		//Rotate the matrix
		newMatrix = rotateMatrix(newMatrix, diameter);

		//Edit i, j, x, and y then insert into the game board
		newMatrix.forEach( function(row, i) {
			row.forEach( function(cell, j) {
				//update cell
				cell.i = firstRow + i;
				cell.j = firstCol + j;
				cell.x = cell.j*currentGame.cellSize;
				cell.y = cell.i*currentGame.cellSize;

				//insert cell into game board
				currentGame.board[cell.i][cell.j] = cell;
			});
		});

		//Recursive call
		rotateCellsClockwise(centerCell, nRotations - 1);
	}
}

/**
* rotates a square matrix of size n 90 degrees clockwise
*/
function rotateMatrix(matrix, n) {
	let rotated = new Array(n);
	
	for (let i=0; i<n; i++) {
		rotated[i] = new Array(n);
	}

	for (let i = 0; i < n; ++i) {
		for (let j = 0; j < n; ++j) {
			rotated[i][j] = matrix[n - j - 1][i];
			rotated[i][j].i = i;
			rotated[i][j].j = j;
		}
	}

	return rotated;
}

/**
* ends the current game and updates the scoreboard if it wasn't a tie
*/
function endGame(winner) {
	let gameNotice;
	if (winner) {
		currentGame.winner = winner;

		let winnerName = currentGame.players[winner].name
		gameNotice = currentGame.players[winner].name + " wins!";

		//update scores
		for (let pNum in currentGame.players) {
			if (currentGame.players.hasOwnProperty(pNum)) {

				let playerName = currentGame.players[pNum].name

				if (pNum == winner) {
					if (scoreTracker[playerName]) {
						scoreTracker[playerName].wins += 1;
					} else {
						scoreTracker[playerName] = {
							wins: 1,
							losses: 0
						}
					}
				}
				else {
					if (scoreTracker[playerName]) {
						scoreTracker[playerName].losses += 1
					} else {
						scoreTracker[playerName] = {
							wins: 0,
							losses: 1
						}
					}
				}
			}
		}
		
		//Update scoreboard
		refreshScoreboard();

	} else {
		gameNotice = "Tie!";
		currentGame.winner = 0;
	}

	//Update the game winner scores
	//...
	
	//create overlay for starting the next game
	let endGameOverlay = {
		x: 0,
		y: 0,
		width: boardWidth,
		height: boardHeight,
		linkedText: {
			text: gameNotice,
			color: fontColor,
			font: textSize.toString() + "px Arial",
			x: boardWidth / 2,
			y: boardHeight / 4
		}
	};

	let startNextGameOverlay = {
		x: 0,
		y: 0,
		width: boardWidth,
		height: boardHeight,
		color: "rgba(0,0,0,0)",
		linkedText: {
			text: "(click on board to start next game)",
			color: fontColor,
			font: textSize.toString() + "px Arial",
			x: boardWidth / 2,
			y: boardHeight / 4 * 2
		},
		action: function() {startNewGame(false);}
	};

	currentGame.overlay = [endGameOverlay, startNextGameOverlay];
}

/**
* Starts a new game with the current input options. Score is cleared if resetScore is true
*/
function startNewGame(resetScore) {
	currentGame = newGame(getInputOptions())
	if (resetScore) {
		//reset scores
		scoreTracker = {};

		for (let pNum in currentGame.players) {
			if (currentGame.players.hasOwnProperty(pNum)) {
				let pName = currentGame.players[pNum].name;
				scoreTracker[pName] = {
					wins: 0,
					losses: 0
				}
			}
		}
		
		refreshScoreboard();
	}

	nextPlayer();

	if (drawInterval) {
		clearInterval(drawInterval);
	}

	drawInterval = setInterval(currentGame.drawFunc, 10)
}

/**
* returns true if there is a continuous line >= the winning length (nLine) that cell is a part of
*/
function checkForWin(cell) {

	let directions = {
					N: {rowStep: -1, colStep: 0, len: 0, opposite: 'S'},
					S: {rowStep: 1, colStep: 0, len: 0, opposite: 'N'},
					E: {rowStep: 0, colStep: 1, len: 0, opposite: 'W'},
					W: {rowStep: 0, colStep: -1, len: 0, opposite: 'E'},
					NW: {rowStep: -1, colStep: -1, len: 0, opposite: 'SE'},
					SE: {rowStep: 1, colStep: 1, len: 0, opposite: 'NW'},
					NE: {rowStep: -1, colStep: 1, len: 0, opposite: 'SW'},
					SW: {rowStep: 1, colStep: -1, len: 0, opposite: 'NE'}
					};


	let i = cell.i;
	let j = cell.j;
	let value = cell.value;
	if (value == blankVal) {
		return false;
	}
	else {

		for (var dir in directions) {
			let ii = i;
			let jj = j;
			let currentCellVal = currentGame.board[ii][jj].value;
			let lineLength = 0;
			while ((currentCellVal == value) && (lineLength<=currentGame.nLine)) {

				ii += directions[dir].rowStep;
				jj += directions[dir].colStep;
				try {
					currentCellVal = currentGame.board[ii][jj].value;
				}
				catch(TypeError) {
					currentCellVal = undefined;
				}
				lineLength += 1;

			}

			directions[dir].len = lineLength;

			//check if sum of len with of its opposite direction is enough to win
			//Subtract 1 because the center cell is counted both times
			let oppositeDir = directions[dir].opposite;
			if ((directions[dir].len + directions[oppositeDir].len - 1) >= currentGame.nLine) {
				//return the player number
				return value;
			}
		}
		//return false if no winning line
		return false;
	}
}

/**
* updates the current action and goes to the next player when appropriate
*/
function nextMove() {
	let turnSeqLen = currentGame.turnSequence.length;
	nextIndex = (currentGame.turnSequence.indexOf(currentGame.currentAction) + turnSeqLen + 1) % turnSeqLen
	currentGame.currentAction = currentGame.turnSequence[nextIndex];

	if (nextIndex == 0) {
		nextPlayer();
	}

	//updateStatus(currentGame.players[currentGame.currentPlayer].name + "'s turn");
}

/**
* updates currentPlayer to the next in the list, and sets current action to "place"
*/
function nextPlayer() {
	nextP = currentGame.currentPlayer + 1;
	currentGame.currentPlayer = (nextP <= currentGame.nPlayers) ? nextP : 1;
	currentGame.currentAction = "place";

	updateStatus(currentGame.players[currentGame.currentPlayer].name + "'s turn");

	if (currentGame.players[currentGame.currentPlayer].ai) {
		takeAiTurn();
	}
}

/**
* adds an overlay indicating that the bot is making a move
*/
function waitOverlay() {
	let element = {
		x: 0,
		y: 0,
		width: boardWidth,
		height: boardHeight,
		linkedText: {
			text: "waiting for bot...",
			color: fontColor,
			font: textSize.toString() + "px Arial",
			x: boardWidth / 2,
			y: boardHeight / 4
		}
	};

	return element;
}

/**
* disables input for the user while getting and playing moves for the current ai player.
*/
function takeAiTurn() {
	//Disable stuff for human player...
	currentGame.aiPlaying = true;
	currentGame.overlay = [waitOverlay()];

	let winner = false;

	aimove = currentGame.players[currentGame.currentPlayer].ai.getMove(currentGame.board);


	setTimeout(function() {placeAiTurn(aimove)}, 1000);
}

function placeAiTurn(aimove) {

	//Place cell
	currentGame.board[aimove.placement.i][aimove.placement.j].value = currentGame.currentPlayer;


	//Check for win
	winner = checkForWin(currentGame.board[aimove.placement.i][aimove.placement.j])

	setTimeout(function() {rotateAi(aimove)}, 1000);
}

function rotateAi(aimove) {

	//If rotating in game
	if (currentGame.rotateRadius > 0) {
		let celli = currentGame.grid[aimove.rotateLoc].linkedCelli;
		let cellj = currentGame.grid[aimove.rotateLoc].linkedCellj;

		let centerRotateCell = currentGame.board[celli][cellj];
		
		rotateCells(centerRotateCell, aimove.rotateDir);
		//Check for win
		winner = checkPerimeterForWin(centerRotateCell)
	}

	if (winner) {
		endGame(winner);
		return;
	}
	if (boardIsFull()) {
		endGame(false);
		return;
	}

	currentGame.aiPlaying = false;
	clearOverlay();

	nextPlayer();
}

/**
* returns a new game board
*/
function newGameboard(nRows, nCols, cellSize) {
	let gameBoard = new Array(nRows);
	
	for (var i=0; i<nRows; i++) {
		gameBoard[i] = new Array(nCols);
	}

	for (var i=0; i<nRows; i++) {
		for (var j=0; j<nCols; j++) {
			gameBoard[i][j] = {
				i: i,
				j: j,
				x: j*cellSize,
				y: i*cellSize,
				value: blankVal,
				hilight: 0
			};
		}
	}
	return gameBoard;
}

/**
* returns a new rotation grid
*/
function newGrid(nRows, nCols, cellRadius, cellSize) {
	let grid = [];
	let gridCellDiameter = (cellRadius * 2) + 1;
	let gridCellSize = gridCellDiameter * cellSize;
	for (let i=0; i<nRows; i++) {
		for (let j=0; j<nCols; j++) {
			tempBox = {
				i: i,
				j: j,
				x: j * gridCellSize,
				y: i * gridCellSize,
				width: gridCellSize,
				height: gridCellSize,
				linkedCelli: (i * gridCellDiameter) + cellRadius,
				linkedCellj: (j * gridCellDiameter) + cellRadius,
				hilighted: 0
			};
			grid.push(tempBox);
		}
	}
	return grid;
}

/**
* returns a new bot
*/
function newAi(player, playerNum, game) {
	if (player.type === "random bot") {
		return new zombieAi(playerNum, game);
	}
	if (player.type === "ok bot") {
		return new defenseAi(playerNum, game);
	}
}

/**
* returns true if the board game parameters are valid/compatible, false otherwise 
*/
function isValidGame(options) {
	let rotateDiameter = options.rotateRadius * 2 + 1
	let errorMsg = undefined;
	//Check rotationRadius and nCols and nRows are compatible
	if (options.rotateRadius != 0) {
		//rotateRadius must be odd
		if (rotateDiameter % 2 != 1) {
			errorMsg = "rotateRadius must be odd" 
		}

		if (options.nRows % rotateDiameter != 0) {
			errorMsg = "nRows must be divisible by radiusDiameter"
		}

		if (options.nCols % rotateDiameter != 0) {
			errorMsg = "nCols must be divisible by radiusDiameter"
		}
	}

	if (options.nLine > Math.min(options.nCols, options.nRows)) {
		errorMsg = "nLine cannot be larger than the smallest board dimension (nRows or nCols)"
	}

	if (errorMsg != undefined){
		throw errorMsg;
	}
	else {
		return true
	}
}

/**
* returns a new game object
*/
function newGame(gameOptions) {
	if (isValidGame(gameOptions)) {
		let game = {
				nPlayers: gameOptions.nPlayers,
				currentPlayer: gameOptions.nPlayers,
				currentAction: 'place',
				winner: undefined,
				nRows: gameOptions.nRows,
				nCols: gameOptions.nCols,
				nLine: gameOptions.nLine,
				cellSize: boardWidth/Math.max(gameOptions.nRows, gameOptions.nCols),
				rotateRadius: gameOptions.rotateRadius
				}
		if (game.rotateRadius != 0) {
			game.turnSequence = ["place", "rotate", "chooseRotate"];
			game.rotateDiameter = (game.rotateRadius * 2) + 1;
			game.nRotateRows = game.nRows / game.rotateDiameter;
			game.nRotateCols = game.nCols / game.rotateDiameter;
			game.grid = newGrid(game.nRotateRows, game.nRotateCols, game.rotateRadius, game.cellSize);
			game.gridCellSize = game.rotateDiameter * game.cellSize;
			game.drawFunc = drawWithGrid;
		} else {
			game.turnSequence = ["place"];
			game.rotateDiameter = 0;
			game.nRotateRows = null;
			game.nRotateCols = null;
			game.grid = null;
			game.drawFunc = drawNoGrid;
		}

		game.board = newGameboard(game.nRows, game.nCols, game.cellSize)

		//create game bots
		game.players = gameOptions.players
		for (let playerNum in game.players) {
			if (game.players.hasOwnProperty(playerNum)) {

				if (game.players[playerNum].type !== "human") {
					game.players[playerNum].ai = newAi(game.players[playerNum], playerNum, game)
				}
			}
		}
		game.aiPlaying = false;

		return game;
	}
	else {
		return null;
	}
	
}

/**
* adds an overlay. to be used when creating a new game...
*/
function previewGame() {
	//add a preview overlay
	let previewOverlay = {
			x: 0,
			y: 0,
			width: boardWidth,
			height: boardHeight,
			linkedText: {
				text: "preview...",
				color: fontColor,
				font: textSize.toString() + "px Arial",
				x: boardWidth / 2,
				y: boardHeight / 4
			}
		};

	currentGame.overlay = [previewOverlay];

	if (drawInterval) {
		clearInterval(drawInterval);
	}

	drawInterval = setInterval(currentGame.drawFunc, 10)
}


//////
//DRAW FUNCTIONS
/**
* draws the entire game board cells and player pieces
*/
function drawBoard() {
	currentGame.board.forEach( row => {
		row.forEach(cell => {
			//let color = blankColor;
			let pNum = currentGame.currentPlayer
			let color = currentGame.players[cell.value] ? currentGame.players[cell.value].color : blankColor;
			drawCell(cell, color);
		})
	});
}

/**
* draws a cell and its player piece, if there is one
*/
function drawCell(cell, color) {

	//Draw gameboard background cell
	ctx.fillStyle = blankColor;
	ctx.beginPath();
	ctx.rect(cell.j*currentGame.cellSize, cell.i*currentGame.cellSize, currentGame.cellSize, currentGame.cellSize);
	ctx.fill();
	ctx.strokeStyle = borderColor;
	ctx.stroke();

	let piecePosOffset = currentGame.cellSize / 2;
	let pieceRadius = (currentGame.cellSize / 2) - 3;

	if (cell.hilight) {
		// ctx.fillStyle = hilightColor;
		// ctx.fill();
		
		ctx.beginPath();
		ctx.fillStyle = currentGame.players[currentGame.currentPlayer].color;
		ctx.arc(cell.x + piecePosOffset, cell.y + piecePosOffset, pieceRadius, 0, 2*Math.PI);
		ctx.fill();
		ctx.closePath()
	}
	ctx.closePath();

	//Draw player piece
	if (cell.value!= blankVal) {
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(cell.x + piecePosOffset, cell.y + piecePosOffset, pieceRadius, 0, 2*Math.PI);
		ctx.fill();
		ctx.closePath()
	}
	
}

/**
* draws overlay content, if there is any
*/
function drawOverlay() {
	if (currentGame.overlay) {
		currentGame.overlay.forEach( element => {
			drawElement(element);
		});
	}
}

/**
* draws an element of the overlay content
*/
function drawElement(element) {

	ctx.beginPath();

	ctx.rect(element.x, element.y, element.width, element.height);

	ctx.strokeStyle = borderColor;
	ctx.stroke();

	if (element.color) {
		ctx.fillStyle = element.color;
	} else {
		ctx.fillStyle = overlayColor;
	}
	
	ctx.fill();
	
	if (element.linkedImage) {
		let image = element.linkedImage;

		ctx.drawImage(image.img, image.x, image.y, image.width, image.height);
	}
	else if (element.linkedText) {
		text = element.linkedText;
		ctx.fillStyle = text.color;
		ctx.font = text.font;
		ctx.textAlign = "center";
		ctx.fillText(text.text, text.x, text.y);
	}
	
	ctx.closePath();

}

/**
* draws all cells of the rotation grid
*/
function drawGrid() {
	currentGame.grid.forEach( gridCell => {
		drawGridCell(gridCell)
	})
}

/**
* draws a single cell of the rotation grid
*/
function drawGridCell(gridCell) {
	ctx.beginPath();

	ctx.rect(gridCell.x, gridCell.y, currentGame.gridCellSize, currentGame.gridCellSize);

	ctx.strokeStyle = gridBorderColor;
	ctx.lineWidth=gridDrawWidth;
	ctx.stroke();

	ctx.lineWidth=normalDrawWidth;	
	
	if (gridCell.hilight) {
		ctx.fillStyle = gridHilightColor;
		ctx.fill();
	}

	ctx.closePath();
}

/**
* root drawing function which draws the entire board. This function is used
* when the game includes a rotation grid
*/
function drawWithGrid() {
	ctx.clearRect(0, 0, boardWidth, boardWidth);
	if (currentGame != null) {
		
		drawBoard();

		drawGrid();

		drawOverlay();
	}
}

/**
* root drawing function which draws the entire board. This function is used
* when the game DOES NOT include a rotation grid
*/
function drawNoGrid() {
	ctx.clearRect(0, 0, boardWidth, boardWidth);
	if (currentGame != null) {

		drawBoard();	

		drawOverlay();
	}
}


//////
//INITIALIZE GAME
var currentGame;
var drawInterval = undefined;
//Setup the input as myOptions
setBoardInputOptions(myOptions, false);
//Make sure everything is drawn to the right size initially
resizeCanvas();
//Start the game
startNewGame(true);