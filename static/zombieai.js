//zombie ai
function zombieAi(pNum, gameSetup) {
	this.name = "zombie AI";
	this.playerNum = parseInt(pNum);

	this.nRows = gameSetup.nRows;
	this.nCols = gameSetup.nCols;

	this.rotateRadius = gameSetup.rotateRadius;
	this.rotateDiameter = gameSetup.rotateDiameter;
	this.cellSize = gameSetup.cellSize;
	this.nPlayers = gameSetup.nPlayers;

	this.nLine = gameSetup.nLine;
	
	this.getMove = getMove;
}

function getMove(board) {
	//should return the index of cell clicked on, what it rotates, and what direction
	let allPlacements = getPossiblePlacements(board);
	let randomPlacement = allPlacements[randomIntFromInterval(0, allPlacements.length - 1)];

	let randomRotateLoc,
		randomRotateDir;

	if (this.rotateRadius != 0) {
		// let randomRotateLoc = {
		// 	i: randomIntFromInterval(0, this.nRows/this.rotateDiameter), 
		// 	j: randomIntFromInterval(0, this.nCols/this.rotateDiameter)
		// }
		randomRotateLoc = randomIntFromInterval(0, (this.nRows/this.rotateDiameter * this.nCols/this.rotateDiameter) - 1);

		randomRotateDir = ["clockwise", "counterclockwise"][randomIntFromInterval(0, 1)];
	}

	return {
		placement: {
			i: randomPlacement.i,
			j: randomPlacement.j
			},
		rotateLoc: randomRotateLoc,
		rotateDir: randomRotateDir
		}
}

function getPossiblePlacements(board) {
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

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}