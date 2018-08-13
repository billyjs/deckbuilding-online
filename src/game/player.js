const helper = require("../helper");

module.exports = class Player {
	constructor(deck) {
		this.deck = helper.shuffleCopy(deck);
		this.hand = [];
		this.discard = [];
		this.inPlay = [];
		this.counters = {};
	}

	getState(censored) {
		return {
			deck: this.deck.length,
			hand: censored ? this.hand.length : this.hand.map(card => card.name),
			discard: this.discard.map(card => card.name),
			inPlay: this.inPlay.map(card => card.name),
			counters: this.counters
		};
	}

	/**
	 * Create a counter for the player
	 * @param counter
	 * @param value (Optional default 0)
	 */
	createCounter(counter, value) {
		this.counters[counter] = value ? value : 0;
	}

	updateCounter(counter, value) {
		this.counters[counter] += value;
	}

	setCounter(counter, value) {
		this.counters[counter] = value;
	}

	get(counter) {
		return this.counters[counter];
	}

	play(gameState, index) {
		let card = this.hand[index];
		this.inPlay.forEach(inPlay => {
			inPlay.onOtherPlay(gameState, card);
		});
		this.inPlay.push(...this.hand.splice(index, 1));
		card.onPlay(gameState);
	}

	destroy(gameState, index) {
		let card = this.inPlay[index];
		card.onDestroy(gameState);
		this.discard.push(...this.inPlay.splice(index, 1));
	}

	draw(amount) {
		let cards = this.deck.splice(0, amount);
		this.hand.push(...cards);

		// if couldn't draw all _cards and _cards in discard pile
		// refresh the deck and draw the rest
		if (cards.length < amount && this.discard.length > 0) {
			this.refreshDeck();
			this.draw(amount - cards.length);
		}
	}

	refreshDeck() {
		this.deck = helper.shuffleCopy(this.discard);
		this.discard = [];
	}

	fromInPlay(index) {
		return this.inPlay.splice(index, 1)[0];
	}

	fromHand(index) {
		return this.hand.splice(index, 1)[0];
	}

	from(target, index) {
		if (this[target]) {
			return this[target].splice(index, 1)[0];
		} else {
			return null;
		}
	}

	toDiscard(card) {
		this.discard.push(card);
	}

	toDeck(card) {
		this.deck.unshift(card);
	}
};