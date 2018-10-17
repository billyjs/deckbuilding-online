const expect = require("chai").expect;
const sinon = require("sinon");
const Shop = require("../../src/game/shop");
const Card = require("../../src/game/card");
const helper = require("../../src/helper");

let Card1 = class Card1 extends Card {
	constructor() {
		super();
	}
	onAcquire(gameState) {}
};
let Card2 = class Card2 extends Card {
	constructor() {
		super();
	}
	onAcquire(gameState) {}
};

describe("Shop", function() {
	let shop;
	let cards = { Card1, Card2 };
	let deck = ["Card1", "Card1", "Card2"];

	beforeEach(function() {
		shop = new Shop(cards);
	});

	describe("#createPile()", function() {
		beforeEach(function() {
			shop = new Shop(cards);
		});

		it("should add a pile to the shop", function() {
			let created = shop.createPile("testPile", "Card1", 3);
			expect(created).to.be.true;
			expect(shop.piles).to.eql({ testPile: { cardName: "Card1", amount: 3 } });
		});
		it("should not add a pile of unknown cards", function() {
			let created = shop.createPile("testPile", "unknown", 3);
			expect(created).to.be.false;
			expect(shop.piles).to.be.an("object").and.empty;
		});
		it("should not overwrite an existing pile", function() {
			shop.createPile("testPile", "Card1", 3);
			let created = shop.createPile("testPile", "Card2", 4);
			expect(created).to.be.false;
			expect(shop.piles).to.eql({ testPile: { cardName: "Card1", amount: 3 } });
		});
	});

	describe("#createRow()", function() {
		beforeEach(function() {
			shop = new Shop(cards);
		});

		it("should add a row to the shop", function() {
			let created = shop.createRow("testRow", deck, [], 1, false);
			expect(created).to.be.true;
			expect(shop.rows).to.eql({
				testRow: { row: ["Card1"], deck: ["Card1", "Card2"], discard: [] }
			});
		});
		it("should not add a an unknown card", function() {
			let created = shop.createRow("testRow", ["unknown"], [], 1, false);
			expect(created).to.be.false;
			expect(shop.rows).to.be.an("object").and.empty;
		});
		it("should not overwrite an existing row", function() {
			shop.createRow("testRow", deck, [], 1, false);
			let created = shop.createRow("testRow", deck, [], 1, false);
			expect(created).to.be.false;
			expect(shop.rows).to.eql({
				testRow: { row: ["Card1"], deck: ["Card1", "Card2"], discard: [] }
			});
		});
		it("should shuffle the cards", function() {
			let stub = sinon.stub(Math, "random").returns(0.5);
			shop.createRow("testRow", deck, [], 0);
			let shuffled = helper.shuffleCopy(deck);
			stub.restore();
			expect(shop.rows.testRow.deck).to.eql(shuffled);
		});
		it("should not modify deck", function() {
			shop.createRow("testRow", deck, [], 1, false);
			shop.createRow("testRow2", deck, [], 2);
			expect(deck).to.eql(["Card1", "Card1", "Card2"]);
		});
	});

	describe("#getRowsState()", function() {
		beforeEach(function() {
			shop = new Shop(cards);
		});

		it("should have empty state when no rows are created", function() {
			let state = shop.getRowsState();
			expect(state).to.be.an("object").and.empty;
		});
		it("should have censored the row deck cards", function() {
			shop.createRow("testRow", deck, [], 1, false);
			let state = shop.getRowsState();
			expect(state).to.eql({ testRow: { row: ["Card1"], deck: 2 } });
		});
	});

	describe("#getState()", function() {
		beforeEach(function() {
			shop = new Shop(cards);
		});

		it("should have empty rows and piles when no rows or piles are created", function() {
			let state = shop.getState();
			expect(state).to.eql({ rows: {}, piles: {} });
		});
		it("should have a row and a pile in the state after they are created", function() {
			shop.createRow("testRow", deck, [], 1, false);
			shop.createPile("testPile", "Card1", 3);
			let state = shop.getState();
			expect(state).to.eql({
				rows: { testRow: { row: ["Card1"], deck: 2 } },
				piles: { testPile: { cardName: "Card1", amount: 3 } }
			});
		});
	});

	describe("#fromRow()", function() {
		beforeEach(function() {
			shop = new Shop(cards);
		});

		it("should return null when trying to get from unknown row", function() {
			let card = shop.fromRow("unknown", 0, null);
			expect(card).is.null;
		});
		it("should return null when trying to get from index larger than row length", function() {
			shop.createRow("testRow", deck, [], 1, false);
			let card = shop.fromRow("testRow", 1, null);
			expect(card).is.null;
		});
		it("should return a card instance", function() {
			shop.createRow("testRow", deck, [], 1, false);
			let card = shop.fromRow("testRow", 0, null);
			expect(card).is.an.instanceOf(Card1);
		});
		it("should run the cards onAcquire()", function() {
			let spy = sinon.spy();
			const Card3 = class Card3 extends Card {
				constructor() {
					super();
				}
				onAcquire() {
					spy();
				}
			};
			shop = new Shop({ ...cards, Card3 });
			shop.createRow("testRow", ["Card3", ...deck], [], 1, false);
			shop.fromRow("testRow", 0, null);
			expect(spy.calledOnce).is.true;
		});
	});

	describe("#fromPile()", function() {
		beforeEach(function() {
			shop = new Shop(cards);
		});

		it("should return null when trying to get from unknown pile", function() {
			let card = shop.fromPile("unknown", null);
			expect(card).is.null;
		});
		it("should return null when trying to get from an empty pile", function() {
			shop.createPile("testRow", "Card1", 0);
			let card = shop.fromPile("testPile", null);
			expect(card).is.null;
		});
		it("should return a card instance", function() {
			shop.createPile("testPile", "Card1", 3);
			let card = shop.fromPile("testPile", null);
			expect(card).is.an.instanceOf(Card1);
		});
		it("should run the cards onAcquire()", function() {
			let spy = sinon.spy();
			const Card3 = class Card3 extends Card {
				constructor() {
					super();
				}
				onAcquire() {
					spy();
				}
			};
			shop = new Shop({ Card3 });
			shop.createPile("testPile", "Card3", 3);
			shop.fromPile("testPile", null);
			expect(spy.calledOnce).is.true;
		});
	});
});
