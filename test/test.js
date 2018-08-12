const assert = require("assert");
const Player = require("../game/player");

describe("Player", () => {
    const deck = [];
    const player = new Player(deck);
    describe("#createCounter()", () => {
        player.createCounter("test", 1);
        it("should have a counter \"test\" with the value of 1", () => {
            assert.equal(player.counters.test, 1);
        });
    });
});