const GameState = require("./gameState");
const debug = require("debug")("deck-building-game:game");

module.exports = class Game {
	constructor(io, gameId, name, callback) {
		this.io = io;
		this.name = name;
		this.rules = require("../" + this.name + "/rules");
		this.gameId = gameId;
		this.callback = callback;
		this.socketIds = [];
		this.sockets = [];
		this.gameState = null;
		this.running = false;
		// this.gameState = new GameState(this.socketIds, this.rules);
		// this._running = false;

		// current valid actions
		this.actions = [];

		// this.gameState.loadRules();
		// this.gameState.firstDraw();
		// this._running = true;
	}

	addPlayer(name, socket) {
		name = name.substring(0, 12);
		socket.name = name;
		socket.game = this.gameId;
		socket.join(this.gameId);
		this.socketIds.push(socket.id);
		this.sockets.push(socket);
		socket.on("disconnecting", this.onPlayerDisconnecting.bind(this, socket));
		this.sendPlayerList();
	}

	removePlayer(socketId) {
		let index = this.socketIds.indexOf(socketId);
		if (index !== -1) {
			this.socketIds.splice(index, 1);
			this.sockets.splice(index, 1);
		}
		this.sendPlayerList();
	}

	onPlayerDisconnecting(socket) {
		if (this.running) {
			this.removePlayer(socket.id);
			this.all().emit("gameCanceled", {
				message: "Player " + socket.name + " disconnected from the game"
			});
		} else {
			this.removePlayer(socket.id);
			this.sendAdmin();
		}
		if (this.sockets.length === 0) {
			this.callback();
		}
	}

	onPlayerLoaded(socket) {
		debug("Player %s loaded in game %s", socket.name, this.gameId);
		this.sockets.forEach(socket => {
			if (socket.loaded === false) {
				return false;
			}
		});
		this.requestAction();
		return true;
	}

	startGame(socket) {
		if (this.sockets.length !== 2) {
			return { message: "Incorrect amount of players" };
		}
		if (this.sockets[0] !== socket) {
			return { message: "Room creator must start game" };
		}
		if (this.running) {
			return { message: "Game is already started" };
		}
		debug("Game started: %s", this.gameId);
		this.running = true;
		this.gameState = new GameState(this.socketIds, this.rules);
		this.all().emit("log", "Game Started");
	}

	requestAction() {
		this.sendGameState();

		// gameState.decision = true;
		// gameState._decisionCallback = callback;
		// gameState._choices = _choices;
		// this.actions = this.rules.makeActions(this.gameState);
		this.actions = this.gameState.makeActions();

		switch (this.actions.length) {
			case 0:
				break;
			case 1:
				this.handleAction(this.actions[0]);
				break;
			default:
				this.io.sockets.connected[this.gameState.playing].emit(
					"requestAction",
					JSON.stringify(this.actions)
				);
				break;
		}
	}

	handleAction(action) {
		// TODO: Validate action is correct player and valid action
		let playing = this.gameState.playing;
		let log = this.gameState.applyAction(action);
		this.all().emit("log", playing + " - Action: " + log);
		this.next();
	}

	requestDecision() {
		this.sendGameState();
		let choices = this.gameState._choices;
		switch (choices.length) {
			case 0:
				this.handleDecision(null);
				break;
			case 1:
				this.handleDecision(choices[0]);
				break;
			default:
				this.io.sockets.connected[this.gameState.deciding].emit(
					"requestDecision",
					JSON.stringify(choices)
				);
				break;
		}
	}

	handleDecision(choice) {
		// TODO: validate decision

		this.gameState._decisionCallback(choice);

		if (choice) {
			this.all().emit("log", "Decision: " + choice.name);
		}

		this.next();
	}

	next() {
		if (this.gameState._running) {
			if (this.gameState.decision) {
				this.requestDecision();
				this.gameState.decision = false;
			} else {
				this.requestAction();
			}
		} else {
			this.sendGameState();
		}
	}

	sendGameState() {
		this.socketIds.forEach(socketId => {
			this.io.to(socketId).emit("gameState", this.gameState.getState(socketId));
		});
	}

	sendPlayerList() {
		this.all().emit("playerList", {
			players: this.sockets.map(socket => {
				return socket.name;
			})
		});
	}

	sendAdmin() {
		if (this.sockets.length > 0) {
			this.sockets[0].emit("responseJoin", {
				gameId: this.gameId,
				success: true,
				admin: true
			});
		}
	}

	all() {
		return this.io.to(this.gameId);
	}
};
