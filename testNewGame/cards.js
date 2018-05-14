const Card = require('../game/card');

/**
 * One: ship - target opponent discards a card
 * Two: base - choose 2 trade or 3 combat
 * Three: ship - ally ability 3 combat
 * Four: outpost - ally ability 3 combat
 */

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

const Base = class Base extends Card {
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
};

const Outpost = class Outpost extends Base {
    constructor() {
        super();
        this.types.add("outpost");
    }
};

const One = class One extends Ship {
    constructor() {
        super();
        this.name = "One";
        this.faction = "basic";
        this.cost = 1;
    }
    onPlay(gameState) {
        let choices = gameState._playerIds.filter((player) => {
            return player !== gameState.playing;
        }).map((player) => {
            return {
                name: player,
                value: player
            }
        });
        gameState.addDecision(gameState.playing, choices, (playerId) => {
            let choices = gameState.players[playerId].hand.map((card, index) => {
                return {
                    name: card.name,
                    value: index
                }
            });
            gameState.addDecision(playerId, choices, (index) => {
                let card = gameState.players[playerId].fromHand(index);
                gameState.players[playerId].toDiscard(card);
            });
        });
    }
};

const Two = class Two extends Base {
    constructor() {
        super();
        this.name = "Two";
        this.cost = 2;
        this.defense = 2;
        this.abilities = {
            primary: {
                available: false,
                used: false,
                func: this.primaryAbility
            }
        }
    }
    onPlay(gameState) {
        this.onActivate(gameState, "primary");
    }
    primaryAbility(gameState) {
        gameState.addDecision(gameState.playing, [{name: "2 Trade", value: 0}, {name: "3 Combat", value: 1}], (choice) => {
            switch(choice) {
                case 0:
                    gameState.getPlaying().updateCounter("trade", 2);
                    break;
                case 1:
                    gameState.getPlaying().updateCounter("combat", 3);
                    break;
                default:
                    break;
            }
        });
    }
    resetCounters() {
        this.abilities.primary.available = true;
        this.abilities.primary.used = false;
    }
};

const Three = class Three extends Ship {
    constructor() {
        super();
        this.name = "Three";
        this.cost = 3;
        this.faction = "Ally";
        this.abilities = {
            primary: {
                available: false,
                used:  false,
                func: this.primaryAbility
            },
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        this.onActivate(gameState, "primary");
        this.checkAlly(gameState);
    }
    onOtherPlay(gameState, other)  {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    primaryAbility(gameState) {
        gameState.getPlaying().updateCounter('trade', 2);
    }
    allyAbility(gameState) {
        gameState.getPlaying().updateCounter('combat', 3);
    }
    checkAlly(gameState) {
        gameState.getPlaying().inPlay.forEach((card) => {
            if (this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.primary.available = true;
        this.abilities.primary.used = false;
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
};

const Four = class Four extends Outpost {
    constructor() {
        super();
        this.name = "Four";
        this.cost = 4;
        this.defense = 4;
        this.faction = "Ally";
        this.abilities = {
            primary: {
                available: false,
                used:  false,
                func: this.primaryAbility
            },
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        this.onActivate(gameState, "primary");
        this.checkAlly(gameState);
    }
    onOtherPlay(gameState, other)  {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    primaryAbility(gameState) {
        gameState.getPlaying().updateCounter('trade', 2);
    }
    allyAbility(gameState) {
        gameState.getPlaying().updateCounter('combat', 3);
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.primary.available = true;
        this.abilities.primary.used = false;
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
};



module.exports = {
    _costEnum: {
        One: 1,
        Two: 2,
        Three: 3,
        Four: 4,
    },
    One,
    Two,
    Three,
    Four
};
