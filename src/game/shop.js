const helper = require("../helper");

/** Class representing a shop in which there are rows and piles of cards that can be acquired */
module.exports = class Shop {
	/**
	 * Create a shop
	 * @param {object} cards
	 * @param {object} cards._cardEnum
	 */
	constructor(cards) {
		this.rows = {};
		this.piles = {};
		this._cards = cards;
	}

	/**
	 * Get an instance of a card from a pile
	 * @param {string} pile
	 * @param {object} gameState
	 * @returns {null|object}
	 */
	fromPile(pile, gameState) {
		// check pile exists
		if (!this.piles.hasOwnProperty(pile) || this.piles[pile].amount < 1) {
			return null;
		}

		// reduce amount of cards in the pile
		this.piles[pile].amount--;

		// create an instance of the card
		let card = new this._cards[this.piles[pile].cardName]();

		// run the cards onAcquire()
		card.onAcquire(gameState);

		return card;
	}

	/**
	 * Get an instance of a card from a row
	 * @param {string} row
	 * @param {number} index
	 * @param {object} gameState
	 * @returns {null|object}
	 */
	fromRow(row, index, gameState) {
		// check row exists and index is within the row
		if (!this.rows.hasOwnProperty(row) || index >= this.rows[row].row.length) {
			return null;
		}

		// create an instance of the card
		let card = new this._cards[this.rows[row].row[index]]();

		// replace card being taken
		this.rows[row].row[index] = this.rows[row].deck.shift();

		// run the cards onAcquire()
		card.onAcquire(gameState);

		return card;
	}

	/**
	 * Get the state of the shop, both rows and piles
	 * @returns {{rows: object, piles: object}}
	 */
	getState() {
		return { rows: this.getRowsState(), piles: this.piles };
	}

	/**
	 * Get the state of the rows in the shop and censor the cards in the row decks
	 * @returns {object}
	 */
	getRowsState() {
		let state = {};

		Object.keys(this.rows).forEach(row => {
			// censor the cards in the deck
			let length = this.rows[row].deck.length;

			state[row] = { row: this.rows[row].row, deck: length };
		});

		return state;
	}

	/**
	 * Create a row of cards in the shop, where shop.rows.rowName has properties
	 *  - {[string]} row
	 *  - {[string]} deck
	 * @param {string} rowName
	 * @param {[string]} deck
	 * @param {Number} shown
	 * @param {boolean} shuffle
	 * @returns {boolean}
	 */
	createRow(rowName, deck, shown, shuffle = true) {
		// check rowName doesn't already exist
		if (this.rows.hasOwnProperty(rowName)) {
			return false;
		}

		// check all the cards in the deck exist
		let undefinedCard = function(card) {
			return !this._cards.hasOwnProperty(card);
		};
		if (deck.some(undefinedCard, this)) {
			return false;
		}

		// create a copy of the deck and shuffle if necessary
		let rowDeck = shuffle ? helper.shuffleCopy(deck) : deck.slice();

		// fill the row from the deck
		let row = rowDeck.splice(0, shown);

		// create the row
		this.rows[rowName] = { row: row, deck: rowDeck };
		return true;
	}

	/**
	 * Create a pile of cards in the shop, where shop.piles.pileName has properties
	 *  - {string} cardName
	 *  - {number} amount
	 * @param {string} pileName
	 * @param {string} cardName
	 * @param {number} amount
	 * @returns {boolean}
	 */
	createPile(pileName, cardName, amount) {
		// check pileName doesn't already exist and cardName exists
		if (this.piles.hasOwnProperty(pileName) || !this._cards.hasOwnProperty(cardName)) {
			return false;
		}

		// create the pile
		this.piles[pileName] = { cardName: cardName, amount: amount };
		return true;
	}
};
