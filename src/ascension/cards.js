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
	let choices = [
		{ name: "Void", value: 1 },
		{ name: "Mechana", value: 2 },
		{ name: "Lifebound", value: 3 },
		{ name: "Enlightened", value: 4 }
	];
	gameState.addDecision(gameState.playing, "Choose a faction.", choices, choice => {
		gameState.getPlaying().setCounter("faction", choice.value);
	});
}

function banish(gameState, optional) {
	let choices = optional ? [{ name: "None", value: false }] : [];
	choices.push(
		...gameState.getPlaying().hand.map((card, index) => {
			return {
				name: "Hand: " + card.name.replace(/([a-z](?=[A-Z]))/g, "$1 ").replace(/_/g, ", ").replace(/\$/g, "'"),
				value: {
					target: "hand",
					index: index
				}
			};
		})
	);
	choices.push(
		...gameState.getPlaying().discard.map((card, index) => {
			return {
				name: "Discard: " + card.name.replace(/([a-z](?=[A-Z]))/g, "$1 ").replace(/_/g, ", ").replace(/\$/g, "'"),
				value: {
					target: "discard",
					index: index
				}
			};
		})
	);
	gameState.addDecision(
		gameState.playing,
		"Choose a card from you hand or discard to banish.",
		choices,
		choice => {
			if (choice.value !== false) {
				let card = gameState.getPlaying().from(choice.value.target, choice.value.index);
				if (["Apprentice", "Militia", "Mystic", "HeavyInfanty"].indexOf(card.name) === -1) {
					gameState.shop.rows.centreRow.discard.push(card.name);
				}
			}
		}
	);
}

function shuffleDiscardToDeck(gameState) {
	let choices = [{ name: "Do Not Shuffle", value: 1 }];
	if (gameState.getPlaying().discard.length !== 0) {
		choices.push({ name: "Shuffle", value: 2 });
	}
	gameState.addDecision(
		gameState.playing,
		"Choose if you want to shuffle your discard pile into your deck.",
		choices,
		choice => {
			if (choice.value === 2) {
				gameState.getPlaying().refreshDeck();
			}
		}
	);
}

function defeatHellfrostImps(gameState) {
	// TODO: you may defeat a Monster in the center row named Hellfrost Imps without paying its cost
	let choices = [{ name: "Do Not Defeat", value: false }];
	let index = gameState.shop.rows.centreRow.row.indexOf("HellfrostImps");
	if (index !== -1) {
		choices.push({ name: "Defeat Hellfrost Imps", value: { index } });
	}
	gameState.addDecision(
		gameState.playing,
		"Choose if you want to defeat Hellfrost Imps for no cost.",
		choices,
		choice => {
			if (choice.value) {
				let card = gameState.shop.fromRow("centreRow", choice.value.index, gameState);
				gameState.shop.rows.centreRow.discard.push(card.name);
				card.onActivate(gameState, {
					action: "attack",
					type: "rows",
					target: "centreRow",
					index: choice.value.index,
					ability: "reward",
					cost: 0
				});
			}
		}
	);
}

function destroyConstructEach(gameState) {
	// TODO: each opponent must destroy a construct they control. draw a card for each opponent that did  not destroy  a Construct this way
	// skipping for now
}

function graveGolemCopy(gameState) {
	// TODO: each opponent reveals the top card of their deck and puts it into their discard pile. choose a Hero revealed this way and copy its effect
	// skipping for now
}

function removeTempleConstructs(gameState) {
	["templeOfLife", "templeOfDeath", "templeOfImmortality"].forEach(temple => {
		gameState.shop.piles[temple].amount = 1;
	});
	gameState._playerIds.forEach(playerId => {
		let player = gameState.players[playerId];
		let discard = [];
		let inplay = [];
		player.inPlay.forEach(card => {
			if (card.types.has("construct")) {
				discard.push(card);
			} else if (!card.types.has("temple")) {
				inplay.push(card);
			}
		});
		player.inPlay = inplay;
		player.toDiscard(discard);
	});
}

function discardTopDeck(gameState) {
	let card = gameState.getPlaying().deck.shift();
	if (!card) {
		gameState.getPlaying().refreshDeck();
		discardTopDeck(gameState);
	} else {
		gameState.getPlaying().toDiscard(card);
	}
}

function discardDeck(gameState) {
	gameState.getPlaying().toDiscard(gameState.getPlaying().deck);
	gameState.getPlaying().deck = [];
}

function getVoid(gameState) {
	let choices = [];
	gameState.getPlaying().discard.forEach((card, index) => {
		if (card.faction === "void") {
			choices.push({ name: card.name.replace(/([a-z](?=[A-Z]))/g, "$1 ").replace(/_/g, ", ").replace(/\$/g, "'"), value: { index } });
		}
	});
	gameState.addDecision(
		gameState.playing,
		"Choose a Void card to add to your hand.",
		choices,
		choice => {
			if (choice.value && choice.value.index) {
				let card = gameState.getPlaying().from("discard", choice.value.index);
				gameState.getPlaying().toHand(card);
			}
		}
	);
}

