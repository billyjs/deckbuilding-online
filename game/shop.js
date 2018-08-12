const helper = require("../helper");

module.exports = class Shop {
	constructor(cards) {
		this.rows = {};
		this.piles = {};
		this._cards = cards;
	}

	fromPile(pile) {
		this.piles[pile].amount--;
		return new this._cards[this.piles[pile].cardName]();
	}

	fromRow(row, index) {
		let card = new this._cards[this.rows[row].row[index]]();
		this.rows[row].row[index] = this.rows[row].deck.shift();
		return card;
	}

	getState() {
		return {
			rows: this.getRowsState(),
			piles: this.piles
		};
	}

	getRowsState() {
		let state = {};
		Object.keys(this.rows).forEach((row) => {
			state[row] = {
				row: this.rows[row].row,
				deck: this.rows[row].deck.length
			};
		});
		return state;
	}

	createRow(name, deck, shown) {
		if (this.rows[name]) {
			Error("duplicate shop row attempted to be created");
		}
		let rowDeck = helper.shuffleCopy(deck);
		this.rows[name] = {
			row: rowDeck.splice(0, (shown) ? shown : 5),
			deck: rowDeck
		};
	}

	createPile(name, cardName, amount) {
		if (this.piles[name]) {
			Error("duplicate shop pile attempted to be created");
		}
		this.piles[name] = {
			cardName: cardName,
			amount: amount
		};
	}

};