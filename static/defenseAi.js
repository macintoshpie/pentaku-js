function defenseAi(pNum, gameSetup) {
	this.name = "defense AI";
	this.playerNum = parseInt(pNum);

	this.nRows = gameSetup.nRows;
	this.nCols = gameSetup.nCols;

	this.rotateRadius = gameSetup.rotateRadius;
	this.rotateDiameter = gameSetup.rotateDiameter;
	this.cellSize = gameSetup.cellSize;
	this.nPlayers = gameSetup.nPlayers;

	this.nLine = gameSetup.nLine;

	this.grid = gameSetup.grid;
	
	this.getMove = getMove;

	this.defenseThreshold = 4;

	this.rotateOptions = ["clockwise", "counterclockwise"];

	this.hasMadeFirstMove = false;

	this.worstVal = -9999;

this.getMove = function (board) {
	//should return the index of cell clicked on, what it rotates, and what direction
	let evalBoard = JSON.parse(JSON.stringify(board));

	let placement,
		rotateLoc,
		rotateDir;

	if (!this.hasMadeFirstMove) {
		if (this.rotateRadius != 0) {
			placement = {i: this.rotateRadius, j: this.rotateDiameter - 1}
			let increaseDist = 0;
			while (evalBoard[placement.i][placement.j].value != blankVal) {
				placement = {i: placement.j, j: placement.i + increaseDist};
				increaseDist += 1;
			}
			rotateLoc = randomIntFromInterval(0, this.grid.length - 1)
			rotateDir = "clockwise"
		}
		else {
			placement = {i: Math.floor(this.nRows / 2) - 1, j: Math.floor(this.nCols / 2)}
			let increaseDist = 0;
			while (evalBoard[placement.i][placement.j].value != blankVal) {
				placement = {i: placement.j, j: placement.i + increaseDist};
				increaseDist += 1;
			}
			rotateLoc = null;
			rotateDir = null;
		}

		this.hasMadeFirstMove = true;

		return {
			placement: placement,
			rotateLoc: rotateLoc,
			rotateDir: rotateDir
		};
	}

	//Need to change so it only assesses rotations when radius > 0
	evalBoard = this.getAllCellsWorth(evalBoard);

	mostValuableMoves = this.getMostValuableMoves(evalBoard);

	//if there are multiple moves with the greatest value, randomly choose one...
	if (mostValuableMoves.length > 1) {
		selectedMove = mostValuableMoves[randomIntFromInterval(0, mostValuableMoves.length - 1)];
		
		placement = {i: selectedMove.i, j: selectedMove.j}
		rotateLoc = selectedMove.turn.rotateLoc;
		rotateDir = selectedMove.turn.rotateDir;
	}
	else {
		placement = {i: mostValuableMoves[0].i, j: mostValuableMoves[0].j}
		rotateLoc = mostValuableMoves[0].turn.rotateLoc;
		rotateDir = mostValuableMoves[0].turn.rotateDir;
	}

	// if (this.rotateRadius != 0) {
	// 	// let randomRotateLoc = {
	// 	// 	i: randomIntFromInterval(0, this.nRows/this.rotateDiameter), 
	// 	// 	j: randomIntFromInterval(0, this.nCols/this.rotateDiameter)
	// 	// }
	// 	randomRotateLoc = randomIntFromInterval(0, (this.nRows/this.rotateDiameter * this.nCols/this.rotateDiameter) - 1);

	// 	randomRotateDir = this.rotateOptions[randomIntFromInterval(0, 1)];
	// }

	return {
		placement: placement,
		rotateLoc: rotateLoc,
		rotateDir: rotateDir
		}
}

this.getPossiblePlacements = function (board) {
	let moves = [];
	board.forEach( row => {
		row.forEach( cell => {
			if (cell.value == blankVal) {
				moves.push(cell);
			}
		})
	})
	return moves;
}

this.getMostValuableMoves = function (board) {
	//returns a list of cells that have the maximum cell worth
	let highestWorth = this.worstVal
	let mostValuableMoves = [];

	board.forEach( row => {
		row.forEach( cell => {
			if (cell.turn.worth > highestWorth) {
				highestWorth = cell.turn.worth;
				mostValuableMoves = [cell];
			}
			else if (cell.turn.worth == highestWorth) {
				mostValuableMoves.push(cell);
			}
		});
	});

	return mostValuableMoves;
}

this.getAllCellsWorth = function (board) {
	//return board with a value assigned to each board with the best rotation
	let worthBoard = JSON.parse(JSON.stringify(board));

	//A brute force approach...
	if (this.rotateRadius != 0) {
		worthBoard.forEach( row => {
			row.forEach( cell => {
				cell.turn = this.getMaxCellWorthWithRotation(cell, worthBoard);
			});
		});
	} else {
		worthBoard.forEach( row => {
			row.forEach( cell => {
				cell.turn = this.getMaxCellWorthNoRotation(cell, worthBoard);
			});
		});
	}

	return worthBoard;
}

this.getMaxCellWorthWithRotation = function (cell, board) {
	//returns max cell value with best rotation direction

	//Used to track value of cell
	let bestTurn = {
		worth: this.worstVal,
		rotateLoc: this.randomIntFromInterval(0, this.nCols-1),
		rotateDir: this.rotateOptions[this.randomIntFromInterval(0, this.rotateOptions.length)]
	}

	//If the cell is blank, find its value with rotation location and direction
	//If the cell isnt blank, return the values initialized above
	if (cell.value == blankVal) {

		nGridCells = (this.nCols/this.rotateDiameter) * (this.nRows/this.rotateDiameter) - 1;

		this.grid.forEach( (gridCell, gridCellIdx) => {
			
			this.rotateOptions.forEach( direction => {

				// copy/reset board and setup cell
				let testBoard = JSON.parse(JSON.stringify(board));
				testBoard[cell.i][cell.j].value = this.playerNum

				let thisTurn = {};
				thisTurn.rotateLoc = gridCellIdx;  //{i: gridCell.linkedCelli, j: gridCell.linkedCellj}
				thisTurn.rotateDir = direction
				this.rotateGrid(gridCell, direction, testBoard); //rotate testBoard inplace

				thisTurn.worth = this.evalMethod(testBoard);
				
				if (thisTurn.worth > bestTurn.worth) {
					bestTurn = thisTurn;
				}

			});
		});
	}

	return bestTurn;
}

this.getMaxCellWorthNoRotation = function (cell, board) {
	//returns max cell value without rotation

	//Used to track value of cell
	let bestTurn = {
		worth: this.worstVal,
		rotateLoc: null,
		rotateDir: null
	}

	//If the cell is blank, find its value with rotation location and direction
	//If the cell isnt blank, return the values initialized above
	if (cell.value == blankVal) {
		// copy/reset board and setup cell
		let testBoard = JSON.parse(JSON.stringify(board));
		testBoard[cell.i][cell.j].value = this.playerNum

		let thisTurn = {};
		thisTurn.worth = this.evalMethod(testBoard);
		thisTurn.rotateLoc = undefined;
		thisTurn.rotateDir = undefined;
		
		if (thisTurn.worth > bestTurn.worth) {
			bestTurn = thisTurn;
		}

	}

	return bestTurn;
}

this.simpleEval = function (board) {

	let totalVal = 0;
	let boardLines;
	
	// for each line where another player is x (3) or more, subtract value
	// for each line where bot is x or more, add value
	for (let plyr=1; plyr < this.nPlayers + 1; plyr++) {
		let weight = -20;
		if (plyr == this.playerNum) {
			weight = +1;
		}

		boardLines = this.getBoardLines(plyr, board);

		boardLines.forEach( line => {
			//TODO: do an if statement that says if another player's line length is ~ the nLine length, DONT DO THAT MOVE!
			// if (plyr != this.playerNum && line.len >= this.defenseThreshold) {
			// 	totalVal = this.worstVal;
			// }
			// else if (plyr == this.playerNum && line.len >= this.nLine) {
			// 	totalVal = 999;
			// }
			// else {
				totalVal = totalVal + (Math.pow(line.len, line.len) * weight);
			//}
		});

	}


	return totalVal;

}

this.getBoardLines = function (plyr, board) {
	//return a list of line objects
	let boardLines = [];

	board.forEach( row => {
		row.forEach( cell => {
			//Only check for lines from the player's cells
			if (cell.value == plyr) {

				//returns all lines that this cell is a part of
				let cellLines = this.getCellLines(cell, board);
				if (cellLines != null) {

					//TODO check to see if these lines are already in the board's lines
					cellLines.forEach( line => {
						if (this.lineIsInArray(line, boardLines)){
							//do nothing
						} else {
							boardLines.push(line);
						}
					})
				}
			}
		})
	})

	return boardLines;
}

this.lineIsInArray = function (line, array) {
	for (let i=0; i<array.length; i++) {
		if(array[i].id == line.id) {
			return true;
		}
	}
	return false;
}

this.getCellLines = function (cell, board) {
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
		return null;
	}
	else {

		for (let dir in directions) {
			let ii = i;
			let jj = j;
			let currentCellVal = board[ii][jj].value; //should edit to cell.value
			let lineLength = 0;
			while ((currentCellVal == value) && (lineLength<=this.nLine)) {

				ii += directions[dir].rowStep;
				jj += directions[dir].colStep;
				try {
					currentCellVal = board[ii][jj].value; //should edit to cell.value
				}
				catch(TypeError) {
					currentCellVal = undefined;
				}
				lineLength += 1;

			}

			directions[dir].len = lineLength;

			// //check if sum of len with of its opposite direction is enough to win
			// //Subtract 1 because the center cell is counted both times
			// let oppositeDir = directions[dir].opposite;
			// if ((directions[dir].len + directions[oppositeDir].len - 1) >= currentGame.nLine) {
			// 	//cell.i + 1 % currentGame.rotateRadius == 0
			// 	return true;
			// }
		}
		//return false;
	}

	halfDirections = ['W', 'NW', 'N', 'NE']

	let cellLines = []

	halfDirections.forEach( dir => {
		let oppDir = directions[dir].opposite;

		let starti = cell.i + ((directions[dir].len - 1) * directions[dir].rowStep) ;
		let startj = cell.j + ((directions[dir].len - 1) * directions[dir].colStep);

		let stopi = cell.i + ((directions[oppDir].len - 1) * directions[oppDir].rowStep);
		let stopj = cell.j + ((directions[oppDir].len - 1) * directions[oppDir].colStep);

		let lineLen = directions[dir].len + directions[oppDir].len - 1;

		//This is likely to cause problems later
		//A sloppy hash function
		let uniqueID = (starti + 1) / ((stopi * 2) + startj % (stopj + lineLen))//(starti - stopi) / ((startj - stopj) + 1) * starti + (stopi + stopj);

		//TODO: Maybe ONLY add the line if it is longer than one point?
		if (lineLen > 1) {
			cellLines.push({i1: starti, j1: startj, i2: stopi, j2: stopj, len: lineLen, id: uniqueID})
		}
		
	});

	return cellLines;
}

