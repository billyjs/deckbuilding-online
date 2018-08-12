const Card = require('../game/card');

function isAlly(card, other) {
    // card is allied with other if they are of the same faction, the other cards is "MechWorld" or if the card is
    // a in the Machine Cult faction and the other card is "StealthNeedle"
    return (card.faction === other.faction) ||
        (other.name === "MechWorld") ||
        (card.faction === "machineCult" && other.types.has("StealthNeedle"));
}

class Ship extends Card {
    constructor() {
        super(null);
        this.types.add("ship");
    }

    onPlay(gameState) {
        if (this.faction === "blob") {
            gameState.getPlaying().updateCounter("blobs", 1);
        }
        if (this.abilities.primary) {
            this.onActivate(gameState, { ability: "primary" });
        }
        this.checkAlly(gameState, gameState.getPlaying().inPlay.length - 1);
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

    checkAlly(gameState, index) {
        if (this.abilities.ally) {
            gameState.getPlaying().inPlay.forEach((card, i) => {
                if (index !== i && isAlly(this, card)) {
                    this.abilities.ally.available = true;
                }
            });
        }
    }
    resetCounters() {
        if (this.abilities.ally) {
            this.abilities.ally.available = false;
            this.abilities.ally.used = false;
        }
        if (this.abilities.primary) {
            this.abilities.primary.available = true;
            this.abilities.primary.used = false;
        }
        if (this.abilities.scrap) {
            this.abilities.scrap.available = true;
            this.abilities.scrap.used = false;
        }
    }
    onOtherPlay(gameState, other)  {
        if (this.abilities.ally && isAlly(this, other)) {
            this.abilities.ally.available = true;
        }
    }

    static getType() {
        return "ship";
    }
}

class Base extends Card {
    constructor() {
        super(null);
        this.defense = 0;
        this.types.add("base");
    }

    onPlay(gameState) {
        if (this.faction === "blob") {
            gameState.getPlaying().updateCounter("blobs", 1);
        }
        this.checkAlly(gameState, gameState.getPlaying().inPlay.length - 1);
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

    checkAlly(gameState, index) {
        if (this.abilities.ally) {
            gameState.getPlaying().inPlay.forEach((card, i) => {
                if (index !== i && this.faction === card.faction) {
                    this.abilities.ally.available = true;
                }
            });
        }
    }
    resetCounters() {
        if (this.abilities.ally) {
            this.abilities.ally.available = false;
            this.abilities.ally.used = false;
        }
        if (this.abilities.primary) {
            this.abilities.primary.available = true;
            this.abilities.primary.used = false;
        }
        if (this.abilities.scrap) {
            this.abilities.scrap.available = true;
            this.abilities.scrap.used = false;
        }
    }
    onOtherPlay(gameState, other)  {
        if (this.abilities.ally && this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    onDestroy(gameState) {}

    static getType() {
        return "base";
    }
}

class Outpost extends Base {
    constructor() {
        super();
        this.types.add("outpost");
    }

    static getType() {
        return "outpost";
    }
}

module.exports = {
    Ship,
    Base,
    Outpost
 };