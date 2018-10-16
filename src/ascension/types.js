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
		this.checkUnite(gameState);
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
		this.played = false;
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
		if (this.abilities.unite) {
			this.abilities.unite.available = false;
			this.abilities.unite.used = false;
		}
		if (this.abilities.echo) {
			this.abilities.echo.available = false;
			this.abilities.echo.used = false;
		}
	}
	checkUnite(gameState) {
		if (this.abilities.unite) {
			let unite = gameState.getPlaying().get("unite") - 1 * this.played;
			this.abilities.unite.available = unite >= 1;
		}
	}
	onOtherPlay(gameState, other) {
		this.checkUnite(gameState);
	}
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
		this.checkUnite(gameState);
	}
	onPhaseStart(gameState, location, index) {
		switch (gameState.phase) {
			case "play":
				this.checkUnite(gameState);
				break;
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
		if (this.abilities.unite) {
			this.abilities.unite.available = false;
			this.abilities.unite.used = false;
		}
		if (this.abilities.echo) {
			this.abilities.echo.available = false;
			this.abilities.echo.used = false;
		}
		if (this.abilities.banish) {
			this.abilities.banish.available = true;
			this.abilities.banish.used = false;
		}
	}
	checkUnite(gameState) {
		if (this.abilities.unite) {
			let unite = gameState.getPlaying().get("unite");
			this.abilities.unite.available = unite >= 1;
		}
	}
	onOtherPlay(gameState, other) {
		this.checkUnite(gameState);
	}
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
	static getFaction() {
		return "monster";
	}
}

class Temple extends Card {
	constructor() {
		super();
		this.types.add("temple");
		this.keystone = null;
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
		if (this.abilities.keystone) {
			this.abilities.keystone.available = false;
			this.abilities.keystone.used = false;
		}
	}
	isAvailable(ability, gameState) {
		if (this.keystone && this.abilities.keystone && ability === "keystone" && gameState) {
			this.abilities[ability].available = gameState.getPlaying().get(this.keystone) >= 1;
		}
		return (
			this.abilities.hasOwnProperty(ability) &&
			this.abilities[ability].available === true &&
			this.abilities[ability].used === false &&
			typeof this.abilities[ability].func === "function"
		);
	}
	availableAbilities(gameState) {
		let abilities = [];

		Object.keys(this.abilities).forEach(ability => {
			// check is the ability is available
			if (this.isAvailable(ability, gameState)) {
				abilities.push(ability);
			}
		});

		return abilities;
	}
	onOtherPlay(gameState, other) {}
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

class VoidHero extends Hero {
	constructor() {
		super();
		this.types.add("void");
		this.faction = "void";
	}
	isAvailable(ability, gameState) {
		if (ability === "echo" && gameState) {
			this.abilities[ability].available = gameState.getPlaying().discard.some(card => {
				return card.faction === "void";
			});
		}
		return (
			this.abilities.hasOwnProperty(ability) &&
			this.abilities[ability].available === true &&
			this.abilities[ability].used === false &&
			typeof this.abilities[ability].func === "function"
		);
	}
	availableAbilities(gameState) {
		let abilities = [];

		Object.keys(this.abilities).forEach(ability => {
			// check is the ability is available
			if (this.isAvailable(ability, gameState)) {
				abilities.push(ability);
			}
		});

		return abilities;
	}
	static getFaction() {
		return "void";
	}
}

class EnlightenedHero extends Hero {
	constructor() {
		super();
		this.types.add("enlightened");
		this.faction = "enlightened";
	}
	static getFaction() {
		return "enlightened";
	}
}

class LifeboundHero extends Hero {
	constructor() {
		super();
		this.types.add("lifebound");
		this.faction = "lifebound";
		this.played = false;
	}
	onPlay(gameState) {
		if (this.isAvailable("primary")) {
			this.onActivate(gameState, { ability: "primary" });
		}
		this.played = true;
		gameState.getPlaying().updateCounter("unite", 1);
		this.checkUnite(gameState);
	}
	static getFaction() {
		return "lifebound";
	}
}

class MechanaHero extends Hero {
	constructor() {
		super();
		this.types.add("mechana");
		this.faction = "mechana";
	}
	static getFaction() {
		return "mechana";
	}
}

class VoidConstruct extends Construct {
	constructor() {
		super();
		this.types.add("void");
		this.faction = "void";
	}
	isAvailable(ability, gameState) {
		if (ability === "echo" && gameState) {
			this.abilities[ability].available = gameState.getPlaying().discard.some(card => {
				return card.faction === "void";
			});
		}
		return (
			this.abilities.hasOwnProperty(ability) &&
			this.abilities[ability].available === true &&
			this.abilities[ability].used === false &&
			typeof this.abilities[ability].func === "function"
		);
	}
	availableAbilities(gameState) {
		let abilities = [];

		Object.keys(this.abilities).forEach(ability => {
			// check is the ability is available
			if (this.isAvailable(ability, gameState)) {
				abilities.push(ability);
			}
		});

		return abilities;
	}
	static getFaction() {
		return "void";
	}
}

class LifeboundConstruct extends Construct {
	constructor() {
		super();
		this.types.add("lifebound");
		this.faction = "lifebound";
	}
	static getFaction() {
		return "lifebound";
	}
}

module.exports = {
	Hero,
	Construct,
	Monster,
	Temple,
	VoidHero,
	EnlightenedHero,
	LifeboundHero,
	MechanaHero,
	VoidConstruct,
	LifeboundConstruct
};
