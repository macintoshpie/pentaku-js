var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var noticeText = document.getElementById("notice");

var counterclockwiseImg = document.getElementById('counterclockwiseImg');
var clockwiseImg = document.getElementById('clockwiseImg');


var boardWidth = 600,
	boardHeight = boardWidth;

ctx.canvas.width = boardWidth;
ctx.canvas.height = boardHeight;

var textSize = 30;

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

	if (update) {
		if (currentGame) {
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
}

var canvasx = canvas.getBoundingClientRect().left;
var canvasy = canvas.getBoundingClientRect().top;

ctx.lineWidth = 1;

var rotateChoices = ["counterclockwise", "clockwise"];

//Colors
var overlayColor = "rgba(0,0,0,.1)";
var gridBorderColor = "rgba(99,140,204,1)";
var gridHilightColor = "rgba(0,0,0,.1)";
var fontColor = "rgba(255,255,255,1)";

var colorDict = {
	"purple": "rgba(171,98,192,1)",
	"orange": "rgba(197,124,60,1)",
	"green": "rgba(114,165,85,1)",
	"red": "rgba(202,86,112,1)"
}

var gameHeader = document.getElementById("gameHeader");

var scoreTable = document.createElement("table");

gameHeader.appendChild(scoreTable);

canvas.addEventListener('click', (e) => {

	if (currentGame.aiPlaying == false || currentGame.winner != undefined) {

		const mousePos = getMousePos(e);

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
		//Check gameboard, if there is no overlay content
		else {
			currentGame.board.forEach( row => {
				row.forEach(cell => {
					if (isIntersect(mousePos, cell)) {
						if (currentGame.currentAction == "rotate" && canRotate(cell)) {

							createRotationChoices(cell);

							nextMove();

						} else if (currentGame.currentAction == "place" && cell.value == blankVal) {
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
						} else if (currentGame.currentAction == "chooseRotate" && inArray(cell.value, rotateChoices)) {

						}
					}
				});
			});
		}
	}
});

function inArray(value, array) {
	return array.indexOf(value) > -1;
}

function getMousePos(e) {
	let rect = canvas.getBoundingClientRect();
	return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
}

canvas.onmousemove = function(e) {

	if (currentGame.winner == undefined && currentGame.aiPlaying == false) {

		const mousePos = getMousePos(e);

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

function createRotationChoices(gridCell, linkedCell) {
	
	let diameter = currentGame.rotateDiameter;
	let choiceBoxHeight = (currentGame.cellSize * diameter);
	let choiceBoxWidth = choiceBoxHeight / 2;

	let imageSize = choiceBoxWidth - Math.floor(choiceBoxWidth * 0.3);
	let imageXOffset = (choiceBoxWidth - imageSize) / 2;
	let imageYOffset = (choiceBoxHeight - imageSize) / 2;

	//Create option objects
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

function clearOverlay() {
	currentGame.overlay = null;
}



function updateStatus(string) {
	noticeText.innerHTML = string;
}

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

function canRotate(cell) {

	diameter = currentGame.rotateRadius*2 + 1;

	validRow = ((cell.i + 1 + currentGame.rotateRadius) % diameter) == 0;
	validCol = ((cell.j + 1 + currentGame.rotateRadius) % diameter) == 0;

	validCenter = validRow && validCol;

	if ((currentGame.rotateRadius != 0) && validCenter) {
		return true;
	} else {
		return false;
	}
}

function rotateCells(centerCell, direction) {
	if (direction == "counterclockwise") {
		rotateCellsClockwise(centerCell, 3);
	} else {
		rotateCellsClockwise(centerCell, 1);
	}
}

function rotateCellsClockwise(centerCell, nRotations) {
	if (nRotations != 0) {
		let radius = currentGame.rotateRadius;

		//let diameter = radius*2 + 1;
		let diameter = radius * 2 + 1;
		//Make empty matrix
		let newMatrix = new Array(diameter);
		for (let i=0; i<diameter; i++) {
			newMatrix[i] = new Array(diameter);
		}

		let firstRow = centerCell.i-radius,
			lastRow = centerCell.i+radius,
			firstCol = centerCell.j-radius,
			lastCol = centerCell.j+radius;

		for (let ii = 0; ii < diameter; ii++) {
			newMatrix[ii] = currentGame.board[firstRow + ii].slice(firstCol, lastCol + 1);
		}

		newMatrix = rotateMatrix(newMatrix, diameter);

		//Edit i, j, x, and y then insert into the game board
		newMatrix.forEach( function(row, i) {
			row.forEach( function(cell, j) {
				//update cell
				cell.i = firstRow + i;
				cell.j = firstCol + j;
				cell.x = cell.j*currentGame.cellSize;
				cell.y = cell.i*currentGame.cellSize;

				//insert cell
				currentGame.board[cell.i][cell.j] = cell;
			});
		});

		//Recursive call
		rotateCellsClockwise(centerCell, nRotations - 1);
	}
}

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
		action: function() {startNextGame();}
	};

	currentGame.overlay = [endGameOverlay, startNextGameOverlay];
}

function startNextGame() {
	currentGame = newGame(getInputOptions());
	nextPlayer();
}

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

function nextMove() {
	let turnSeqLen = currentGame.turnSequence.length;
	nextIndex = (currentGame.turnSequence.indexOf(currentGame.currentAction) + turnSeqLen + 1) % turnSeqLen
	currentGame.currentAction = currentGame.turnSequence[nextIndex];

	if (nextIndex == 0) {
		nextPlayer();
	}

	//updateStatus(currentGame.players[currentGame.currentPlayer].name + "'s turn");
}

function nextPlayer() {
	nextP = currentGame.currentPlayer + 1;
	currentGame.currentPlayer = (nextP <= currentGame.nPlayers) ? nextP : 1;
	currentGame.currentAction = "place";

	updateStatus(currentGame.players[currentGame.currentPlayer].name + "'s turn");

	if (currentGame.players[currentGame.currentPlayer].ai) {
		takeAiTurn();
	}
}

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

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeAiTurn() {
	//Disable stuff for human player...
	currentGame.aiPlaying = true;
	currentGame.overlay = [waitOverlay()];

	let winner = false;

	aimove = currentGame.players[currentGame.currentPlayer].ai.getMove(currentGame.board);

	//Wait a bit
	await sleep(1000);
	//Place cell
	currentGame.board[aimove.placement.i][aimove.placement.j].value = currentGame.currentPlayer;


	//Check for win
	winner = checkForWin(currentGame.board[aimove.placement.i][aimove.placement.j])

	//Wait a bit
	await sleep(1000);
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

var blankVal = 0;

var blankColor = "rgba(240,240,240,1)",
	hilightColor = "rgba(200,200,200,1)",
	borderColor = "rgba(0,0,0,1)";

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

function drawBackground() {
	ctx.fillStyle = "#8c8c8c";
	for (var i=0; i<currentGame.nRows; i++) {
		for (var j=0; j<currentGame.nCols; j++) {
			ctx.beginPath();
			ctx.rect(i*currentGame.cellSize, j*currentGame.cellSize, currentGame.cellSize, currentGame.cellSize);
			ctx.strokeStyle="#000000";
			ctx.stroke();
			ctx.fill();
			ctx.closePath();
		}
	}
}

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

function drawCell(cell, color) {
	

	//Draw gameboard background cell
	ctx.fillStyle = blankColor;
	ctx.beginPath();
	ctx.rect(cell.j*currentGame.cellSize, cell.i*currentGame.cellSize, currentGame.cellSize-padding, currentGame.cellSize-padding);
	ctx.fill();
	ctx.strokeStyle = borderColor;
	ctx.stroke();

	let piecePosOffset = (currentGame.cellSize - padding) / 2;
	let pieceRadius = (currentGame.cellSize / 2) - 3 //piecePosOffset - padding;

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
		// let piecePosOffset = (currentGame.cellSize - padding) / 2;
		// let pieceRadius = (currentGame.cellSize / 2) - 3 //piecePosOffset - padding;
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(cell.x + piecePosOffset, cell.y + piecePosOffset, pieceRadius, 0, 2*Math.PI);
		ctx.fill();
		ctx.closePath()
	}
	
}

function drawOverlay() {
	if (currentGame.overlay) {
		currentGame.overlay.forEach( element => {
			drawElement(element);
		});
	}
}

function drawElement(element) {

	ctx.beginPath();

	ctx.rect(element.x, element.y, element.width-padding, element.height-padding);

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
	
	//Hilight option??
	// if (cell.hilight) {
	// 	ctx.strokeStyle = hilightColor;
	// 	ctx.stroke();
	// }
	ctx.closePath();

}

function drawGrid() {
	//draw rotating squares
	currentGame.grid.forEach( gridCell => {
		drawGridCell(gridCell)
	})
}

function drawGridCell(gridCell) {
	ctx.beginPath();

	//Draw counterclockwise
	ctx.rect(gridCell.x, gridCell.y, currentGame.gridCellSize-padding, currentGame.gridCellSize-padding);

	ctx.strokeStyle = gridBorderColor;
	ctx.lineWidth=3;
	ctx.stroke();

	ctx.lineWidth = 1;

	
	//ctx.fillStyle = overlayColor;
	
	
	//Hilight option??
	if (gridCell.hilight) {
		//ctx.strokeStyle = hilightColor;
		//ctx.stroke();
		ctx.fillStyle = gridHilightColor;
		ctx.fill();
	}

	

	ctx.closePath();
}

function drawWithGrid() {
	ctx.clearRect(0, 0, boardWidth, boardWidth);
	if (currentGame != null) {
		
		drawBoard();
		drawGrid();

		drawOverlay();
	}
}

function drawNoGrid() {
	ctx.clearRect(0, 0, boardWidth, boardWidth);
	if (currentGame != null) {
		drawBoard();		
		drawOverlay();
	}
}

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

function newAi(player, playerNum, game) {
	if (player.type === "random bot") {
		return new zombieAi(playerNum, game);
	}
	if (player.type === "ok bot") {
		return new defenseAi(playerNum, game);
	}
}

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

		//Setup player stuff??
		return game;
	}
	else {
		return null;
	}
	
}

