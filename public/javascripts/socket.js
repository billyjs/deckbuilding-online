const socket = io();
// TODO: move to a config file
const games = ["starRealms", "starRealmsQuick", "armyForce"];

let gameId = null;
let gameName = null;
let gameState = null;
let decidingMesh = null;
let layout = null;

// document elements
const header = document.getElementsByClassName("header")[0];
const joining = document.getElementById("joining");
const gameIdBox = document.getElementById("gameIdBox");
const nameBox = document.getElementById("nameBox");
const joinButton = document.getElementById("join");
const newButton = document.getElementById("new");

const waiting = document.getElementById("waiting");
const gameIdText = document.getElementById("gameId");
const gameNameText = document.getElementById("gameName");
const playerList = document.getElementById("players");
const startButton = document.getElementById("start");

const labels = document.getElementById("labels");
const decision = document.getElementById("decision");

const gameSelect = document.getElementById("gameSelect");
games.forEach(game => {
	let option = document.createElement("option");
	option.value = game;
	option.innerText = game
		.replace(/([a-z](?=[A-Z]))/g, "$1 ")
		.replace(/(^\w)/g, c => c.toUpperCase());
	gameSelect.appendChild(option);
});

function loadJSON(url, callback) {
	let request = new XMLHttpRequest();
	request.responseType = "json";
	request.open("GET", url, true);
	request.onload = function() {
		callback(request.response);
	};
	request.send();
}

// button handlers
newButton.onclick = () => {
	socket.emit("newGame", {
		name: nameBox.value,
		game: gameSelect.value
	});
};

joinButton.onclick = () => {
	socket.emit("joinGame", {
		gameId: gameIdBox.value,
		name: nameBox.value
	});
};

startButton.onclick = () => {
	socket.emit("startGame", { gameId });
};

// socket.io handlers
socket.on("responseJoin", response => {
	if (response.success) {
		joining.style.display = "none";
		header.style.display = "none";
		waiting.style.display = "block";
		gameIdText.innerText = response.gameId;
		gameNameText.innerText = response.game
			.replace(/([a-z](?=[A-Z]))/g, "$1 ")
			.replace(/(^\w)/g, c => c.toUpperCase());
		gameId = response.gameId;
		gameName = response.game;
	} else {
		alert(response.message || "Could not join game");
	}
	if (response.admin) {
		startButton.style.display = "block";
	}
});

socket.on("responseStart", response => {
	if (response.success) {
		// start the game
		document.body.style.backgroundImage = "url('../" + gameName + "/background.png')";
		waiting.style.display = "none";
		loadJSON("/" + gameName + "/layout.json", content => {
			layout = content;
			init();
		});
	} else {
		alert(response.message || "Could not start game");
	}
});

socket.on("playerList", data => {
	playerList.innerHTML = "";
	data.players.forEach(player => {
		let elem = document.createElement("li");
		elem.innerText = player;
		playerList.appendChild(elem);
	});
});

socket.on("gameCanceled", data => {
	console.log(data);
	setTimeout(() => {
		window.location = "/";
	}, 10000);
});

