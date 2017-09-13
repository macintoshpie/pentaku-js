//////
//BOARD PARAMETERS
var boardWidth = 600,
	boardHeight = boardWidth;

var rotateChoices = ["counterclockwise", "clockwise"];
var textSize = 30;

var counterclockwiseImg = document.getElementById('counterclockwiseImg');
var clockwiseImg = document.getElementById('clockwiseImg');

//////
//COLORS
var overlayColor = "rgba(0,0,0,.25)";
var gridBorderColor = "rgba(99,140,204,1)";
var gridHilightColor = "rgba(0,0,0,.1)";
var fontColor = "rgba(255,255,255,1)";
var blankColor = "rgba(240,240,240,1)",
	hilightColor = "rgba(200,200,200,1)",
	borderColor = "rgba(0,0,0,1)";

var colorDict = {
	"purple": "rgba(171,98,192,1)",
	"orange": "rgba(197,124,60,1)",
	"green": "rgba(114,165,85,1)",
	"red": "rgba(202,86,112,1)"
}

//////
//DEFAULT BOARD
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

//////
//GAME HEADER
var gameHeader = document.getElementById("gameHeader");

//Help button and text
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

//Notice text
var noticeText = document.getElementById("notice");
function updateStatus(string) {
	noticeText.innerHTML = string;
}

//Score board
var scoreTracker = {};

var scoreTable = document.createElement("table");
gameHeader.appendChild(scoreTable);

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

//////
//BOARD OPTIONS

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

	startNewGame(true);

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

function refreshValues() {
	for (let key in optionsTracker) {
		if (optionsTracker.hasOwnProperty(key)) {
			let tempOption = document.getElementById(key + "value");
			tempOption.innerHTML = optionsTracker[key].value;
		}
	}
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