var padding = 0;

var myOptions = {
	nRows: 6, 
	nCols: 6,
	nLine: 5,
	nPlayers: 2,
	rotateRadius: 1,
	players: {
		1: {
			name: "Human",
			type: "human",
			color: colorDict["orange"]
		},
		2: {
			name: "Computer",
			type: "ok bot",
			color: colorDict["green"]
		}
	}
};


var currentGame = newGame(myOptions);
//Run this at the start to make sure everything is the right size
resizeCanvas();

var drawInterval = undefined;
startNewGame();
//setInterval(currentGame.drawFunc, 10);
var scoreTracker = {};

function startNewGame() {
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

	nextPlayer();

	if (drawInterval) {
		clearInterval(drawInterval);
	}

	drawInterval = setInterval(currentGame.drawFunc, 10)
}

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
//THIS IS A MOCKUP FOR INPUT:
/*
new board --> confirm new game --> [pentago] [gomoku] [custom] --> parameters below are automatically filled out with appropriate values
(use a table)
columns: number [-][+]
rows: number [-][+]
rotation: number [-][+] (will display "none" when rotation radius = 0)
players: number [-][+]
	[player 1 name] [human/bot dropdown menu] [color selector]
	...


*/


//Game setup/start elements
let newBoardBtn = document.getElementById("newBoard");
let optionsContainer = document.getElementById("optionsContainer");


