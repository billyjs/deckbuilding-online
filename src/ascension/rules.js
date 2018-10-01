const cards = require("./cards");

function createStartingDeck() {
	let deck = [];
	for (let i = 0; i < 8; i++) {
		deck.push(new cards.Apprentice());
	}
	for (let i = 0; i < 2; i++) {
		deck.push(new cards.Militia());
	}
	return deck;
}

function createCentreRow() {
	let deck = [];
	for (let i = 0; i < 10; i++) {
		deck.push("StarvedAbomination");
		deck.push("CheerfulConsort");
	}
	return deck;
}

function endCondition(gameState) {
	let honour = gameState._playerIds.reduce((total, playerId) => {
		return total + gameState.players[playerId].get("honour");
	}, 0);
	let players = 2; // TODO: dynamically set player count
	if (honour >= players * 30) {
		// TODO: add honour from cards
		return gameState._playerIds.reduce((max, playerId) => {
			return gameState.players[max] > gameState.players[playerId] ? max : playerId;
		});
	}
	return null;
}

function drawAmount() {
	return 5;
}

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

function actionPlay(gameState, action) {
	gameState.getPlaying().play(gameState, action.index);
	return "played " + action.card;
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

function actionAbility(gameState, action) {
	gameState.getPlaying().inPlay[action.index].onActivate(gameState, action);
}

function makeTempleActions(gameState) {
	let actions = [];
	let playing = gameState.getPlaying();
	let lifeTemple = findTemple(gameState, "templeOfLife");
	if (playing.get("life") >= 1 && lifeTemple.type !== "player") {
		actions.push({
			action: "temple",
			type: lifeTemple.type,
			target: lifeTemple.target,
			card: "templeOfLife",
			index: lifeTemple.index,
			player: lifeTemple.player
		});
	}
	let deathTemple = findTemple(gameState, "templeOfDeath");
	if (playing.get("death") >= 1 && deathTemple.type !== "player") {
		actions.push({
			action: "temple",
			type: deathTemple.type,
			target: deathTemple.target,
			card: "templeOfDeath",
			index: deathTemple.index,
			player: deathTemple.player
		});
	}
	return actions;
}

function findTemple(gameState, name) {
	let type = null;
	let target = null;
	let index = undefined;
	let p = null;
	if (gameState.shop.piles[name].amount === 1) {
		type = "piles";
		target = name;
	} else {
		gameState._playerIds.forEach(playerId => {
			let player = gameState.players[playerId];
			let i = player.inPlay.map(card => card.name.toLowerCase()).indexOf(name.toLowerCase());
			if (i !== -1) {
				type = playerId;
				target = "inplay";
				index = i;
				p = playerId;
			}
		});
		if (type) {
			type = type === gameState.playing ? "player" : "opponent";
		}
	}
	return {
		type,
		target,
		index,
		player: p
	};
}

function actionTemple(gameState, action) {
	if (action.card === "templeOfLife") {
		gameState.getPlaying().updateCounter("life", -1);
	} else if (action.card === "templeOfDeath") {
		gameState.getPlaying().updateCounter("death", -1);
	}
	if (action.type === "piles") {
		// remove temple from the middle and add to player
		let temple = gameState.shop.fromPile(action.card, gameState);
		gameState.getPlaying().playCard(gameState, temple);
	} else {
		// remove temple from other player and add to player
		let temple = gameState.players[action.player].inPlay.splice(action.index, 1)[0];
		gameState.getPlaying().playCard(gameState, temple);
	}
}

function makeBuyActions(gameState) {
	let actions = [];
	let runes = gameState.getPlaying().get("runes");
	// piles
	Object.keys(gameState.shop.piles).forEach(key => {
		let pile = gameState.shop.piles[key];
		if (cards[pile.cardName].getType() === "hero" && pile.amount > 0 && cards._costEnum[pile.cardName] <= runes) {
			actions.push({ action: "buy", type: "piles", target: key });
		}
	});
	// rows
	Object.keys(gameState.shop.rows).forEach(key => {
		let row = gameState.shop.rows[key];
		row.row.forEach((card, index) => {
			if (cards[row.row[index]].getType() !== "monster" && card && cards._costEnum[row.row[index]] <= runes) {
				actions.push({ action: "buy", type: "rows", target: key, index });
			}
		});
	});
	return actions;
}

function actionBuy(gameState, action) {
	let card = null;
	if (action.type === "piles") {
		card = gameState.shop.fromPile(action.target, gameState);
		gameState.getPlaying().toDiscard(card);
		gameState.getPlaying().updateCounter("runes", -card.cost);
	} else if (action.type === "rows") {
		card = gameState.shop.fromRow(action.target, action.index, gameState);
		gameState.getPlaying().toDiscard(card);
		gameState.getPlaying().updateCounter("runes", -card.cost);
	}
}

function makeAttackActions(gameState) {
	let actions = [];
	let power = gameState.getPlaying().get("power");
	let pile = gameState.shop.piles.cultist;
	if (pile.amount > 0 && cards._costEnum[pile.cardName] <= power) {
		actions.push({ action: "attack", type: "piles", target: "cultist", ability: "reward" });
	}
	Object.keys(gameState.shop.rows).forEach(key => {
		let row = gameState.shop.rows[key];
		row.row.forEach((card, index) => {
			if (cards[pile.cardName].getType() === "monster" && card && cards._costEnum[row.row[index]] <= power) {
				actions.push({ action: "attack", type: "rows", target: key, index, ability: "reward" });
			}
		});
	});
	return actions;
}

function actionAttack(gameState, action) {
	if (action.type === "piles") {
		let card = gameState.shop.fromPile(action.target, gameState);
		gameState.shop.piles[action.target].amount++;
		card.onActivate(gameState, action);
		gameState.getPlaying().updateCounter("power", -card.cost);
	} else {
		let card = gameState.shop.fromRow(action.target, action.index, gameState);
		card.onActivate(gameState, action);
		gameState.getPlaying().updateCounter("power", -card.cost);
	}
}

module.exports = {
	cards: cards,
	players: {
		min: 2,
		max: 2 // TODO: allow 4 players
	},
	phases: ["play", "discard", "draw"],
	endPhases: ["play", "discard", "draw"],
	startingDeck: createStartingDeck,
	startingHand: () => [],
	end: {
		turnStart: true,
		roundStart: false,
		func: endCondition
	},
	shop: {
		rows: [
			{
				name: "centreRow",
				deck: createCentreRow(),
				shown: 6
			}
		],
		piles: [
			{
				name: "heavyInfantries",
				cardName: "HeavyInfantry",
				amount: 20
			},
			{
				name: "mystics",
				cardName: "Mystic",
				amount: 20
			},
			{
				name: "cultist",
				cardName: "Cultist",
				amount: 1
			},
			{
				name: "templeOfLife",
				cardName: "TempleOfLife",
				amount: 1
			},
			{
				name: "templeOfDeath",
				cardName: "TempleOfDeath",
				amount: 1
			},
			{
				name: "templeOfImmortality",
				cardName: "TempleOfImmortality",
				amount: 1
			}
		]
	},
	player: {
		counters: [
			{ name: "runes", value: 0, reset: 0 },
			{ name: "power", value: 0, reset: 0 },
			{ name: "honour", value: 0 },
			{ name: "death", value: 0, reset: 0 },
			{ name: "life", value: 0, reset: 0 }
		]
	},
	game: {
		makes: [
			{ phase: "play", func: makePlayingActions },
			{ phase: "play", func: makeAbilityActions },
			{ phase: "play", func: makeTempleActions },
			{ phase: "play", func: makeBuyActions },
			{ phase: "play", func: makeAttackActions }
		],
		applications: [
			{ action: "play", func: actionPlay },
			{ action: "ability", func: actionAbility },
			{ action: "temple", func: actionTemple },
			{ action: "buy", func: actionBuy },
			{ action: "attack", func: actionAttack }
		]
	},
	drawAmount: drawAmount
};
