const cards = require("./cards");

function makeCommanderActions(gameState) {
	const commander = function(card) {
		return card.types.has("commander");
	};
	let actions = [];
	let hasCommander = gameState.getPlaying().inPlay.some(commander);
	if (!hasCommander) {
		// let description = "Choose a commander for your army";
		// let choices = gameState.shop.rows.commanders.row.map(commander => {
		// 	return {
		// 		name: commander.replace(/([a-z](?=[A-Z]))/g, "$1 "),
		// 		value: commander
		// 	};
		// });
		// gameState.addDecision(gameState.playing, description, choices, choice => {
		// 	gameState.getPlaying().inPlay.push(new cards[choice.value]());
		// });
		// for (let i = 0; i < 5; i++) {
		// 	gameState.getPlaying().hand.push(new cards.CommanderBernard());
		// }
		gameState.getPlaying().hand.forEach((card, index) => {
			if (card.types.has("commander")) {
				actions.push({
					action: "choose",
					target: "hand",
					type: "player",
					card: card.name,
					index: index
				});
			}
		});
	} else {
		actions.push(gameState.endAction);
	}
	return actions;
}

function makePlayingActions(gameState) {
	let actions = [];
	gameState.getPlaying().hand.forEach((card, index) => {
		if (
			card.types.has("personnel") ||
			(card.types.has("action") && gameState.getPlaying().get("actionPoints") > 0)
		) {
			actions.push({
				action: "play",
				target: "hand",
				type: "player",
				card: card.name,
				index: index
			});
		}
	});
	return actions;
}

function actionPlay(gameState, action) {
	gameState.getPlaying().play(gameState, action.index);
}

function actionChoose(gameState, action) {
	gameState.getPlaying().play(gameState, action.index);
	gameState.getPlaying().hand = [];
}

function drawAmount(turn, index) {
	if (turn === 0) {
		return 0;
	} else {
		return 5;
	}
}

function createStartingDeck() {
	let deck = [];
	for (let i = 0; i < 10; i++) {
		deck.push(new cards.Civilian());
	}
	return deck;
}

function createStartingHand() {
	let hand = [];
	for (let i = 0; i < 5; i++) {
		hand.push(new cards.CommanderBernard());
	}
	return hand;
}

module.exports = {
	cards: cards,
	players: {
		min: 2,
		max: 2
	},
	phases: ["commander", "action", "recruitment", "discard", "draw"],
	endPhases: ["action", "recruitment", "discard", "draw"], // phases where an end action is automatically added
	startingDeck: createStartingDeck,
	startingHand: createStartingHand,
	shop: {
		rows: [
			{
				name: "actionRow",
				deck: Array(10).fill("ImpressiveAction"),
				shown: 3
			},
			{
				name: "commanders",
				deck: Array(10).fill("CommanderBernard"),
				shown: 10 // TODO: make special case to show all cards
			}
		],
		piles: [
			{
				name: "civilians",
				cardName: "Civilian",
				amount: 10
			}
		]
	},
	player: {
		counters: [
			{
				name: "armyPower",
				value: 0
			},
			{
				name: "influence",
				value: 0
			},
			{
				name: "tempInfluence",
				value: 0
			},
			{
				name: "recruitmentPoints",
				value: 1
			},
			{
				name: "actionPoints",
				value: 1
			}
		]
	},
	game: {
		makes: [
			{
				phase: "commander",
				func: makeCommanderActions
			},
			{
				phase: "action",
				func: makePlayingActions
			}
			// {
			// 	phase: "action",
			// 	func: makeAbilityActions
			// },
			// {
			// 	phase: "recruitment",
			// 	func: makeCombatActions
			// },
			// {
			// 	phase: "recruitment",
			// 	func: makeBuyActions
			// }
		],
		applications: [
			{
				action: "play",
				func: actionPlay
			},
			{
				action: "choose",
				func: actionChoose
			}
			// {
			// 	action: "ability",
			// 	func: actionAbility
			// },
			// {
			// 	action: "buy",
			// 	func: actionBuy
			// }
		]
	},

	// functions
	drawAmount: drawAmount
};