//Template settings
var pentagoOptions = {
	nRows: 6, 
	nCols: 6,
	nLine: 5,
	nPlayers: 2,
	rotateRadius: 1
};
var pentagoXlOptions = {
	nRows: 9, 
	nCols: 9,
	nLine: 5,
	nPlayers: 2,
	rotateRadius: 1
}
var gomokuOptions = {
	nRows: 15, 
	nCols: 15,
	nLine: 5,
	nPlayers: 2,
	rotateRadius: 0
};
var tictactoeOptions = {
	nRows: 3, 
	nCols: 3,
	nLine: 3,
	nPlayers: 2,
	rotateRadius: 0
}

var startGameBtn = document.createElement("button");
startGameBtn.innerHTML = "start game";
startGameBtn.setAttribute("id", "startGameBtn");
startGameBtn.addEventListener("click", function() {
	currentGame = newGame(getInputOptions());
	startNewGame();

	newBoardBtn.style.display = "block";
	optionsContainer.style.display = "none";
})

function getInputOptions() {
	let gameOptions = {
		nRows: optionsTracker.nCols.value,
		nCols: optionsTracker.nCols.value,
		nLine: optionsTracker.nLine.value,
		nPlayers: optionsTracker.nPlayers.value,
		rotateRadius: optionsTracker.rotateRadius.value,
		players: optionsTracker.nPlayers.players
	}

	return gameOptions;
}