// when a gameState message is received from the server
socket.on("gameState", gs => {
	// if the player playing in the previous gameState and the new gameState
	// are different show a message that someone new is playing
	if (gameState && gs.playing !== gameState.playing) {
		let texture =
			gs.playing === socket.id ? textures.displays.yourturn : textures.displays.oppturn;
		let popup = createPlane(0, 0, 2, 70, 22, null, texture);

		// remove the message after 2 seconds
		setTimeout(() => {
			removeMesh(popup);
		}, 2000);
	}

	// update the gameState to the new gameState
	gameState = gs;

	// if the game is over and there is a winner show a message that you won or lost the game
	if (gs.winner === socket.id) {
		createPlane(0, 0, 2, 70, 22, null, textures.displays.youwon);
	} else if (gs.winner !== null) {
		createPlane(0, 0, 2, 70, 22, null, textures.displays.youlost);
	}

	// if another player is deciding something on your turn show a message that you are waiting
	if (gs.decision && gs.playing === socket.id && gs.deciding !== socket.id) {
		decidingMesh = createPlane(0, 0, 2, 70, 22, null, textures.displays.wait);
	} else if (decidingMesh) {
		removeMesh(decidingMesh);
	}

	// remove all labels before adding the new labels
	labels.innerHTML = "";

	// for each player display their deck, discard, hand, inplay, and counters
	Object.keys(gs.players).forEach(key => {
		let self = key === socket.id;
		let player = gs.players[key];

		// update counters
		let offset = self ? -1 : 1;

		let text = "";
		layout.counters.display.forEach(counter => {
			text +=
				"<p>" +
				counter.replace(/^(\w)/g, c => c.toUpperCase()) +
				": " +
				player.counters[counter] +
				"</p>";
		});

		displayLabel(
			layout.counters.x * offset,
			layout.counters.y * offset,
			layout.counters.z || 0,
			layout.counters.width,
			layout.counters.height,
			text
		);

		// update deck
		displayDeck({ back: true, count: player.deck }, self);

		//update discard
		displayDiscard({ back: true, count: player.discard.length }, self);

		// update hands
		if (self) {
			displayHand(
				player.hand.map(name => {
					return { name: name };
				}),
				self
			);
		} else {
			displayHand(Array(player.hand).fill({ back: true }));
		}

		// update inplay
		displayInplay(
			player.inPlay.map(name => {
				return { name: name };
			}),
			self
		);
	});

	// display piles with their set x y positions
	Object.keys(gs.shop.piles).forEach(pile => {
		displayPile(
			{
				name: gs.shop.piles[pile].cardName,
				count: gs.shop.piles[pile].amount
			},
			layout.piles[pile].x,
			layout.piles[pile].y,
			layout.piles[pile].target || pile
		);
	});

	// display rows with their set x y positions
	Object.keys(gs.shop.rows).forEach(row => {
		if (layout.rows[row]) {
			displayRow(
				gs.shop.rows[row].row.map(name => {
					return { name: name };
				}),
				layout.rows[row].row.x,
				layout.rows[row].row.y,
				layout.rows[row].row.target || row
			);
			if (layout.rows[row].deck) {
				displayPile(
					{
						back: true,
						count: gs.shop.rows[row].deck
					},
					layout.rows[row].deck.x,
					layout.rows[row].deck.y,
					layout.rows[row].deck.target || row
				);
			}
		}
	});
	highlightMeshes();
});

// when a requestAction message is received from the server
socket.on("requestAction", actions => {
	resetClickableMeshes();
	JSON.parse(actions).forEach(action => {
		if (!action.type || !action.target) {
			console.log("Unable to link action!");
			console.log(action);
			return;
		}

		let mesh = meshes[action.type][action.target];
		if (action.index !== undefined) {
			mesh = mesh[action.index];
		}
		if(!mesh) {
			console.log("No mesh at: " + action.type + " " + action.target);
		}
		mesh.actions.push({
			...action,
			callback: () => {
				socket.emit("responseAction", action);
			}
		});
	});
	highlightMeshes();
});

// when a requestDecision message is received from the server
socket.on("requestDecision", choices => {
	// setup the decision element for displaying
	decision.style.display = "block";
	decision.innerHTML = "";

	// create a p element with the decision description
	let elem = document.createElement("p");
	elem.innerHTML = gameState.description;
	decision.appendChild(elem);

	// create an a element for each choice available
	JSON.parse(choices).forEach(choice => {
		let elem = document.createElement("a");
		elem.innerHTML = choice.name;
		elem.onclick = () => {
			decision.style.display = "none";
			socket.emit("responseDecision", choice);
		};
		decision.appendChild(elem);
	});

	// set the position of the decision element relative to how many choices there are
	decision.style.bottom = (100 - decision.childElementCount * 5) / 2 + "vh";
});
