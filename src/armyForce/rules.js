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
			(card.types.has("action") && gameState.getPlaying().get("actions") > 0)
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

function makeRecruitmentActions(gameState) {
	let actions = [];
	let influence = gameState.getPlaying().get("influence") + gameState.getPlaying().get("tempInfluence");
	let recruitment = gameState.getPlaying().get("recruitment");
	Object.keys(gameState.shop.piles).forEach(key => {
		let pile = gameState.shop.piles[key];
		if (pile.amount > 0 && cards._costEnum[pile.cardName] <= influence && recruitment > 0) {
			actions.push({ action: "recruit", type: "piles", target: key });
		}
	});
	return actions;
}

function makeBuyActions(gameState) {
	let actions = [];
	let influence = gameState.getPlaying().get("influence");
	let tempInfluence = gameState.getPlaying().get("tempInfluence");
	if (tempInfluence < 0) {
		influence += tempInfluence;
	}
	gameState.shop.rows.actionRow.row.forEach((card, index) => {
		if (cards._costEnum[card] <= influence) {
			actions.push({ action: "buy", type: "rows", target: "actionRow", index });
		}
	});
	return actions;
}

function actionPlay(gameState, action) {
	let card = gameState.getPlaying().play(gameState, action.index);
	if (card.types.has("action")) {
		gameState.getPlaying().updateCounter("actions", -1);
	}
}

function actionChoose(gameState, action) {
	gameState.getPlaying().play(gameState, action.index);
	gameState.getPlaying().hand = [];
}

function actionRecruit(gameState, action) {
	let card = gameState.shop.fromPile(action.target, gameState);
	gameState.getPlaying().toDiscard(card);
	gameState.getPlaying().updateCounter("recruitment", -1);
}

function actionBuy(gameState, action) {
	let card = gameState.shop.fromRow(action.target, action.index, gameState);
	gameState.getPlaying().toDiscard(card);
	gameState.getPlaying().updateCounter("influence", -card.cost);
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
	for (let i = 0; i < 8; i++) {
		deck.push(new cards.Civilian());
	}
	deck.push(new cards.ImpressiveAction());
	deck.push(new cards.InspiringSpeech());
	return deck;
}

function createStartingHand() {
	return [
		new cards.CommanderBernard(),
		new cards.CommanderHopkins(),
		new cards.CommanderHolt(),
		new cards.CommanderReily()
	];
}

function endCondition(gameState) {
	let influenceMet = false;
	let leader = null;
	let leaderArmyPower = 0;
	let secondArmyPower = 0;
	gameState._playerIds.forEach(playerId => {
		if (gameState.players[playerId].get("influence") >= 25) {
			influenceMet = true;
		}
		if (!leader || gameState.players[playerId].get("armyPower") > leaderArmyPower) {
			leader = playerId;
			secondArmyPower = leaderArmyPower;
			leaderArmyPower = gameState.players[playerId].get("armyPower");
		}
	});
	if (influenceMet || (leaderArmyPower >= 50 && leaderArmyPower >= secondArmyPower * 2)) {
		return leader;
	}
	return null;
}

function createActionDeck() {
	let deck = [];
	for (let i = 0; i < 3; i++) {
		deck.push("ImpressiveAction");
		deck.push("InspiringSpeech");
		deck.push("QuickPlay");
		deck.push("Fire");
	}
	for (let i = 0; i < 2; i++) {
		deck.push("DoubleDown");
		deck.push("Prestige");
		deck.push("Raid");
	}
	return deck;
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
	end: {
		turnStart: true,
		roundStart: false,
		func: endCondition
	},
	shop: {
		rows: [
			{
				name: "actionRow",
				deck: createActionDeck(),
				shown: 3
			}
			// {
			// 	name: "commanders",
			// 	deck: Array(10).fill("CommanderBernard"),
			// 	shown: 10 // TODO: make special case to show all cards
			// }
		],
		piles: [
			{
				name: "civilians",
				cardName: "Civilian",
				amount: 10
			},
			{
				name: "soldiers",
				cardName: "Soldier",
				amount: 10
			},
			{
				name: "hitmen",
				cardName: "Hitman",
				amount: 10
			},
			{
				name: "recruiters",
				cardName: "Recruiter",
				amount: 10
			},
			{
				name: "snipers",
				cardName: "Sniper",
				amount: 10
			},
			{
				name: "spies",
				cardName: "Spy",
				amount: 10
			},
			{
				name: "traitors",
				cardName: "Traitor",
				amount: 10
			}
		]
	},
	player: {
		counters: [
			{ name: "armyPower", value: 0 },
			{ name: "influence", value: 0 },
			{ name: "tempInfluence", value: 0, reset: 0 },
			{ name: "recruitment", value: 1, reset: 1 },
			{ name: "actions", value: 1, reset: 1 },
			{ name: "soldier", value: 0 },
			{ name: "traitor", value: 0 }
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
			},
			{
				phase: "recruitment",
				func: makeRecruitmentActions
			},
			{
				phase: "recruitment",
				func: makeBuyActions
			}
		],
		applications: [
			{
				action: "play",
				func: actionPlay
			},
			{
				action: "choose",
				func: actionChoose
			},
			{
				action: "recruit",
				func: actionRecruit
			},
			{
				action: "buy",
				func: actionBuy
			}
		]
	},

	// functions
	drawAmount: drawAmount
};
