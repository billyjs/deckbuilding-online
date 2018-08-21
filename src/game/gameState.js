const Player = require("./player");
const Shop = require("./shop");
const helper = require("../helper");

module.exports = class GameState {
	constructor(playerIds, rules) {
		// initialise the game state

		// underscore before class variable name indicates not to be included in state
		this._playerIds = helper.shuffleCopy(playerIds);
		this._phases = rules.phases;
		this._makes = this.createMakes();
		this._effects = this.createEffects();
		this._rules = rules;

		this.decision = null;
		this._decisionCallback = null;
		this.deciding = null;
		this._choices = null;

		this.players = GameState.createPlayers(playerIds, rules.startingDeck, rules.startingHand);
		this.shop = new Shop(rules.cards);
		this.phase = rules.phases[0];
		this._running = true;
		this.winner = null;
		this.playing = this._playerIds[0];
		this.turn = 0;

		this.endAction = { action: "end", type: "player", target: "deck" };

		this.loadRules();
		this.firstDraw();
	}

	loadRules() {
		if (this._rules.game) {
			if (this._rules.game.makes) {
				this._rules.game.makes.forEach(make => {
					this.addActionMake(make.phase, make.func);
				});
			}
			if (this._rules.game.applications) {
				this._rules.game.applications.forEach(effect => {
					this.addActionEffect(effect.action, effect.func);
				});
			}
		}

		if (this._rules.shop) {
			if (this._rules.shop.rows) {
				this._rules.shop.rows.forEach(row => {
					this.shop.createRow(row.name, row.deck, row.shown);
				});
			}
			if (this._rules.shop.piles) {
				this._rules.shop.piles.forEach(pile => {
					this.shop.createPile(pile.name, pile.cardName, pile.amount);
				});
			}
		}

		if (this._rules.player && this._rules.player.counters) {
			this._playerIds.forEach(playerId => {
				let player = this.players[playerId];
				this._rules.player.counters.forEach(counter => {
					player.createCounter(counter.name, counter.value);
				});
			});
		}
	}

	addDecision(playerId, description, choices, callback) {
		this.decision = true;
		this.deciding = playerId;
		this.description = description;
		this._decisionCallback = choice => {
			this.decision = false;
			if (choice) {
				callback(choice);
			}
		};
		this._choices = choices;
	}

	onPhaseStart() {
		// TODO: allow easy change to counter resets and drawing
		switch (this.phase) {
			case "draw":
				let draw = 0;
				if (typeof this._rules.drawAmount === "function") {
					draw = this._rules.drawAmount(this.turn, this._playerIds.indexOf(this.playing));
				} else {
					draw = this._rules.drawAmount;
				}
				this.getPlaying().draw(draw);
				break;
			case "discard":
				this.getPlaying().setCounter("trade", 0);
				this.getPlaying().setCounter("combat", 0);
				this.getPlaying().setCounter("blobs", 0);
				this.getPlaying().setCounter("buyTopDeck", 0);
				break;
			default:
				break;
		}
	}

	onTurnStart() {
		// TODO: allow easy change to end condition
		let alive = [];
		this._playerIds.forEach(playerId => {
			if (this.players[playerId].get("authority") > 0) {
				alive.push(playerId);
			}
		});
		let winner = alive.length === 1 ? alive[0] : null;
		if (winner) {
			this._running = false;
			this.winner = winner;
		}
	}

	nextPhase() {
		let index = this._phases.indexOf(this.phase);
		index += 1;
		if (index >= this._phases.length) {
			index = 0;
			this.nextTurn();
		}
		this.phase = this._phases[index];
		this.onPhaseStart();

		let player = this.getPlaying();
		player.hand.forEach((card, index) => {
			card.onPhaseStart(this, "hand", index);
		});
		player.hand = player.hand.filter(card => {
			return card !== null;
		});
		player.inPlay.forEach((card, index) => {
			card.onPhaseStart(this, "inPlay", index);
		});
		player.inPlay = player.inPlay.filter(card => {
			return card !== null;
		});
	}

	nextTurn() {
		let index = this._playerIds.indexOf(this.playing);
		index += 1;
		this.turn += 1;
		if (index >= this._playerIds.length) {
			index = 0;
			// ROUND END
		}
		this.playing = this._playerIds[index];
		this.onTurnStart();
	}

	getPlaying() {
		return this.players[this.playing];
	}

	applyAction(action) {
		return this._effects[action.action](this, action);
	}

	addActionEffect(action, func) {
		if (typeof func !== "function") {
			Error("attempted to add an action make function that is not a function");
		}
		this._effects[action] = func;
	}

	createEffects() {
		return {
			end: gameState => {
				gameState.nextPhase();
				return "end " + gameState.phase;
			}
		};
	}

	makeActions() {
		let end = this._rules.endPhases.indexOf(this.phase) !== -1;
		let actions = end ? [this.endAction] : [];
		this._makes[this.phase].forEach(make => {
			actions.push(...make(this));
		});
		return actions;
	}

	addActionMake(phase, func) {
		if (typeof func !== "function") {
			Error("attempted to add an action make function that is not a function");
		} else if (this._phases.indexOf(phase) === -1) {
			Error("attempted to add an action make function to an invalid phase: " + phase);
		}
		this._makes[phase].push(func);
	}

	createMakes() {
		let makes = {};
		this._phases.forEach(phase => {
			makes[phase] = [];
		});
		return makes;
	}

	firstDraw() {
		this._playerIds.forEach((playerId, index) => {
			let draw = 0;
			if (typeof this._rules.drawAmount === "function") {
				draw = this._rules.drawAmount(this.turn, index);
			} else {
				draw = this._rules.drawAmount;
			}
			this.players[playerId].draw(draw);
		});
		this.turn = 1;
	}

	/**
	 * Return a random playerId
	 */
	randomPlayer() {
		let index = Math.floor(Math.random() * this._playerIds.length);
		return this._playerIds[index];
	}

	/**
	 * Get the game state as an object censored for playerId
	 * @param playerId
	 * @returns {{}}
	 */
	getState(playerId) {
		return {
			phase: this.phase,
			winner: this.winner,
			playing: this.playing,
			decision: this.decision,
			deciding: this.deciding,
			description: this.description,
			turn: this.turn,
			shop: this.shop.getState(),
			players: this.getPlayerStates(playerId)
		};
	}

	/**
	 * Get the game states of each player
	 * @param playerId
	 * @returns {{}}
	 */
	getPlayerStates(playerId) {
		let states = {};
		this._playerIds.forEach(id => {
			states[id] = this.players[id].getState(playerId !== id);
		});
		return states;
	}

	/**
	 * Creates on object containing
	 * @param playerIds
	 * @param deck
	 * @returns {{}}
	 */
	static createPlayers(playerIds, createDeck, createHand) {
		let players = {};
		playerIds.forEach(playerId => {
			players[playerId] = new Player(createDeck(), createHand());
		});
		return players;
	}
};
