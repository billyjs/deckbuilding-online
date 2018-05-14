const Card = require('../game/card');

class Ship extends Card {
    constructor() {
        super(null);
        this.types.add("ship");
    }

    onPhaseStart(gameState, location, index) {
        switch(gameState.phase) {
            case "play":
                this.checkAlly(gameState, index);
                break;
            case "discard":
                if (['hand', 'inPlay'].indexOf(location) !== -1) {
                    gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
                    gameState.getPlaying()[location][index] = null;
                }
                this.resetCounters();
                break;
            default:
                break;
        }
    }

    checkAlly(gameState, index) {}
    resetCounters() {}
    onOtherPlay(gameState, other) {}
}

class Base extends Card {
    constructor() {
        super(null);
        this.defense = 0;
        this.types.add("base");
    }

    onPhaseStart(gameState, location, index) {
        switch(gameState.phase) {
            case "play":
                this.checkAlly(gameState, index);
                break;
            case "discard":
                if (['hand'].indexOf(location) !== -1) {
                    gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
                    gameState.getPlaying()[location][index] = null;
                }
                this.resetCounters();
                break;
            default:
                break;
        }
    }

    checkAlly(gameState, index) {}
    resetCounters() {}
    onOtherPlay(gameState, other) {}
    onDestroy(gameState) {}
}

class Outpost extends Base {
    constructor() {
        super();
        this.types.add("outpost");
    }
}

module.exports = {
    Ship,
    Base,
    Outpost
 };