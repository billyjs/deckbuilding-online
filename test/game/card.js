const expect = require("chai").expect;
const Card = require("../../src/game/card");

describe("Card", function() {
	let card;
	let func = function() {};

	beforeEach(function() {
		card = new Card();
	});

	describe("#isAvailable()", function() {
		it("unknown ability should not be available", function() {
			let available = card.isAvailable("unknown");
			expect(available).to.be.false;
		});
		it("ability with no function should not be available", function() {
			card.abilities.test = { available: true, used: false };
			let available = card.isAvailable("test");
			expect(available).to.be.false;
		});
		it("unavailable ability should not be available", function() {
			card.abilities.test = { available: false, used: false };
			let available = card.isAvailable("test");
			expect(available).to.be.false;
		});
		it("used ability should not be available", function() {
			card.abilities.test = { available: true, used: true };
			let available = card.isAvailable("test");
			expect(available).to.be.false;
		});
		it("ability should be available", function() {
			let func = function() {};
			card.abilities.test = { available: true, used: false, func };
			let available = card.isAvailable("test");
			expect(available).to.be.true;
		});
	});

	describe("#availableAbilities()", function() {
		it("base card should have no abilities", function() {
			let abilities = card.availableAbilities();
			expect(abilities).to.be.an("array").that.is.empty;
		});
		it("should have an available ability", function() {
			card.addAbility("test", func);
			let abilities = card.availableAbilities();
			expect(abilities)
				.to.be.an("array")
				.that.has.length(1)
				.and.contains("test");
		});
		it("should have an available ability and unavailable abilities", function() {
			card.addAbility("test", func);
			card.addAbility("test2", func, false);
			let abilities = card.availableAbilities();
			expect(abilities)
				.to.be.an("array")
				.that.has.length(1)
				.and.contains("test");
		});
		it("should have multiple available abilities", function() {
			card.addAbility("test", func);
			card.addAbility("test2", func);
			let abilities = card.availableAbilities();
			expect(abilities)
				.to.be.an("array")
				.that.has.length(2)
				.and.contains("test")
				.and.contains("test2");
		});
	});

	describe("#addAbility()", function() {
		it("should add an available ability", function() {
			let added = card.addAbility("test", func);
			let available = card.isAvailable("test");
			expect(added).to.be.true;
			expect(available).to.be.true;
		});
		it("should not overwrite an ability", function() {
			let firstFunc = function() {
				return 1;
			};
			let secondFunc = function() {
				return 2;
			};
			card.addAbility("test", firstFunc);
			let added = card.addAbility("test", secondFunc);
			let result = card.abilities.test.func();
			expect(result).to.equal(1);
			expect(added).to.be.false;
		});
		it("should not add invalid functions", function() {
			let func = "invalid";
			let added = card.addAbility("test", func);
			expect(added).to.be.false;
		});
	});

	describe("#onActivate()", function() {
		it("should make the ability used after activation", function() {
			let action = { ability: "test" };
			card.addAbility("test", func);
			let firstActivation = card.onActivate({}, action);
			let secondActivation = card.onActivate({}, action);
			expect(firstActivation).to.be.true;
			expect(secondActivation).to.be.false;
		});
		it("should run the ability's function on activation", function() {
			let seen = false;
			let action = { ability: "test" };
			let func = function() {
				seen = true;
			};
			card.addAbility("test", func);
			card.onActivate({}, action);
			expect(seen).to.be.true;
		});
	});

	describe("abstracts", function() {
		it("onPlay() should throw an error", function() {
			expect(card.onPlay).to.throw("onPlay");
		});
		it("onOtherPlay() should throw an error", function() {
			expect(card.onOtherPlay).to.throw("onOtherPlay");
		});
		it("onPhaseStart() should throw an error", function() {
			expect(card.onPhaseStart).to.throw("onPhaseStart");
		});
		it("onAcquire() should throw an error", function() {
			expect(card.onAcquire).to.throw("onAcquire");
		});
		it("onDestroy() should throw an error", function() {
			expect(card.onDestroy).to.throw("onDestroy");
		});
	});
});