//Board template buttons
var gomokuTemplateBtn = document.createElement("button");
gomokuTemplateBtn.innerHTML = "gomoku template";
var pentagoTemplateBtn = document.createElement("button");
pentagoTemplateBtn.innerHTML = "pentago template";
var pentagoXlTemplateBtn = document.createElement("button");
pentagoXlTemplateBtn.innerHTML = "pentago XL template";
var tictactoeTemplateBtn = document.createElement("button");
tictactoeTemplateBtn.innerHTML = "tic-tac-toe template";

gomokuTemplateBtn.addEventListener("click", function() {
	//createBoardInputOptions(gomokuOptions);
	setBoardInputOptions(gomokuOptions, true);

});

pentagoTemplateBtn.addEventListener("click", function() {
	//createBoardInputOptions(pentagoOptions);
	setBoardInputOptions(pentagoOptions, true);
});

pentagoXlTemplateBtn.addEventListener("click", function() {
	//createBoardInputOptions(pentagoOptions);
	setBoardInputOptions(pentagoXlOptions, true);
});

tictactoeTemplateBtn.addEventListener("click", function() {
	//createBoardInputOptions(pentagoOptions);
	setBoardInputOptions(tictactoeOptions, true);
});

//board options buttons
var BOARD_MINIMUM = 3;
var BOARD_MAXIMUM = 20;

function setBoardInputOptions(boardOptions, showPreview) {

	optionsTracker.nCols.value = boardOptions.nCols;
	optionsTracker.nLine.value = boardOptions.nLine;
	optionsTracker.rotateRadius.value = boardOptions.rotateRadius;
	optionsTracker.nPlayers.value = boardOptions.nPlayers;

	updateOptions(showPreview);
}

function updateOptions(showPreview) {
	resolveParameters();

	//Check that there are the correct number of player inputs
	let nPlayerInputs = Object.keys(optionsTracker.nPlayers.players).length

	while (optionsTracker.nPlayers.value > nPlayerInputs) {

		let playerNum = optionsTracker.nPlayers.value
		//create new entry in optionsTracker
		let newPlayer = {
			name: "player " + playerNum,
			type: "ok bot",
			color: colorDict[playerColors[playerNum - 1]]
		}
		optionsTracker.nPlayers.players[playerNum] = newPlayer;

		addPlayerInput(playerNum);
		nPlayerInputs += 1;
		
	} while (optionsTracker.nPlayers.value < nPlayerInputs) {
		let playerNum = optionsTracker.nPlayers.value;
		removePlayerInput(nPlayerInputs);
		nPlayerInputs -= 1;
	}

	refreshValues();

	if (showPreview) {
		currentGame = newGame(getInputOptions());
		previewGame();
	}
}

var playerTypes = ["human", "ok bot", "random bot"];
var playerColors = ["orange", "green", "purple", "red"];

