const GameState = require("./gameState");

module.exports = class Game {
	constructor(io, gameId, socketIds, rules) {
		this.io = io;
		this.rules = rules;
		this.gameId = gameId;
		this.socketIds = socketIds;
		this.gameState = new GameState(this.socketIds, this.rules);
		// this._running = false;

		// current valid actions
		this.actions = [];

		this.gameState.loadRules();
		this.gameState.firstDraw();
		// this._running = true;
	}

	playerLoaded() {
		this.socketIds.forEach(socketId => {
			if (this.io.sockets.connected[socketId].loaded === false) {
				return false;
			}
		});

		this.startGame();
	}

	startGame() {
		this.all().emit("log", "Game Started");
		this.requestAction();
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
			// this.io.to(socketId).emit('gameState', this.rules.censorGameState(this.gameState, socketId));
			this.io.to(socketId).emit("gameState", this.gameState.getState(socketId));
		});
	}

	all() {
		return this.io.to(this.gameId);
	}
};
