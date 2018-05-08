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
    onPhaseStart(gameState, location, index) {
        switch(gameState.phase) {
            case "discard":
                // if the person playing owns this card and it is in hand or in play discard it
                if (gameState.playing === this.player && ['hand', 'inPlay'].indexOf(location) !== -1) {
                    gameState.players[this.player].discard.push(gameState.players[this.player][location][index]);
                    gameState.players[this.player][location][index] = null;
                }
                break;
            default:
                break;
        }
    }
    onOtherPlay(gameState, index) {

    }
};

const Base = class Base extends Card {
    constructor(player) {
        super(player);
        this.name = "Base";
        this.types.add("base");
    }
    onPhaseStart(gameState, location, index) {
        switch(gameState.phase) {
            case "play":
                this._checkAlly(gameState, index);
                break;
            case "discard":
                // if the person playing owns this card and it is in hand discard it
                if (gameState.playing === this.player && ['hand'].indexOf(location) !== -1) {
                    gameState.players[this.player].discard.push(gameState.players[this.player][location][index]);
                    gameState.players[this.player][location][index] = null;
                }
                this._resetCounters();
                break;
            default:
                break;
        }
    }
    _resetCounters() {
        throw new Error();
    }
    _checkAlly(gameState) {
        throw new Error();
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
    One: class One extends Ship {
        constructor(player) {
            super(player);
            this.value = 1;
            this.name = "One";
            this.faction = "none";
        }
        onPlay(gameState) {
            let players = Object.keys(gameState.players);
            let choices = players.filter((player) => {
                return player !== this.player;
            }).map((player) => {
                return {
                    name: player,
                    value: player
                }
            });
            events.addDecision(gameState, this.player, choices, (choice) => {
                let cs = gameState.players[choice].hand.map((card, index) => {
                    return {
                        name: card.name,
                        value: index
                    }
                });
                events.addDecision(gameState, choice, cs, (c) => {
                    events.discardHand(gameState, choice, c);
                });
            });
        }
    },
    Two: class Two extends Ship {
        constructor(player) {
            super(player);
            this.value = 2;
            this.name = "Two";
            this.faction = "none";
        }
        onPlay(gameState) {
            events.addDecision(gameState, this.player, [{name: "2 Trade", value: 0}, {name: "3 Combat", value: 1}], (choice) => {
                switch(choice) {
                    case 0:
                        events.updateCounter(gameState, this.player, 'trade', 2);
                        break;
                    case 1:
                        events.updateCounter(gameState, this.player, 'combat', 3);
                        break;
                    default:
                        console.log("Invalid Choice");
                }
            });
        }
    },
    Three: class Three extends Outpost {
        constructor(player) {
            super(player);
            this.value = 3;
            this.name = "Three";
            this.defense = 3;
            this.faction = "red";

            this.primary = true;
            this.ally = true;

            this.allyAvailable = false;
        }
        onPlay(gameState) {
            this._primaryAbility(gameState);
            this._checkAlly(gameState, null);
        }

        onActivate(gameState, ability) {
            switch(ability) {
                case "primary":
                    this._primaryAbility(gameState);
                    break;
                case "ally":
                    this._allyAbility(gameState);
                    break;
                default:
                    break;
            }
        }

        onDestroyed(gameState) {
            // do nothing
        }

        _primaryAbility(gameState) {
            if (this.primary) {
                events.updateCounter(gameState, this.player, 'trade', this.value);
                this.primary = false;
            }
        }

        _allyAbility(gameState) {
            if (this.ally) {
                events.updateCounter(gameState, this.player, 'combat', this.value);
                this.ally = false;
            }
        }

        _resetCounters() {
            this.primary = true;
            this.ally = true;
            this.allyAvailable = false;
            this.combat = 0;
        }

        availableAbilities() {
            let abilities = [];
            if (this.primary) {
                abilities.push("primary");
            }
            if (this.allyAvailable && this.ally) {
                abilities.push("ally");
            }
            return abilities;
        }

        _checkAlly(gameState, index) {
            gameState.players[this.player].inPlay.forEach((card, i) => {
                if (index !== i && card.faction === this.faction) {
                    this.allyAvailable = true;
                }
            });
        }

        onOtherPlay(gameState, card) {
            if (this.faction === card.faction) {
                this.allyAvailable = true;
            }
        }
    },
    Four: class Four extends Ship {
        // ally ability: destroy target base
        constructor(player) {
            super(player);
            this.value = 4;
            this.name = "Four";
            this.faction = "blue";

            this.primary = true;
            this.ally = true;

            this.allyAvailable = false;
        }
        onPlay(gameState) {
            this._primaryAbility(gameState);
            this._checkAlly(gameState, null);
        }

        onActivate(gameState, ability) {
            switch(ability) {
                case "primary":
                    this._primaryAbility(gameState);
                    break;
                case "ally":
                    this._allyAbility(gameState);
                    break;
                default:
                    break;
            }
        }

        _primaryAbility(gameState) {
            if (this.primary) {
                events.updateCounter(gameState, this.player, 'trade', this.value);
                this.primary = false;
            }
        }

        _allyAbility(gameState) {
            if (this.ally) {
                // destroy target base
                events.
                this.ally = false;
            }
        }

        _resetCounters() {
            this.primary = true;
            this.ally = true;
            this.allyAvailable = false;
            this.combat = 0;
        }

        availableAbilities() {
            let abilities = [];
            if (this.primary) {
                abilities.push("primary");
            }
            if (this.allyAvailable && this.ally) {
                abilities.push("ally");
            }
            return abilities;
        }

        _checkAlly(gameState, index) {
            gameState.players[this.player].inPlay.forEach((card, i) => {
                if (index !== i && card.faction === this.faction) {
                    this.allyAvailable = true;
                }
            });
        }

        onOtherPlay(gameState, card) {
            if (this.faction === card.faction) {
                this.allyAvailable = true;
            }
        }
    }
};