function addPlayerInput(playerNumber) {
	
	let newRow = optionsTable.insertRow();

	//Create name input
	let nameBox = document.createElement("input");
	nameBox.type = "text";
	nameBox.value = optionsTracker.nPlayers.players[playerNumber].name;
	nameBox.onchange = function() {
		optionsTracker.nPlayers.players[playerNumber].name = nameBox.value;
	}

	//create type picker
	let typeDropdown = document.createElement("select");
	playerTypes.forEach( pType => {
		let option = document.createElement("option");
		option.value = pType;
		option.text = pType;
		typeDropdown.appendChild(option);
	});
	typeDropdown.value = optionsTracker.nPlayers.players[playerNumber].type
	typeDropdown.onchange = function() {
		optionsTracker.nPlayers.players[playerNumber].type = typeDropdown.value;

		//clear any ai opbjects that might have been created from previous games...
		optionsTracker.nPlayers.players[playerNumber].ai = null;
	}

	//create color picker
	let colorDropdown = document.createElement("select");
	playerColors.forEach( pColor => {
		let option = document.createElement("option");
		option.value = pColor;
		option.text = pColor;
		colorDropdown.appendChild(option);
	});
	colorDropdown.onchange = function() {
		optionsTracker.nPlayers.players[playerNumber].color = colorDict[colorDropdown.value];
	}
	colorDropdown.value = playerColors[playerNumber - 1];

	//insert cells
	let nameCell = newRow.insertCell();
	nameCell.appendChild(nameBox);
	let typeCell = newRow.insertCell();
	typeCell.appendChild(typeDropdown);
	let colorCell = newRow.insertCell();
	colorCell.appendChild(colorDropdown);

}

function removePlayerInput(pNum) {
	delete optionsTracker.nPlayers.players[pNum];
	optionsTable.deleteRow(-1)

}



var optionsTracker = {
	rotateRadius: {
		name: "rotate radius",
		max: 3,
		min: 0,
		incrementStep: 1,
		btns: []
	},
	nCols: {
		name: "columns",
		max: BOARD_MAXIMUM,
		min: BOARD_MINIMUM,
		incrementStep: 1,
		btns: []
	},
	nLine: {
		name: "winning length",
		max: BOARD_MAXIMUM,
		min: BOARD_MINIMUM,
		incrementStep: 1,
		btns: []
	},
	nPlayers: {
		name: "players",
		max: 4,
		min: 2,
		incrementStep: 1,
		btns: [],
		players: {
			1 : {
				name: "Human",
				type: "human",
				color: colorDict["orange"]
			},
			2 : {
				name: "Computer",
				type: "ok bot",
				color: colorDict["green"]
			},
		}
	}
}


//Create increase decrease buttons
for (let key in optionsTracker) {
	if (optionsTracker.hasOwnProperty(key)) {
		let tempIncBtn = document.createElement("button");
		tempIncBtn.innerHTML = "+";
		tempIncBtn.addEventListener("click", function() {
			let disableButton = increaseValue(optionsTracker[key]);
			tempIncBtn.disable = disableButton;
			updateOptions(true);
		});

		let tempDecBtn = document.createElement("button");
		tempDecBtn.innerHTML = "-";
		tempDecBtn.addEventListener("click", function() {
			let disableButton = decreaseValue(optionsTracker[key]);
			tempDecBtn.disable = disableButton;
			updateOptions(true);
		});

		optionsTracker[key].btns = [tempIncBtn, tempDecBtn];
	}
}

var optionsTable = document.createElement("table");
//optionsContainer.appendChild(optionsTable);
var tableColumns = ["name", "value", "btns"];

function resolveParameters() {
	//will fix parameters so they are compatible
	//priority of parameters:
	// 1. rotate radius
	// 2. nCols
	// 3. nLine

	let diameter = (optionsTracker.rotateRadius.value * 2) + 1;

	if (optionsTracker.rotateRadius.value == 0) {
		optionsTracker.nCols.min = BOARD_MINIMUM;
		optionsTracker.nCols.max = BOARD_MAXIMUM;
		optionsTracker.nCols.incrementStep = 1;

	} else if (optionsTracker.nCols.value % diameter != 0) {
		
		optionsTracker.nCols.value = diameter*2;
		optionsTracker.nCols.max = BOARD_MAXIMUM - (BOARD_MAXIMUM % diameter);
		optionsTracker.nCols.min = diameter*2;
		optionsTracker.nCols.incrementStep = diameter;

		
	} else {
		optionsTracker.nCols.max = BOARD_MAXIMUM - (BOARD_MAXIMUM % diameter);
		optionsTracker.nCols.min = diameter*2;
		optionsTracker.nCols.incrementStep = diameter;
	}

	if (optionsTracker.nCols.value <= optionsTracker.nLine.value && optionsTracker.nLine.value != optionsTracker.nLine.min) {
		optionsTracker.nLine.value = optionsTracker.nCols.value - 1;
	}
	optionsTracker.nLine.max = optionsTracker.nCols.value;

}

