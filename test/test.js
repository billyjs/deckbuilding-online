const assert = require("chai").assert;
const Player = require("../game/player");

describe("Player", function() {

	const deck = [];
	const player = new Player(deck);

	describe("#createCounter()", function() {
		it("should have a counter \"test\" with the value of 1", function() {
			player.createCounter("test", 1);
			assert.equal(player.counters.test, 1);
		});
	});

	describe("#updateCounter()", function() {
		it("should have a counter \"test\" with the value of 3", function() {
			player.counters.test2 = 0;
			player.updateCounter("test2", 3);
			assert.equal(player.counters.test2, 3);
		});
	});
});