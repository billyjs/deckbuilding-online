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

function shuffleDiscardToDeck(gameState) {
	// TODO: you may shuffle your discard into your deck
}

function defeatHellfrostImps(gameState) {
	// TODO: you may defeat a Monster in the center row named Hellfrost Imps without paying its cost
}

function destroyConstructEach(gameState) {
	// TODO: each opponent must destroy a construct they control. draw a card for each opponent that did  not destroy  a Construct this way
}

function graveGolemCopy(gameState) {
	// TODO: each opponent reveals the top card of their deck and puts it into their discard pile. choose a Hero revealed this way and copy its effect
}

function removeTempleConstructs(gameState) {
	// TODO: each opponent loses control of all their Temples and destroys all Constructs they control
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
	CryptLurker: class CryptLurker extends types.Monster {
		constructor() {
			super();
			this.name = "CryptLurker";
			this.cost = 4;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 1);
			gameState.getPlaying().updateCounter("death", 1);
		}
	},
	MutatedScavenger: class MutatedScavenger extends types.Monster {
		constructor() {
			super();
			this.name = "MutatedScavenger";
			this.cost = 6;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 4);
			gameState.getPlaying().updateCounter("runes", 5);
		}
	},
	HurrasSeasFury: class HurrasSeasFury extends types.Monster {
		constructor() {
			super();
			this.name = "Hurras, Sea's Fury";
			this.cost = 7;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 4);
			gameState.getPlaying().updateCounter("life", 1);
			gameState.getPlaying().updateCounter("death", 1);
		}
	},
	CavernHorror: class CavernHorror extends types.Monster {
		constructor() {
			super();
			this.name = "CavernHorror";
			this.cost = 2;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 1);
			shuffleDiscardToDeck(gameState);
		}
	},
	HellfrostImps: class HellfrostImps extends types.Monster {
		constructor() {
			super();
			this.name = "HellfrostImps";
			this.cost = 3;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 2);
			defeatHellfrostImps(gameState);
		}
	},
	DeathsWidow: class DeathsWidow extends types.Monster {
		constructor() {
			super();
			this.name = "Death'sWidow";
			this.cost = 4;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 2);
			destroyConstructEach(gameState);
		}
	},
	GraveGolem: class GraveGolem extends types.Monster {
		constructor() {
			super();
			this.name = "GraveGolem";
			this.cost = 5;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 4);
			graveGolemCopy(gameState);
		}
	},
	KanzirTheRavager: class KanzirTheRavager extends types.Monster {
		constructor() {
			super();
			this.name = "Kan'zir, theRavager";
			this.cost = 6;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 5);
			removeTempleConstructs(gameState);
		}
	},
	IkuValleyTyrant: class IkuValleyTyrant extends types.Monster {
		constructor() {
			super();
			this.name = "Iku, ValleyTyrant";
			this.cost = 10;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 8);
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
		CryptLurker: 4,
		MutatedScavenger: 6,
		HurrasSeasFury: 7,
		CavernHorror: 2,
		HellfrostImps: 3,
		DeathsWidow: 4,
		GraveGolem: 5,
		KanzirTheRavager: 6,
		IkuValleyTyrant: 10,
		CheerfulConsort: 2
	},
	...cards
};
