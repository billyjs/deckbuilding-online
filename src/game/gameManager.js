const Game = require("./game");

module.exports = class GameManager {
	constructor() {
		this.games = {};
	}

	newGame(io, gameId, socketIds, rules) {
		this.games[gameId] = new Game(io, gameId, socketIds, rules);
	}

	getGame(gameId) {
		return this.games[gameId];
	}
};
