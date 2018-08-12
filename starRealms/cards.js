const types = require('./types');

// functions for common abilities

function scrapTradeRow(gameState, optional, callback) {
    let choices = optional ? [{name: "None", value: -1}] : [];
    gameState.shop.rows.tradeRow.row.forEach((card, index) => {
        choices.push({
            name: card.replace(/([a-z](?=[A-Z]))/g, '$1 '),
            value: index
        });
    });
    gameState.addDecision(gameState.playing, "Choose a card in the trade row to scrap.", choices, choice => {
        if (choice.value !== -1) {
            gameState.shop.fromRow("tradeRow", choice.value);
        }
        if (typeof callback === "function") {
            callback();
        }
    });
}

function destroyBase(gameState, optional, callback) {
    let choices = optional ? [{name: "None", value: false}] : [];
    gameState._playerIds.filter((playerId) => { return playerId !== gameState.playing }).forEach((playerId) => {
        let bases = [];
        let outposts = [];
        gameState.players[playerId].inPlay.forEach((card, index) => {
            if (card.types.has("outpost")) {
                outposts.push({
                    name: card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
                    value: {
                        target: playerId,
                        index: index
                    }
                });
            } else if (outposts.length === 0 && card.types.has("base")) {
                bases.push({
                    name: card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
                    value: {
                        target: playerId,
                        index: index
                    }
                });
            }
        });
        if (outposts.length !== 0) {
            choices.push(...outposts);
        } else {
            choices.push(...bases);
        }
    });
    gameState.addDecision(gameState.playing, "Choose an opponents base to destroy.", choices, choice => {
        if (choice.value) {
            gameState.players[choice.value.target].destroy(gameState, choice.value.index);
        }
        if (typeof callback === "function") {
            callback();
        }
    });
}

function acquireBlobCarrier(gameState) {
    // acquire any ship without paying its cost and put in on top of your deck
    let choices = [];
    gameState.shop.rows.tradeRow.row.forEach((card, index) => {
        if (cards[card].getType() === "ship") {
            choices.push({
                name: card.replace(/([a-z](?=[A-Z]))/g, '$1 '),
                value: index
            });
        }
    });
    gameState.addDecision(gameState.playing, "Choose a card from the ", choices, choice => {
        let card = gameState.shop.fromRow("tradeRow", choice.value);
        gameState.getPlaying().toDeck(card);
    });
}

function opponentDiscard(gameState) {
    let choices = gameState._playerIds.filter((player) => {
        return player !== gameState.playing;
    }).map((player) => {
        return {
            name: player,
            value: player
        }
    });
    gameState.addDecision(gameState.playing, "Choose a player to discard a card from their hand.", choices, (choice) => {
        let playerId = choice.value;
        let choices = gameState.players[playerId].hand.map((card, index) => {
            return {
                name: card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
                value: index
            }
        });
        gameState.addDecision(playerId, "Choose a card from your hand to discard.", choices, (choice) => {
            let index = choice.value;
            let card = gameState.players[playerId].fromHand(index);
            gameState.players[playerId].toDiscard(card);
        });
    });
}

function discardHand(gameState, optional, callback) {
    let choices = optional ? [{ name: "None", value: -1 }] : [];
    choices.push(...gameState.getPlaying().hand.map((card, index) => {
        return {
            name: card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
            value: index
        }
    }));
    gameState.addDecision(gameState.playing, "Choose a card from your hand to discard.", choices, (choice) => {
        if (choice.value !== -1) {
            let card = gameState.getPlaying().fromHand(choice.value);
            gameState.getPlaying().toDiscard(card);
        }
        if (typeof callback === "function") {
            callback(choice);
        }
    });
}

function scrapHandDiscard(gameState, optional, callback) {
    let choices = optional ? [{ name: "None", value: false }] : [];
    choices.push(...gameState.getPlaying().hand.map((card, index) => {
        return {
            name: "Hand: " + card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
            value: {
                target: "hand",
                index: index
            }
        }
    }));
    choices.push(...gameState.getPlaying().discard.map((card, index) => {
        return {
            name: "Discard: " + card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
            value: {
                target: "discard",
                index: index
            }
        }
    }));
    gameState.addDecision(gameState.playing, "Choose a card from you hand or discard to scrap.", choices, choice => {
        if (choice.value !== false) {
            let card = gameState.getPlaying().from(choice.value.target, choice.value.index);
            if (card.name === "Explorer") {
                gameState.shop.piles.explorers.amount += 1;
            }
        }
        if (typeof callback === "function") {
            callback(choice);
        }
    })
}

