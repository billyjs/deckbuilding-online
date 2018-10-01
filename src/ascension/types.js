const Card = require("../game/card");

class Hero extends Card {
	constructor() {
		super();
		this.types.add("hero");
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
					gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
					gameState.getPlaying()[location][index] = null;
				}
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onAcquire(gameState) {}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {}
	static getType() {
		return "hero";
	}
}

class Construct extends Card {
	constructor() {
		super();
		this.types.add("construct");
	}
	onPlay(gameState) {
		if (this.isAvailable("primary")) {
			this.onActivate(gameState, { ability: "primary" });
		}
	}
	onPhaseStart(gameState, location, index) {
		switch (gameState.phase) {
			case "discard":
				if (["hand"].indexOf(location) !== -1) {
					gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
					gameState.getPlaying()[location][index] = null;
				}
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onAcquire(gameState) {}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {}
	static getType() {
		return "construct";
	}
}

class Monster extends Card {
	constructor() {
		super();
		this.types.add("monster");
	}
	onPlay(gameState) {}
	onPhaseStart(gameState) {
		switch (gameState.phase) {
			case "discard":
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onAcquire(gameState) {}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {}
	static getType() {
		return "monster";
	}
}

class Temple extends Card {
	constructor() {
		super();
		this.types.add("temple");
		this.keystone = null;
	}
	onPlay(gameState) {
		this.checkKeystones(gameState, this.keystone);
	}
	onPhaseStart(gameState) {
		switch (gameState.phase) {
			case "play":
				this.checkKeystones(gameState, this.keystone);
				break;
			case "discard":
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onAcquire(gameState) {}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
		if (this.abilities.keystone) {
			this.abilities.keystone.available = false;
			this.abilities.keystone.used = false;
		}
	}
	checkKeystones(gameState) {
		console.log("CHECKING");
		if (this.keystone && this.abilities.keystone) {
			let amount = gameState.getPlaying().get(this.keystone);
			this.abilities.keystone.available = amount >= 1;
			console.log(this.abilities.keystone);
		}
	}
	onOtherPlay(gameState, other) {
		this.checkKeystones(gameState, this.keystone);
	}
	onActivate(gameState, action) {
		// check if the ability in the action is available
		if (action && this.isAvailable(action.ability)) {
			// run the ability's function
			this.abilities[action.ability].func(gameState, action);

			// don't set the ability to be used as it can be used as long as there is keystones
			// this.abilities[action.ability].used = true;

			return true;
		}
		return false;
	}
	static getType() {
		return "temple";
	}
}

module.exports = {
	Hero,
	Construct,
	Monster,
	Temple
};
