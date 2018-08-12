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
        it("should have a counter \"test\" with the value of 4, (1 + 3)", function() {
            player.updateCounter("test", 3);
            assert.equal(player.counters.test, 4);
        });
    });
});