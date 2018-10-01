const types = require("./types");

function gainImmortality(gameState) {
	if (gameState.shop.piles.templeOfImmortality.amount === 1) {
		let temple = gameState.shop.fromPile("templeOfImmortality", gameState);
		gameState.getPlaying().playCard(gameState, temple);
	} else {
		gameState._playerIds.forEach(playerId => {
			let player = gameState.players[playerId];
			let i = player.inPlay.map(card => card.name).indexOf("TempleOfImmortality");
			if (i !== -1 && playerId !== gameState.playing) {
				let temple = gameState.players[playerId].inPlay.splice(i, 1)[0];
				gameState.getPlaying().playCard(gameState, temple);
			}
		});
	}
}

function immortality(gameState) {
	/* TODO: immortality function
		choose a faction when you acquire a card of that faction, if the next card to enter
		the center row is also that faction, acquire it without paying its cost.
	*/
}

function banish(gameState) {
	// TODO: banish a card from your hand or discard pile
}

const cards = {
	Apprentice: class Apprentice extends types.Hero {
		constructor() {
			super();
			this.name = "Apprentice";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 1);
		}
	},
	Militia: class Militia extends types.Hero {
		constructor() {
			super();
			this.name = "Militia";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 1);
			gameState.getPlaying().updateCounter("life", 1);
			gameState.getPlaying().updateCounter("death", 1);
		}
	},
	Mystic: class Mystic extends types.Hero {
		constructor() {
			super();
			this.name = "Mystic";
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 2);
		}
	},
	HeavyInfantry: class HeavyInfantry extends types.Hero {
		constructor() {
			super();
			this.name = "HeavyInfantry";
			this.cost = 2;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 2);
		}
	},
	Cultist: class Cultist extends types.Monster {
		constructor() {
			super();
			this.name = "Cultist";
			this.cost = 2;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 1);
		}
	},
	TempleOfLife: class TempleOfLife extends types.Temple {
		constructor() {
			super();
			this.name = "TempleOfLife";
			this.keystone = "life";
			this.addAbility("keystone", this.keystoneAbility.bind(this), false, false);
		}
		keystoneAbility(gameState) {
			gameState.getPlaying().updateCounter("life", -1);
			this.checkKeystones(gameState);
			gainImmortality(gameState);
			gameState.getPlaying().updateCounter("runes", 2);
		}
	},
	TempleOfDeath: class TempleOfDeath extends types.Temple {
		constructor() {
			super();
			this.name = "TempleOfDeath";
			this.keystone = "death";
			this.addAbility("keystone", this.keystoneAbility.bind(this), false, false);
		}
		keystoneAbility(gameState) {
			gameState.getPlaying().updateCounter("death", -1);
			this.checkKeystones(gameState);
			gainImmortality(gameState);
			banish(gameState);
		}
	},
	TempleOfImmortality: class TempleOfImmortality extends types.Temple {
		constructor() {
			super();
			this.name = "TempleOfImmortality";
			this.addAbility("primary", this.primaryAbility.bind(this));
		}
		primaryAbility(gameState) {
			immortality(gameState);
			this.abilities.primary.used = true;
		}
	},
	StarvedAbomination: class StarvedAbomination extends types.Monster {
		constructor() {
			super();
			this.name = "StarvedAbomination";
			this.cost = 4;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 1);
			gameState.getPlaying().updateCounter("life", 1);
		}
	},
	CheerfulConsort: class CheerfulConsort extends types.Hero {
		constructor() {
			super();
			this.name = "CheerfulConsort";
			this.cost = 2;
			this.faction = "lifebound";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 1);
			gameState.getPlaying().draw(1);
		}
	}
};

module.exports = {
	_costEnum: {
		Mystic: 3,
		HeavyInfantry: 2,
		Cultist: 2,
		StarvedAbomination: 4,
		CheerfulConsort: 2
	},
	...cards
};
