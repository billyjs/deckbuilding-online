const cards = require("./cards");

function createStartingDeck() {
	let deck = [];
	for (let i = 0; i < 8; i++) {
		deck.push(new cards.Scout());
		// deck.push(new cards.BlobCarrier());
		// deck.push(new cards.RecyclingStation());
	}
	for (let i = 0; i < 2; i++) {
		deck.push(new cards.Viper());
		// deck.push(new cards.BattlePod());
		// deck.push(new cards.BlobDestroyer());
		// deck.push(new cards.BlobCarrier());
		// deck.push(new cards.BlobWorld());
	}
	return deck;
}

function createTradeDeck() {
	let deck = [];
	// triples
	for (let i = 0; i < 3; i++) {
		deck.push("BlobFighter");
		deck.push("TradePod");
		deck.push("BlobWheel");

		deck.push("ImperialFighter");
		deck.push("ImperialFrigate");
		deck.push("SurveyShip");

		deck.push("FederationShuttle");
		deck.push("Cutter");

		deck.push("TradeBot");
		deck.push("MissileBot");
		deck.push("SupplyBot");
	}
	// doubles
	for (let i = 0; i < 2; i++) {
		deck.push("BattlePod");
		deck.push("Ram");
		deck.push("BlobDestroyer");

		deck.push("Corvette");
		deck.push("SpaceStation");
		deck.push("RecyclingStation");

		deck.push("EmbassyYacht");
		deck.push("Freighter");
		deck.push("TradingPost");
		deck.push("BarterWorld");

		deck.push("PatrolMech");
		deck.push("BattleStation");
	}
	// singles
	deck.push("BattleBlob");
	deck.push("BlobCarrier");
	deck.push("Mothership");
	deck.push("TheHive");
	deck.push("BlobWorld");

	deck.push("Battlecruiser");
	deck.push("Dreadnaught");
	deck.push("WarWorld");
	deck.push("RoyalRedoubt");
	deck.push("FleetHQ");

	deck.push("TradeEscort");
	deck.push("Flagship");
	deck.push("CommandShip");
	deck.push("DefenseCenter");
	deck.push("PortOfCall");
	deck.push("CentralOffice");

	deck.push("StealthNeedle");
	deck.push("BattleMech");
	deck.push("MissileMech");
	deck.push("MechWorld");
	deck.push("Junkyard");
	deck.push("MachineBase");
	deck.push("BrainWorld");
	return deck;
}

// function createTradeDeck() {
//     //test function TODO: remove this
//     return Array(20).fill("Battlecruiser");
// }

function makePlayingActions(gameState) {
	let actions = [];
	gameState.getPlaying().hand.forEach((card, index) => {
		actions.push({
			action: "play",
			target: "hand",
			type: "player",
			card: card.name,
			index: index
		});
	});
	return actions;
}

function makeAbilityActions(gameState) {
	let actions = [];
	gameState.getPlaying().inPlay.forEach((card, index) => {
		card.availableAbilities().forEach(ability => {
			actions.push({
				action: "ability",
				ability: ability,
				type: "player",
				target: "inplay",
				card: card.name,
				index: index
			});
		});
	});
	return actions;
}

function makeCombatActions(gameState) {
	// TODO: is not correct
	let actions = [];
	let combat = gameState.getPlaying().get("combat");
	gameState._playerIds
		.filter(playerId => {
			return playerId !== gameState.playing;
		})
		.forEach(playerId => {
			let bases = [];
			let outposts = [];
			let outpost = false;
			gameState.players[playerId].inPlay.forEach((card, index) => {
				if (card.types.has("outpost")) {
					outpost = true;
				}
				if (card.defense <= combat) {
					if (card.types.has("outpost")) {
						outposts.push({ card, index });
					} else {
						bases.push({ card, index });
					}
				}
			});
			outposts.forEach(outpost => {
				actions.push({
					action: "combat",
					type: "opponent",
					target: "inplay",
					player: playerId,
					damage: outpost.card.defense,
					card: outpost.card.name,
					index: outpost.index
				});
			});
			if (!outpost) {
				bases.forEach(base => {
					actions.push({
						action: "combat",
						type: "opponent",
						target: "inplay",
						player: playerId,
						damage: base.card.defense,
						card: base.card.name,
						index: base.index
					});
				});
				if (combat > 0) {
					actions.push({
						action: "combat",
						type: "opponent",
						target: "deck",
						player: playerId,
						damage: combat
					});
				}
			}
		});
	return actions;
}