function increaseValue(param) {
	if (param.value + param.incrementStep <= param.max) {
		
		param.value += param.incrementStep;
		
		if (param.value == param.max || param.value + param.incrementStep > param.max) {
			//disable button
			return true;
		} else {
			//enable button
			return false;
		}
	}
}

function decreaseValue(param) {
	if (param.value - param.incrementStep >= param.min) {
			
		param.value -= param.incrementStep;

		if (param.value == param.min || param.value - param.incrementStep < param.min) {
			//disable button
			return true;
		} else {
			//enable button
			return false;
		}
	}
}


//fill the options table with parameters
for (let key in optionsTracker) {
	if (optionsTracker.hasOwnProperty(key)) {

		let option = optionsTracker[key];

		let tempRow = optionsTable.insertRow()

		//create cell for each attribute of option
		tableColumns.forEach( attribute => {

			let tempCell = tempRow.insertCell()
			tempCell.setAttribute("id", key + attribute)
			if (attribute === "btns") {

				option[attribute].forEach( btn => {

					tempCell.appendChild(btn);
				});
			} else {

				tempCell.innerHTML = option[attribute]
			}
		})

	}
}
//add player inputs to options table
for (let playerNum in optionsTracker.nPlayers.players) {
	if (optionsTracker.nPlayers.players.hasOwnProperty(playerNum)) {
		addPlayerInput(playerNum);
	}
}
newBoardBtn.addEventListener("click", function() {
	if (confirm("Are you sure you want to start a new board? The current game will be erased.")) {
		
		//hide button
		newBoardBtn.style.display = "none";

		updateOptions(true);

		//Show game templates
		optionsContainer.style.display = "block";
	}
	//optionsContainer.style.display = optionsContainer.style.display == "none" ? "block" : "none";
	//newBoardBtn.innerText = optionsContainer.style.display == "none" ? "NewBoard" : "Cancel";
});

gameFooter = document.getElementById("gameFooter");

//Add setup stuff to options container
optionsContainer.appendChild(startGameBtn);
optionsContainer.appendChild(document.createElement("br"));


optionsContainer.appendChild(pentagoTemplateBtn);
optionsContainer.appendChild(pentagoXlTemplateBtn);
optionsContainer.appendChild(gomokuTemplateBtn);
optionsContainer.appendChild(tictactoeTemplateBtn);

optionsContainer.appendChild(optionsTable);

optionsContainer.style.display = "none";

function refreshValues() {
	for (let key in optionsTracker) {
		if (optionsTracker.hasOwnProperty(key)) {
			let tempOption = document.getElementById(key + "value");
			tempOption.innerHTML = optionsTracker[key].value;
		}
	}
}

//Setup the values as myOptions
setBoardInputOptions(myOptions, false);


function refreshScoreboard() {
	try {
		scoreTable.deleteRow(0);
	} catch(err) {
	}
	let newRow = scoreTable.insertRow();
	for (let player in scoreTracker) {
		if (scoreTracker.hasOwnProperty(player)) {
			let newCell = newRow.insertCell();
			newCell.innerHTML = player + ": " + scoreTracker[player].wins;
		}
	}
}


//Help control
helpBtn = document.getElementById("helpBtn")
helpText = document.getElementById("help")

helpBtn.addEventListener("click", function() {
	if (helpText.style.display === "none") {
		helpText.style.display = "block"
		helpBtn.innerHTML = "close help"
	}
	else {
		helpText.style.display = "none"
		helpBtn.innerHTML = "help"
	}
})