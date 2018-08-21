const Card = require("../game/card");

class Commander extends Card {
	constructor() {
		super();
		this.types.add("commander");
	}
	onPlay() {
		// cannot be played
	}
	onPhaseStart(gameState) {
		switch (gameState.phase) {
			case "commander":
				this.onActivate(gameState, { ability: "primary" });
				break;
			case "discard":
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onOtherPlay() {
		// TODO
	}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
}

class Action extends Card {
	constructor() {
		super();
		this.types.add("action");
	}
	onPlay(gameState) {
		gameState.getPlaying().updateCounter("actionPoints", -1);
		if (this.isAvailable("primary")) {
			this.onActivate(gameState, { ability: "primary" });
		}
	}
	onPhaseStart(gameState, location, index) {
		switch (gameState.phase) {
			case "discard":
				if (["hand", "inPlay"].indexOf(location) !== -1) {
					// TODO: function in player to do this
					gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
					gameState.getPlaying()[location][index] = null;
				}
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {
		// TODO
	}
}

class Personnel extends Card {
	constructor() {
		super();
		this.types.add("personnel");
	}
	onPlay(gameState) {
		if (this.isAvailable("primary")) {
			this.onActivate(gameState, { ability: "primary" });
		}
	}
	onPhaseStart(gameState, location, index) {
		switch (gameState.phase) {
			case "discard":
				if (["hand", "inPlay"].indexOf(location) !== -1) {
					// TODO: function in player to do this
					gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
					gameState.getPlaying()[location][index] = null;
				}
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {
		// TODO
	}
}

module.exports = {
	Commander,
	Personnel,
	Action
};