function makeBuyActions(gameState) {
	let actions = [];
	let trade = gameState.getPlaying().get("trade");
	let topDeck = gameState.getPlaying().get("buyTopDeck");
	// piles
	Object.keys(gameState.shop.piles).forEach(key => {
		let pile = gameState.shop.piles[key];
		if (pile.amount > 0 && cards._costEnum[pile.cardName] <= trade) {
			if (cards[pile.cardName].getType() !== "ship" || topDeck === 0) {
				actions.push({ action: "buy", type: "piles", target: key });
			} else if (topDeck === 1) {
				actions.push({ action: "buy", type: "piles", target: key });
				actions.push({ action: "buyTopDeck", type: "piles", target: key });
			} else if (topDeck === 2) {
				actions.push({ action: "buyTopDeck", type: "piles", target: key });
			}
		}
	});
	//rows
	Object.keys(gameState.shop.rows).forEach(key => {
		let row = gameState.shop.rows[key];
		row.row.forEach((card, index) => {
			if (card && cards._costEnum[row.row[index]] <= trade) {
				if (cards[card].getType() !== "ship" || topDeck === 0) {
					actions.push({
						action: "buy",
						type: "rows",
						target: key,
						index: index
					});
				} else if (topDeck === 1) {
					actions.push({
						action: "buy",
						type: "rows",
						target: key,
						index: index
					});
					actions.push({
						action: "buyTopDeck",
						type: "rows",
						target: key,
						index: index
					});
				} else if (topDeck === 2) {
					actions.push({
						action: "buyTopDeck",
						type: "rows",
						target: key,
						index: index
					});
				}
			}
		});
	});
	return actions;
}

function drawAmount(turn, playerIndex) {
	if (turn === 0 && playerIndex === 0) {
		return 3;
	} else {
		return 5;
	}
}

function actionPlay(gameState, action) {
	gameState.getPlaying().play(gameState, action.index);
	return "played " + action.card;
}

function actionAbility(gameState, action) {
	gameState.getPlaying().inPlay[action.index].onActivate(gameState, action);
}

function actionCombat(gameState, action) {
	switch (action.target) {
		case "deck":
			gameState.players[action.player].updateCounter("authority", -action.damage);
			gameState.getPlaying().updateCounter("combat", -action.damage);
			break;
		case "inplay":
			gameState.players[action.player].destroy(gameState, action.index);
			gameState.getPlaying().updateCounter("combat", -action.damage);
			break;
		default:
			break;
	}
}

function actionBuy(gameState, action) {
	let card = null;
	if (action.type === "piles") {
		card = gameState.shop.fromPile(action.target);
		gameState.getPlaying().toDiscard(card);
		gameState.getPlaying().updateCounter("trade", -card.cost);
	} else if (action.type === "rows") {
		card = gameState.shop.fromRow(action.target, action.index);
		gameState.getPlaying().toDiscard(card);
		gameState.getPlaying().updateCounter("trade", -card.cost);
	}
	if (card && card.types.has("ship")) {
		gameState.getPlaying().setCounter("buyTopDeck", 0);
	}
}

function actionBuyTopDeck(gameState, action) {
	let card = null;
	if (action.type === "piles") {
		card = gameState.shop.fromPile(action.target);
		gameState.getPlaying().toDeck(card);
		gameState.getPlaying().updateCounter("trade", -card.cost);
	} else if (action.type === "rows") {
		card = gameState.shop.fromRow(action.target, action.index);
		gameState.getPlaying().toDeck(card);
		gameState.getPlaying().updateCounter("trade", -card.cost);
	}
	if (card && card.types.has("ship")) {
		gameState.getPlaying().setCounter("buyTopDeck", 0);
	}
}

module.exports = {
	cards: cards,
	players: {
		min: 2,
		max: 2
	},
	phases: ["play", "discard", "draw"],
	startingDeck: createStartingDeck,
	shop: {
		rows: [
			{
				name: "tradeRow",
				deck: createTradeDeck(),
				shown: 5
			}
		],
		piles: [
			{
				name: "explorers",
				cardName: "Explorer",
				amount: 10
			}
		]
	},
	player: {
		counters: [
			{
				name: "trade",
				value: 0
			},
			{
				name: "combat",
				value: 0
			},
			{
				name: "authority",
				value: 50
			},
			{
				name: "blobs",
				value: 0
			},
			{
				name: "buyTopDeck",
				value: 0
			}
		]
	},
	game: {
		makes: [
			{
				phase: "play",
				func: makePlayingActions
			},
			{
				phase: "play",
				func: makeAbilityActions
			},
			{
				phase: "play",
				func: makeCombatActions
			},
			{
				phase: "play",
				func: makeBuyActions
			}
		],
		applications: [
			{
				action: "play",
				func: actionPlay
			},
			{
				action: "ability",
				func: actionAbility
			},
			{
				action: "combat",
				func: actionCombat
			},
			{
				action: "buy",
				func: actionBuy
			},
			{
				action: "buyTopDeck",
				func: actionBuyTopDeck
			}
		]
	},

	// functions
	drawAmount: drawAmount
};
