const types = require("./types");

const cards = {
	CommanderBernard: class CommanderBernard extends types.Commander {
		constructor() {
			super();
			this.name = "CommanderBernard";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("influence", 2);
		}
	},

	CommanderHopkins: class CommanderHopkins extends types.Commander {
		constructor() {
			super();
			this.name = "CommanderHopkins";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("recruitment", 1);
		}
	},

	CommanderHolt: class CommanderHolt extends types.Commander {
		constructor() {
			super();
			this.name = "CommanderHolt";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("actions", 1);
		}
	},

	CommanderReily: class CommanderReily extends types.Commander {
		constructor() {
			super();
			this.name = "CommanderReily";
		}
		onPlay(gameState) {
			let armyPower = types.calcArmyPower(gameState.getPlaying());
			gameState.getPlaying().setCounter("armyPower", armyPower);
		}
	},

	ImpressiveAction: class ImpressiveAction extends types.Action {
		constructor() {
			super();
			this.name = "ImpressiveAction";
			this.cost = 1;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("tempInfluence", 2);
		}
	},

	InspiringSpeech: class InpsiringSpeech extends types.Action {
		constructor() {
			super();
			this.name = "InspiringSpeech";
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("tempInfluence", 5);
		}
	},

	QuickPlay: class QuickPlay extends types.Action {
		constructor() {
			super();
			this.name = "QuickPlay";
			this.cost = 5;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().draw(1);
			gameState.getPlaying().updateCounter("actions", 1);
		}
	},

	DoubleDown: class DoubleDown extends types.Action {
		constructor() {
			super();
			this.name = "DoubleDown";
			this.cost = 5;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().draw(2);
		}
	},

	Prestige: class Prestige extends types.Action {
		constructor() {
			super();
			this.name = "Prestige";
			this.cost = 4;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("influence", 1);
		}
	},

	Raid: class Raid extends types.Action {
		constructor() {
			super();
			this.name = "Raid";
			this.cost = 6;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			let choices = gameState._playerIds
				.filter(player => {
					return player !== gameState.playing;
				})
				.map(player => {
					return {
						name: player,
						value: player
					};
				});
			gameState.addDecision(
				gameState.playing,
				"Choose a player to discard a card from their hand.",
				choices,
				choice => {
					let playerId = choice.value;
					let choices = gameState.players[playerId].hand.map((card, index) => {
						return {
							name: card.name.replace(/([a-z](?=[A-Z]))/g, "$1 "),
							value: index
						};
					});
					gameState.addDecision(
						playerId,
						"Choose a card from your hand to discard.",
						choices,
						choice => {
							let index = choice.value;
							let card = gameState.players[playerId].fromHand(index);
							gameState.players[playerId].toDiscard(card);
						}
					);
				}
			);
		}
	},

	Fire: class Fire extends types.Action {
		constructor() {
			super();
			this.name = "Fire";
			this.cost = 3;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			let choices = [{ name: "None", value: -1 }];
			choices.push(
				...gameState.getPlaying().hand.map((card, index) => {
					return {
						name: card.name.replace(/([a-z](?=[A-Z]))/g, "$1 "),
						value: index
					};
				})
			);
			gameState.addDecision(
				gameState.playing,
				"Choose a card from your hand to remove from play.",
				choices,
				choice => {
					if (choice.value !== -1) {
						gameState.getPlaying().fromHand(choice.value);
					}
				}
			);
		}
	},

	Civilian: class Civilian extends types.Personnel {
		constructor() {
			super();
			this.name = "Civilian";
			this.cost = 1;
		}
	},

	Soldier: class Soldier extends types.Personnel {
		constructor() {
			super();
			this.name = "Soldier";
			this.cost = 3;
		}
	},

	Recruiter: class Recruiter extends types.Personnel {
		constructor() {
			super();
			this.name = "Recruiter";
			this.cost = 8;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("recruitment", 1);
		}
	},

	Sniper: class Sniper extends types.Personnel {
		constructor() {
			super();
			this.name = "Sniper";
			this.cost = 6;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getNotPlaying()[0].updateCounter("tempInfluence", -1);
		}
	},

	Traitor: class Traitor extends types.Personnel {
		constructor() {
			super();
			this.name = "Traitor";
			this.cost = 0;
		}
	},

	Hitman: class Hitman extends types.Personnel {
		constructor() {
			super();
			this.name = "Hitman";
			this.cost = 10;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			let opponent = gameState.getNotPlaying()[0];
			let choices = opponent.hand.map((card, index) => {
				return {
					name: "Card " + index,
					value: index
				};
			});
			let desc =
				"Choose a card from the opponents hand, if it is a personnel card it will be removed from play";
			gameState.addDecision(gameState.playing, desc, choices, choice => {
				if (opponent.hand[choice.value].types.has("personnel")) {
					// remove from play card then recalculate their army power
					opponent.hand.splice(choice.value, 1);
					opponent.setCounter("armyPower", types.calcArmyPower(opponent));
				}
			});
		}
	},

	Spy: class Spy extends types.Personnel {
		constructor() {
			super();
			this.name = "Spy";
			this.cost = 10;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			let choices = [{ name: "Remove a card", value: 0 }];
			if (gameState.shop.piles.traitors && gameState.shop.piles.traitors.amount > 0) {
				choices.push({ name: "Give opponent a Traitor", value: 1 });
			}
			let desc = "Choose an effect";
			gameState.addDecision(gameState.playing, desc, choices, choice => {
				if (choice.value === 0) {
					// remove a card from hand or discard
					let choices = [{ name: "None", value: false }];
					choices.push(
						...gameState.getPlaying().hand.map((card, index) => {
							return {
								name: "Hand: " + card.name.replace(/([a-z](?=[A-Z]))/g, "$1 "),
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
								name: "Discard: " + card.name.replace(/([a-z](?=[A-Z]))/g, "$1 "),
								value: {
									target: "discard",
									index: index
								}
							};
						})
					);
					gameState.addDecision(
						gameState.playing,
						"Choose a card from you hand or discard to remove from play.",
						choices,
						choice => {
							if (choice.value !== false) {
								gameState
									.getPlaying()
									.from(choice.value.target, choice.value.index);
								gameState
									.getPlaying()
									.setCounter(
										"armyPower",
										types.calcArmyPower(gameState.getPlaying())
									);
							}
						}
					);
				} else if (choice.value === 1) {
					// give opponent a traitor
					let opponent = gameState.getNotPlaying()[0];
					opponent.discard.push(new cards.Traitor());
					opponent.setCounter("armyPower", types.calcArmyPower(opponent));
				}
			});
		}
	}
};

module.exports = {
	_costEnum: {
		// Traitor: 0,
		Civilian: 1,
		Soldier: 3,
		Sniper: 6,
		Recruiter: 8,
		Hitman: 10,
		Spy: 10,

		ImpressiveAction: 1,
		InspiringSpeech: 3,
		Fire: 3,
		QuickPlay: 5,
		DoubleDown: 5,
		Prestige: 4,
		Raid: 6
	},
	...cards
};
