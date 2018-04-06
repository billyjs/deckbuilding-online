const Card = require('../game/card');
const events = require('./events');

const Test = class Test extends Card  {
    constructor(player) {
        super(player);
        this.types.add('test');
        this.name = "Test";
    }

    onPlay(gameState) {
        events.updateCounter(gameState, this.player, 'points', this.value);
    }

    onPhaseStart(gameState, location, index) {
        // console.log(gameState.phase + " " + location + " " + index);
        switch(gameState.phase) {
            case "discard":
                // if the person playing owns this card and it is in hand for in play discard it
                if (gameState.playing === this.player && ['hand', 'inPlay'].indexOf(location) !== -1) {
                    gameState.players[this.player].discard.push(gameState.players[this.player][location][index]);
                    gameState.players[this.player][location][index] = null;
                }
                break;
            default:
                break;
        }
    }
};

const Ship = class Ship extends Card {
    constructor(player) {
        super(player);
        this.name = "Ship";
        this.types.add("ship");
    }
};

const Base = class Base extends Card {
    constructor(player) {
        super(player);
        this.name = "Base";
        this.types.add("base");
    }
};

const Outpost = class Outpost extends Base {
    constructor(player) {
        super(player);
        this.name = "Outpost";
        this.types.add("outpost");
    }
};

module.exports = {
    One: class One extends Test {
        constructor(player) {
            super(player);
            this.value = 1;
            this.name = "One";
        }
    },
    Two: class Two extends Test {
        constructor(player) {
            super(player);
            this.value = 2;
            this.name = "Two";
        }
    },
    Three: class Three extends Test {
        constructor(player) {
            super(player);
            this.value = 3;
            this.name = "Three";
        }
        onPhaseStart(gameState, location, index) {
            // console.log(gameState.phase + " " + location + " " + index);
            switch(gameState.phase) {
                case "discard":
                    // if the person playing owns this card and it is in hand for in play discard it
                    if (gameState.playing === this.player && ['inPlay'].indexOf(location) !== -1) {
                        gameState.players[this.player].discard.push(gameState.players[this.player][location][index]);
                        gameState.players[this.player][location][index] = null;
                    }
                    break;
                default:
                    break;
            }
        }
    },
};