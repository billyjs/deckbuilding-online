const Game = require("./game");
const debug = require("debug")("deck-building-game:gameManager");

module.exports = class GameManager {
	constructor(supported) {
		this.games = {};
		this.supported = supported;
	}

	newGame(io, name) {
		if (this.supported.indexOf(name) === -1) {
			return null;
		}
		let gameId = this.generateId();
		let game = new Game(io, gameId, name, this.cleanupGame.bind(this, gameId));
		this.games[gameId] = game;
		debug("New game created: %s", gameId);
		return game;
	}

	getGame(gameId) {
		return this.games[gameId];
	}

	removeGame(gameId) {
		delete this.games[gameId];
		debug("Game removed: %s", gameId);
	}

	generateId(length = 4) {
		let gameId;
		do {
			gameId = "";
			for (let i = 0; i < length; i++) {
				gameId += String.fromCharCode(Math.floor(Math.random() * 26 + 65));
			}
		} while (this.getGame(gameId));
		return gameId;
	}

	cleanupGame(gameId) {
		this.removeGame(gameId);
	}
};