this.rotateGrid = function (gridCell, direction, board) {
	//rotates board clockwise or counterclockwise, INPLACE
	let rotatedBoard;
	if (direction == "counterclockwise") {
		this.rotateCellsClockwise(gridCell, 3, board);
	} else {
		this.rotateCellsClockwise(gridCell, 1, board);
	}
}

this.rotateCellsClockwise = function (gridCell, nRotations, board) {
	//rotates board, inplace

	centeri = gridCell.linkedCelli;
	centerj = gridCell.linkedCellj;

	if (nRotations == 0) {
		//done
	}
	else {
		let radius = this.rotateRadius;

		let diameter = radius * 2 + 1;
		//Make empty matrix
		let newMatrix = new Array(diameter);
		for (let i=0; i<diameter; i++) {
			newMatrix[i] = new Array(diameter);
		}

		let firstRow = centeri-radius,
			lastRow = centeri+radius,
			firstCol = centerj-radius,
			lastCol = centerj+radius;

		for (let ii = 0; ii < diameter; ii++) {
			newMatrix[ii] = board[firstRow + ii].slice(firstCol, lastCol + 1);
		}

		newMatrix = rotateMatrix(newMatrix, diameter);

		//Edit i, j, x, and y then insert into the game board
		newMatrix.forEach( function(row, i) {
			row.forEach( function(cell, j) {
				//update cell
				cell.i = firstRow + i;
				cell.j = firstCol + j;
				cell.x = cell.j*this.cellSize;
				cell.y = cell.i*this.cellSize;

				//insert cell
				board[cell.i][cell.j] = cell;
			});
		});

		//Recursive call
		this.rotateCellsClockwise(gridCell, nRotations - 1, board);
	}
}

this.rotateMatrix = function (matrix, n) {
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

this.randomIntFromInterval = function (min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}


this.evalMethod = function (board) {
	return this.simpleEval(board);
}
}