const cards = {
	Apprentice: class Apprentice extends types.Hero {
		constructor() {
			super();
			this.name = "Apprentice";
			this.value = 0;
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
			this.value = 0;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 1);
		}
	},
	Mystic: class Mystic extends types.Hero {
		constructor() {
			super();
			this.name = "Mystic";
			this.cost = 3;
			this.value = 1;
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
			this.value = 1;
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
			this.value = 5;
			this.keystone = "life";
			this.addAbility("keystone", this.keystoneAbility.bind(this), false, false);
		}
		keystoneAbility(gameState) {
			gameState.getPlaying().updateCounter("life", -1);
			gainImmortality(gameState);
			gameState.getPlaying().updateCounter("runes", 2);
		}
	},
	TempleOfDeath: class TempleOfDeath extends types.Temple {
		constructor() {
			super();
			this.name = "TempleOfDeath";
			this.value = 5;
			this.keystone = "death";
			this.addAbility("keystone", this.keystoneAbility.bind(this), false, false);
		}
		keystoneAbility(gameState) {
			gameState.getPlaying().updateCounter("death", -1);
			gainImmortality(gameState);
			banish(gameState, true);
		}
	},
	TempleOfImmortality: class TempleOfImmortality extends types.Temple {
		constructor() {
			super();
			this.name = "TempleOfImmortality";
			this.value = 10;
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
			gameState.getPlaying().updateCounter("honour", 3);
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
			gameState.getPlaying().updateCounter("honour", 3);
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
	Hurras_Sea$sFury: class Hurras_Sea$sFury extends types.Monster {
		constructor() {
			super();
			this.name = "Hurras_Sea$sFury";
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
	Kan$zir_TheRavager: class Kan$zir_TheRavager extends types.Monster {
		constructor() {
			super();
			this.name = "Kan$zir_TheRavager";
			this.cost = 6;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 5);
			removeTempleConstructs(gameState);
		}
	},
	Iku_ValleyTyrant: class Iku_ValleyTyrant extends types.Monster {
		constructor() {
			super();
			this.name = "Iku_ValleyTyrant";
			this.cost = 10;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 8);
		}
	},
	Iku$sMinions: class Iku$sMinions extends types.Monster {
		constructor() {
			super();
			this.name = "Iku$sMinions";
			this.cost = 5;
			this.addAbility("reward", this.rewardAbility);
		}
		rewardAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 4);
			banish(gameState, true);
		}
	},
	CheerfulConsort: class CheerfulConsort extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "CheerfulConsort";
			this.value = 1;
			this.cost = 2;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 1);
			gameState.getPlaying().draw(1);
		}
	},
	ExcavatorPilot: class ExcavatorPilot extends types.MechanaHero {
		constructor() {
			super();
			this.name = "ExcavatorPilot";
			this.value = 1; // TODO: find honour value
			this.cost = 4;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			let playing = gameState.getPlaying();
			playing.updateCounter("runes", 2);
			let constructs = playing.inPlay.reduce((total, card) => {
				return card.types.has("construct") ? total + 1 : total;
			}, 0);
			if (constructs >= 2) {
				playing.updateCounter("life", 1);
			}
		}
	},
	Pathfinder$sTotem: class Pathfinder$sTotem extends types.LifeboundConstruct {
		constructor() {
			super();
			this.name = "Pathfinder$sTotem";
			this.value = 1;
			this.cost = 1;
			this.addAbility("unite", this.uniteAbility);
		}
		uniteAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 1);
		}
	},
	QadimStalker: class QadimStalker extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "QadimStalker";
			this.value = 3;
			this.cost = 5;
			this.addAbility("primary", this.primaryAbility);
			this.addAbility("unite", this.uniteAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 2);
			gameState.getPlaying().updateCounter("power", 2);
		}
		uniteAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 2);
		}
	},
	AncientStag: class AncientStag extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "AncientStag";
			this.value = 1;
			this.cost = 2;
			this.addAbility("primary", this.primaryAbility);
			this.addAbility("unite", this.uniteAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 3);
		}
		uniteAbility(gameState) {
			gameState.getPlaying().updateCounter("life", 1);
		}
	},
	SirewoodElder: class SirewoodElder extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "SirewoodElder";
			this.value = 1; // TODO: find honour value
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
			this.addAbility("unite", this.uniteAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 2);
		}
		uniteAbility(gameState) {
			gameState.getPlaying().draw(1);
		}
	},
	AlosyanGuide: class AlosyanGuide extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "AlosyanGuide";
			this.value = 1;
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("honour", 3);
		}
	},
	BurialGuardian: class BurialGuardian extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "BurialGuardian";
			this.value = 1; // TODO: find honour value
			this.cost = 4;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 2);
			gameState.getPlaying().setCounter("acquireLifebound", 1);
		}
	},
	Asalas_TheImpaler: class Asalas_TheImpaler extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "Asalas_TheImpaler";
			this.value = 5;
			this.cost = 7;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 2);
			gameState.getPlaying().setCounter("acquireHero", 1);
		}
	},
	CaretakerZahral: class CaretakerZahral extends types.LifeboundHero {
		constructor() {
			super();
			this.name = "CaretakerZahral";
			this.value = 4;
			this.cost = 6;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("runes", 3);
			gameState.getPlaying().setCounter("heroTopDeck", 1);
		}
	},
	SpitefulGladiator: class SpitefulGladiator extends types.VoidHero {
		constructor() {
			super();
			this.name = "SpitefulGladiator";
			this.value = 2;
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
			this.addAbility("echo", this.echoAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 2);
		}
		echoAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 2);
		}
	},
	ShadowridgeScout: class ShadowridgeScout extends types.VoidHero {
		constructor() {
			super();
			this.name = "ShadowridgeScout";
			this.value = 1;
			this.cost = 2;
			this.addAbility("primary", this.primaryAbility);
			this.addAbility("echo", this.echoAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 2);
		}
		echoAbility(gameState) {
			gameState.getPlaying().updateCounter("death", 1);
		}
	},
	ExcavationSentry: class ExcavationSentry extends types.VoidHero {
		constructor() {
			super();
			this.name = "ExcavationSentry";
			this.value = 1; // TODO: find honour value
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 2);
			discardTopDeck(gameState);
			banish(gameState, true);
		}
	},
	SilencedProphet: class SilencedProphet extends types.VoidHero {
		constructor() {
			super();
			this.name = "SilencedProphet";
			this.value = 3;
			this.cost = 5;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().draw(1);
			discardTopDeck(gameState);
			banish(gameState, true);
		}
	},
	BeaconOfTheLost: class BeaconOfTheLost extends types.VoidConstruct {
		constructor() {
			super();
			this.name = "BeaconOfTheLost";
			this.value = 1; // TODO: find honour value
			this.cost = 1;
			this.addAbility("echo", this.echoAbility);
		}
		echoAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 1);
		}
	},
	DerangedDirge: class DerangedDirge extends types.VoidConstruct {
		constructor() {
			super();
			this.name = "DerangedDirge";
			this.value = 2;
			this.cost = 4;
			this.addAbility("primary", this.primaryAbility);
			this.addAbility("banish", this.banishAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 1);
		}
		banishAbility(gameState, action) {
			banish(gameState);
			gameState.shop.rows.centreRow.discard.push(
				gameState.getPlaying().fromInPlay(action.index).name
			);
		}
	},
	Randall_UmbralSage: class Randall_UmbralSage extends types.VoidHero {
		constructor() {
			super();
			this.name = "Randall_UmbralSage";
			this.value = 4;
			this.cost = 7;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 3);
			discardDeck(gameState);
			getVoid(gameState);
		}
	},
	EndbringerJora: class EndbringerJora extends types.VoidHero {
		constructor() {
			super();
			this.name = "EndbringerJora";
			this.value = 4;
			this.cost = 6;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 3);
			gameState.getPlaying().setCounter("endbringerDefeat", 1);
		}
	},
	SoulsnareHunter: class SoulsnareHunter extends types.VoidHero {
		constructor() {
			super();
			this.name = "SoulsnareHunter";
			this.value = 2;
			this.cost = 4;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("power", 2);
			gameState.getPlaying().setCounter("soulsnareDefeat", 1);
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
		Hurras_Sea$sFury: 7,
		CavernHorror: 2,
		HellfrostImps: 3,
		Kan$zir_TheRavager: 6,
		Iku_ValleyTyrant: 10,
		Iku$sMinions: 5,
		CheerfulConsort: 2,
		Pathfinder$sTotem: 1,
		QadimStalker: 5,
		AncientStag: 2,
		SirewoodElder: 3,
		AlosyanGuide: 3,
		BurialGuardian: 4,
		Asalas_TheImpaler: 7,
		CaretakerZahral: 6,
		SpitefulGladiator: 3,
		ShadowridgeScout: 2,
		ExcavationSentry: 3,
		SilencedProphet: 5,
		BeaconOfTheLost: 1,
		DerangedDirge: 4,
		Randall_UmbralSage: 7,
		EndbringerJora: 6,
		SoulsnareHunter: 4
	},
	...cards
};