function scrapHand(gameState, optional, callback) {
    let choices = optional ? [{ name: "None", value: -1 }] : [];
    choices.push(...gameState.getPlaying().hand.map((card, index) => {
        return {
            name: card.name.replace(/([a-z](?=[A-Z]))/g, '$1 '),
            value: index
        }
    }));
    gameState.addDecision(gameState.playing, "Choose a card from you hand to scrap.", choices, choice => {
        if (choice.value !== -1) {
            let card = gameState.getPlaying().fromHand(choice.value);
            if (card && card.name === "Explorer") {
                gameState.shop.piles.explorers.amount += 1;
            }
        }
        if (typeof callback === "function") {
            callback(choice);
        }
    })
}

const cards = {

    // unaligned cards

    Scout: class Scout extends types.Ship {
        constructor() {
            super();
            this.name = "Scout";
            this.faction = "unaligned";
            this.cost = 1;
            this.abilities.primary = { func: this.primaryAbility };
            this.resetCounters();
        }
        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 1);
        }
    },

    Viper: class Viper extends types.Ship {
        constructor() {
            super();
            this.name = "Viper";
            this.faction = "unaligned";
            this.cost = 1;
            this.abilities.primary = { func: this.primaryAbility };
            this.resetCounters();
        }
        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 1);
        }
    },

    Explorer: class Explorer extends types.Ship {
        constructor() {
            super();
            this.name = "Explorer";
            this.faction = "unaligned";
            this.cost = 2;
            this.abilities = {
                primary: { func: this.primaryAbility },
                scrap: { func: this.scrapAbility }
            };
            this.resetCounters();
        }
        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 2);
        }
        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("combat", 2);
            gameState.getPlaying().fromInPlay(action.index);
            gameState.shop.piles.explorers.amount += 1;
        }
    },

    // blob cards

    BlobFighter: class BlobFighter extends types.Ship {
        constructor() {
            super();
            this.name = "BlobFighter";
            this.faction = "blob";
            this.cost = 1;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 3);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    BattlePod: class BattlePod extends types.Ship {
        constructor()
        {
            super();
            this.name = "BattlePod";
            this.faction = "blob";
            this.cost = 2;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }
        primaryAbility(gameState)
        {
            gameState.getPlaying().updateCounter("combat", 4);
            scrapTradeRow(gameState, true);
        }
        allyAbility(gameState)
        {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    TradePod: class TradePod extends types.Ship {
        constructor() {
            super();
            this.name = "TradePod";
            this.faction = "blob";
            this.cost = 2;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 3);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    BlobWheel: class BlobWheel extends types.Base {
        constructor() {
            super();
            this.name = "BlobWheel";
            this.faction = "blob";
            this.cost = 3;
            this.defense = 5;
            this.abilities = {
                primary: {func: this.primaryAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 1);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("trade", 3);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    Ram: class Ram extends types.Ship {
        constructor() {
            super();
            this.name = "Ram";
            this.faction = "blob";
            this.cost = 3;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 5);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("trade", 3);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    BlobDestroyer: class BlobDestroyer extends types.Ship {
        constructor() {
            super();
            this.name = "BlobDestroyer";
            this.faction = "blob";
            this.cost = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 6);
        }

        allyAbility(gameState) {
            destroyBase(gameState, true, () => {
                scrapTradeRow(gameState, true);
            });
        }
    },

    TheHive: class TheHive extends types.Base {
        constructor() {
            super();
            this.name = "TheHive";
            this.faction = "blob";
            this.cost = 5;
            this.defense = 5;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 3);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    BattleBlob: class BattleBlob extends types.Ship {
        constructor() {
            super();
            this.name = "BattleBlob";
            this.faction = "blob";
            this.cost = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 8);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("combat", 4);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    BlobCarrier: class BlobCarrier extends types.Ship {
        constructor() {
            super();
            this.name = "BlobCarrier";
            this.faction = "blob";
            this.cost = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 7);
        }

        allyAbility(gameState) {
            acquireBlobCarrier(gameState);
        }
    },

    Mothership: class Mothership extends types.Ship {
        constructor() {
            super();
            this.name = "Mothership";
            this.faction = "blob";
            this.cost = 7;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 6);
            gameState.getPlaying().draw(1);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    BlobWorld: class BlobWorld extends types.Base {
        constructor() {
            super();
            this.name = "BlobWorld";
            this.faction = "blob";
            this.cost = 8;
            this.defense = 7;
            this.abilities = {
                primary: {func: this.primaryAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            // 5 combat or draw a card for each blob card that you've played this turn
            let blobs = gameState.getPlaying().get("blobs");
            gameState.addDecision(gameState.playing, "Choose an action.", [
                { name: "5 Combat", value: 0},
                { name: "Draw " + blobs, value: 1}
            ], choice => {
                if (choice.value === 0) {
                    // 5 combat
                    gameState.getPlaying().updateCounter("combat", 5);
                } else if (choice.value === 1) {
                    // draw a card for each blob card that you've played this turn
                    gameState.getPlaying().draw(blobs);
                }
            });
        }
    },

    // trade federation cards

    BarterWorld: class BarterWorld extends types.Base {
        constructor() {
            super();
            this.name = "BarterWorld";
            this.faction = "tradeFederation";
            this.cost = 4;
            this.defense = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.addDecision(gameState.playing, "Choose an action.", [
                { name: "2 Authority", value: 0 },
                { name: "2 Trade", value: 1 }
            ], choice => {
                if (choice.value === 0) {
                    gameState.getPlaying().updateCounter("authority", 2);
                } else if (choice.value === 1) {
                    gameState.getPlaying().updateCounter("trade", 2);
                }
            });
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("combat", 5);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    CentralOffice: class CentralOffice extends types.Base {
        constructor() {
            super();
            this.name = "CentralOffice";
            this.faction = "tradeFederation";
            this.cost = 7;
            this.defense = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            // setting buyTopDeck to 1 allows the player to choose if card goes to top of deck or not
            gameState.getPlaying().updateCounter("trade", 2);
            gameState.getPlaying().setCounter("buyTopDeck", 1);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    CommandShip: class CommandShip extends types.Ship {
        constructor() {
            super();
            this.name = "CommandShip";
            this.faction = "tradeFederation";
            this.cost = 8;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("authority", 4);
            gameState.getPlaying().updateCounter("combat", 5);
            gameState.getPlaying().draw(2);
        }

        allyAbility(gameState) {
            destroyBase(gameState);
        }
    },

    Cutter: class Cutter extends types.Ship {
        constructor() {
            super();
            this.name = "Cutter";
            this.faction = "tradeFederation";
            this.cost = 2;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("authority", 4);
            gameState.getPlaying().updateCounter("trade", 2);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 4);
        }
    },

    DefenseCenter: class DefenseCenter extends types.Outpost {
        constructor() {
            super();
            this.name = "DefenseCenter";
            this.faction = "tradeFederation";
            this.cost = 5;
            this.defense = 5;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.addDecision(gameState.playing, "Choose an action.", [
                { name: "3 Authority", value: 0 },
                { name: "2 Combat", value: 1 }
            ], choice => {
                if (choice.value === 0) {
                    gameState.getPlaying().updateCounter("authority", 3);
                } else if (choice.value === 1) {
                    gameState.getPlaying().updateCounter("combat", 2);
                }
            });
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    EmbassyYacht: class EmbassyYacht extends types.Ship {
        constructor() {
            super();
            this.name = "EmbassyYacht";
            this.faction = "tradeFederation";
            this.cost = 3;
            this.abilities = {
                primary: {func: this.primaryAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("authority", 3);
            gameState.getPlaying().updateCounter("trade", 2);
            const reducer = (total, card) => {
                return card.types.has("base") ? total + 1 : total;
            };
            console.log(gameState.getPlaying().inPlay.reduce(reducer, 0));
            if (gameState.getPlaying().inPlay.reduce(reducer, 0) >= 2) {
                gameState.getPlaying().draw(2);
            }
        }
    },

    FederationShuttle: class FederationShuttle extends types.Ship {
        constructor() {
            super();
            this.name = "FederationShuttle";
            this.faction = "tradeFederation";
            this.cost = 1;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 2);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("authority", 4);
        }
    },

    Flagship: class Flagship extends types.Ship {
        constructor() {
            super();
            this.name = "Flagship";
            this.faction = "tradeFederation";
            this.cost = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 5);
            gameState.getPlaying().draw(1);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("authority", 5);
        }
    },

    Freighter: class Freighter extends types.Ship {
        constructor() {
            super();
            this.name = "Freighter";
            this.faction = "tradeFederation";
            this.cost = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 4);
        }

        allyAbility(gameState) {
            // setting buyTopDeck to 2 makes the next ship acquired go to top of deck
            gameState.getPlaying().setCounter("buyTopDeck", 2);
        }
    },

    PortOfCall: class PortOfCall extends types.Outpost {
        constructor() {
            super();
            this.name = "PortOfCall";
            this.faction = "tradeFederation";
            this.cost = 6;
            this.defense = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 3);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().draw(1);
            destroyBase(gameState, true);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    TradeEscort: class TradeEscort extends types.Ship {
        constructor() {
            super();
            this.name = "TradeEscort";
            this.faction = "tradeFederation";
            this.cost = 5;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("auhtority", 4);
            gameState.getPlaying().updateCounter("combat", 4);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    TradingPost: class TradingPost extends types.Outpost {
        constructor() {
            super();
            this.name = "TradingPost";
            this.faction = "tradeFederation";
            this.cost = 3;
            this.defense = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.addDecision(gameState.playing, "Choose an action.", [
                { name: "1 Authority", value: 0 },
                { name: "1 Trade", value: 1 }
            ], choice => {
                if (choice.value === 0) {
                    gameState.getPlaying().updateCounter("authority", 1);
                } else if (choice.value === 1) {
                    gameState.getPlaying().updateCounter("trade", 1);
                }
            });
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("combat", 3);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    // machine cult cards

    BattleMech: class BattleMech extends types.Ship {
        constructor() {
            super();
            this.name = "BattleMech";
            this.faction = "machineCult";
            this.cost = 5;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 4);
            scrapHandDiscard(gameState, true);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    BattleStation: class BattleStation extends types.Outpost {
        constructor() {
            super();
            this.name = "BattleStation";
            this.faction = "machineCult";
            this.cost = 3;
            this.defense = 5;
            this.abilities = {
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("combat", 5);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    BrainWorld: class BrainWorld extends types.Outpost {
        constructor() {
            super();
            this.name = "BrainWorld";
            this.faction = "machineCult";
            this.cost = 8;
            this.defense = 6;
            this.abilities = {
                primary: {func: this.primaryAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            scrapHandDiscard(gameState, false, choice => {
                if (choice.value) {
                    scrapHandDiscard(gameState, true, choice => {
                        if (choice.value) {
                            gameState.getPlaying().draw(2);
                        } else {
                            gameState.getPlaying().draw(1);
                        }
                    });
                }
            });
        }
    },

    Junkyard: class Junkyard extends types.Outpost {
        constructor() {
            super();
            this.name = "Junkyard";
            this.faction = "machineCult";
            this.cost = 6;
            this.defense = 5;
            this.abilities = {
                primary: {func: this.primaryAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            scrapHandDiscard(gameState, false);
        }
    },

    MachineBase: class MachineBase extends types.Outpost {
        constructor() {
            super();
            this.name = "MachineBase";
            this.faction = "machineCult";
            this.cost = 7;
            this.defense = 6;
            this.abilities = {
                primary: {func: this.primaryAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().draw(1);
            scrapHand(gameState, false);
        }
    },

    MechWorld: class MechWorld extends types.Outpost {
        constructor() {
            super();
            this.name = "MechWorld";
            this.faction = "machineCult";
            this.cost = 5;
            this.defense = 6;
        }
    },

    MissileBot: class MissileBot extends types.Ship {
        constructor() {
            super();
            this.name = "MissileBot";
            this.faction = "machineCult";
            this.cost = 2;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
            scrapHandDiscard(gameState, true);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    MissileMech: class MissileMech extends types.Ship {
        constructor() {
            super();
            this.name = "MissileMech";
            this.faction = "machineCult";
            this.cost = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 6);
            destroyBase(gameState, true);
        }

        allyAbility(gameState) {
            gameState.getPlaying().draw(1);
        }
    },

    PatrolMech: class PatrolMech extends types.Ship {
        constructor() {
            super();
            this.name = "PatrolMech";
            this.faction = "machineCult";
            this.cost = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.addDecision(gameState.playing, "Choose an action.", [
                { name: "3 Trade", value: 0 },
                { name: "5 Combat", value: 1 }
            ], choice => {
                if (choice.value === 0) {
                    gameState.getPlaying().updateCounter("trade", 3);
                } else if (choice.value === 1) {
                    gameState.getPlaying().updateCounter("combat", 5);
                }
            });
        }

        allyAbility(gameState) {
            scrapHandDiscard(gameState, false);
        }
    },

    StealthNeedle: class StealthNeedle extends types.Ship {
        constructor() {
            super();
            this.name = "StealthNeedle";
            this.faction = "machineCult";
            this.types.add("StealthNeedle");
            this.cost = 4;
            this.abilities = {
                primary: {func: this.primaryAbility.bind(this)}
            };
            this.resetCounters();
            this.copied = null;
        }

        primaryAbility(gameState) {
            let choices = [{ name: "None", value: false }];
            gameState.getPlaying().inPlay.forEach((card) => {
                if (card.types.has("ship") && card.name !== "StealthNeedle") {
                    choices.push({
                        name: card.name,
                        value: card.name
                    });
                }
            });
            gameState.addDecision(gameState.playing, "Choose a ship to copy.", choices, choice => {
                if (choice.value) {
                    this.copied = new cards[choice.value];
                    this.abilities = this.copied.abilities;
                    this.name = this.copied.name;
                    this.faction = this.copied.faction;
                    this.checkAlly(gameState);
                } else {
                    this.abilities.primary.func = () => {};
                    this.abilities.primary.used = true;
                }
            }, this);
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
                    if (location === "inPlay") {
                        this.copied = null;
                        this.name = "StealthNeedle";
                        this.faction = "machineCult";
                        this.abilities = {
                            primary: {func: this.primaryAbility.bind(this)}
                        };
                    }
                    this.resetCounters();
                    break;
                default:
                    break;
            }
        }

    },

    SupplyBot: class SupplyBot extends types.Ship {
        constructor() {
            super();
            this.name = "SupplyBot";
            this.faction = "machineCult";
            this.cost = 3;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 2);
            scrapHandDiscard(gameState, true);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    TradeBot: class TradeBot extends types.Ship {
        constructor() {
            super();
            this.name = "TradeBot";
            this.faction = "machineCult";
            this.cost = 1;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 1);
            scrapHandDiscard(gameState, true);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    // star empire cards

    ImperialFighter: class ImperialFighter extends types.Ship {
        constructor() {
            super();
            this.name = "ImperialFighter";
            this.faction = "starEmpire";
            this.cost = 1;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
            opponentDiscard(gameState);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    Corvette: class Corvette extends types.Ship {
        constructor() {
            super();
            this.name = "Corvette";
            this.faction = "starEmpire";
            this.cost = 2;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 1);
            gameState.getPlaying().draw(1);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }
    },

    ImperialFrigate: class ImperialFrigate extends types.Ship {
        constructor() {
            super();
            this.name = "ImperialFrigate";
            this.faction = "starEmpire";
            this.cost = 3;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 4);
            opponentDiscard(gameState);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().draw(1);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    SurveyShip: class SurveyShip extends types.Ship {
        constructor() {
            super();
            this.name = "SurveyShip";
            this.faction = "starEmpire";
            this.cost = 3;
            this.abilities = {
                primary: {func: this.primaryAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("trade", 1);
            gameState.getPlaying().draw(1);
        }

        scrapAbility(gameState, action) {
            opponentDiscard(gameState);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    RecyclingStation: class RecyclingStation extends types.Outpost {
        constructor() {
            super();
            this.name = "RecyclingStation";
            this.faction = "starEmpire";
            this.cost = 4;
            this.defense = 4;
            this.abilities = {
                primary: {func: this.primaryAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            // 1 trade or discard up to two cards, then draw that many cards
            gameState.addDecision(gameState.playing, "Choose an action.", [
                { name: "1 Trade", value: 0 },
                { name: "Discard up to two cards, then draw that many", value: 1}
            ], choice => {
                if (choice.value === 0) {
                    gameState.getPlaying().updateCounter("trade", 1);
                } else if (choice.value === 1) {
                    discardHand(gameState, false, choice => {
                        if (choice.value !== -1) {
                            discardHand(gameState, true, choice => {
                                if (choice.value !== -1) {
                                    gameState.getPlaying().draw(2);
                                } else {
                                    gameState.getPlaying().draw(1);
                                }
                            });
                        }
                    });

                }
            });
        }
    },

    SpaceStation: class SpaceStation extends types.Outpost {
        constructor() {
            super();
            this.name = "SpaceStation";
            this.faction = "starEmpire";
            this.cost = 4;
            this.defense = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 2);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("trade", 4);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    WarWorld: class WarWorld extends types.Outpost {
        constructor() {
            super();
            this.name = "WarWorld";
            this.faction = "starEmpire";
            this.cost = 5;
            this.defense = 4;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 3);
        }

        allyAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 4);
        }
    },

    Battlecruiser: class Battlecruiser extends types.Ship {
        constructor() {
            super();
            this.name = "Battlecruiser";
            this.faction = "starEmpire";
            this.cost = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 5);
            gameState.getPlaying().draw(1);
        }

        allyAbility(gameState) {
            opponentDiscard(gameState);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().draw(1);
            destroyBase(gameState, true);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    RoyalRedoubt: class RoyalRedoubt extends types.Outpost {
        constructor() {
            super();
            this.name = "RoyalRedoubt";
            this.faction = "starEmpire";
            this.cost = 6;
            this.defense = 6;
            this.abilities = {
                primary: {func: this.primaryAbility},
                ally: {func: this.allyAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 3);
        }

        allyAbility(gameState) {
            opponentDiscard(gameState);
        }
    },

    Dreadnaught: class Dreadnaught extends types.Ship {
        constructor() {
            super();
            this.name = "Dreadnaught";
            this.faction = "starEmpire";
            this.cost = 7;
            this.abilities = {
                primary: {func: this.primaryAbility},
                scrap: {func: this.scrapAbility}
            };
            this.resetCounters();
        }

        primaryAbility(gameState) {
            gameState.getPlaying().updateCounter("combat", 7);
            gameState.getPlaying().draw(1);
        }

        scrapAbility(gameState, action) {
            gameState.getPlaying().updateCounter("combat", 5);
            gameState.getPlaying().fromInPlay(action.index);
        }
    },

    FleetHQ: class FleetHQ extends types.Base {
        constructor() {
            super();
            this.name = "FleetHQ";
            this.faction = "starEmpire";
            this.cost = 8;
            this.defense = 8;
        }

        onOtherPlay(gameState, other) {
            if (other.types.has("ship")) {
                gameState.getPlaying().updateCounter("combat", 1);
            }
        }
    },

};

module.exports = {
    // TODO: better way of getting card costs
    _costEnum: {
        Scout: 1,
        Viper: 1,
        Explorer: 2,

        BlobFighter: 1,
        BattlePod: 2,
        TradePod: 2,
        BlobWheel: 3,
        Ram: 3,
        BlobDestroyer: 4,
        TheHive: 5,
        BattleBlob: 6,
        BlobCarrier: 6,
        Mothership: 7,
        BlobWorld: 8,

        BarterWorld: 4,
        CentralOffice: 7,
        CommandShip: 8,
        Cutter: 2,
        DefenseCenter: 5,
        EmbassyYacht: 3,
        FederationShuttle: 1,
        Flagship: 6,
        Freighter: 4,
        PortOfCall: 6,
        TradeEscort: 5,
        TradingPost: 3,

        BattleMech: 5,
        BattleStation: 3,
        BrainWorld: 8,
        Junkyard: 6,
        MachineBase: 7,
        MechWorld: 5,
        MissileBot: 2,
        MissileMech: 6,
        PatrolMech: 4,
        StealthNeedle: 4,
        SupplyBot: 3,
        TradeBot: 1,

        ImperialFighter: 1,
        Corvette: 2,
        ImperialFrigate: 3,
        SurveyShip: 3,
        RecyclingStation: 4,
        SpaceStation: 4,
        WarWorld: 5,
        Battlecruiser: 6,
        RoyalRedoubt: 6,
        Dreadnaught: 7,
        FleetHQ: 8
    },
    ...cards
};
