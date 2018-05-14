const types = require('./types');

// functions for common abilities

function scrapTradeRow(gameState) {
    let choices = [{name: "None", value: -1}];
    gameState.shop.rows.tradeRow.row.forEach((card, index) => {
        choices.push({
            name: card,
            value: index
        });
    });
    gameState.addDecision(gameState.playing, choices, (index) => {
        if (index !== -1) {
            gameState.shop.fromRow("tradeRow", index);
        }
    });
}

function destroyBase(gameState) {
    let choices = [{name: "None", value: false}];
    gameState._playerIds.forEach((playerId) => {
        // TODO: make outposts prevent other base targeting
        gameState.players[playerId].inPlay.forEach((card, index) => {
            choices.push({
                name: card.name,
                value: {
                    target: playerId,
                    index: index
                }
            })
        });
    });
    gameState.addDecision(gameState.playing, choices, (value) => {
        if (value) {
            gameState.players[value.target].destroy(gameState, value.index);
        }
    });
}

function acquireBlobCarrier(gameState) {
    // TODO: make only ships available
    let choices = [];
    gameState.shop.rows.tradeRow.row.forEach((card, index) => {
        choices.push({
            name: card,
            value: index
        });
    });
    gameState.addDecision(gameState.playing, choices, (index) => {
        let card = gameState.shop.fromRow("tradeRow", index);
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

// unaligned _cards

class Scout extends types.Ship {
    constructor() {
        super();
        this.name = "Scout";
        this.faction = "unaligned";
        this.cost = 1;
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("trade", 1);
    }
}

class Viper extends types.Ship {
    constructor() {
        super();
        this.name = "Viper";
        this.faction = "unaligned";
        this.cost = 1;
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("combat", 1);
    }
}

class Explorer extends types.Ship {
    constructor() {
        super();
        this.name = "Explorer";
        this.faction = "unaligned";
        this.cost = 2;
        this.abilities = {
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("trade", 2);
    }
    scrapAbility(gameState) {
        gameState.getPlaying().updateCounter("combat", 2);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
        gameState.shop.piles.explorers.amount += 1;
    }
}

// blob _cards

class BlobFighter extends types.Ship {
    constructor() {
        super();
        this.name = "BlobFighter";
        this.faction = "blob";
        this.cost = 1;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 3 combat
        gameState.getPlaying().updateCounter("combat", 3);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // draw a card
        gameState.getPlaying().draw(1);
    }
    onOtherPlay(gameState, other)  {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class BattlePod extends types.Ship {
    constructor() {
        super();
        this.name = "BattlePod";
        this.faction = "blob";
        this.cost = 2;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 4 combat
        gameState.getPlaying().updateCounter("combat", 4);
        // you may scrap a card in the trade row
        scrapTradeRow(gameState);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class TradePod extends types.Ship {
    constructor() {
        super();
        this.name = "TradePod";
        this.faction = "blob";
        this.cost = 2;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 3 trade
        gameState.getPlaying().updateCounter("trade", 3);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class BlobWheel extends types.Base {
    constructor() {
        super();
        this.name = "BlobWheel";
        this.faction = "blob";
        this.cost = 3;
        this.defense = 5;
        this.abilities = {
            primary: {
                available: false,
                used: false,
                func: this.primaryAbility
            },
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        this.onActivate(gameState, "primary");
    }
    primaryAbility(gameState) {
        // 1 combat
        gameState.getPlaying().updateCounter("combat", 1);
    }
    scrapAbility(gameState) {
        // 3 trade
        gameState.getPlaying().updateCounter("trade", 3);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
    resetCounters() {
        this.abilities.primary.available = true;
        this.abilities.primary.used = false;
        this.abilities.scrap.available = true;
        this.abilities.scrap.used = false;
    }
}

class Ram extends types.Ship {
    constructor() {
        super();
        this.name = "Ram";
        this.faction = "blob";
        this.cost = 3;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            },
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 5 combat
        gameState.getPlaying().updateCounter("combat", 5);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    scrapAbility(gameState) {
        // 3 trade
        gameState.getPlaying().updateCounter("trade", 3);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
        this.abilities.scrap.available = true;
        this.abilities.scrap.used = false;
    }
}

class BlobDestroyer extends types.Ship {
    constructor() {
        super();
        this.name = "BlobDestroyer";
        this.faction = "blob";
        this.cost = 4;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 6 combat
        gameState.getPlaying().updateCounter("trade", 3);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // you may destroy target base and/or scrap a card
        scrapTradeRow(gameState);
        destroyBase(gameState);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class TheHive extends types.Base {
    constructor() {
        super();
        this.name = "TheHive";
        this.faction = "blob";
        this.cost = 5;
        this.abilities = {
            primary: {
                available: false,
                used: false,
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
        gameState.getPlaying().updateCounter("blobs", 1);
        this.onActivate(gameState, "primary");
        this.checkAlly(gameState);
    }
    primaryAbility(gameState) {
        // 3 combat
        gameState.getPlaying().updateCounter("combat", 3);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // draw a card
        gameState.getPlaying().draw(1);
    }
    onOtherPlay(gameState, other)  {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
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
}

class BattleBlob extends types.Ship {
    constructor() {
        super();
        this.name = "BattleBlob";
        this.faction = "blob";
        this.cost = 5;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            },
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 8 combat
        gameState.getPlaying().updateCounter("combat", 8);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // draw a card
        gameState.getPlaying().draw(1);
    }
    scrapAbility(gameState) {
        // 4 combat
        gameState.getPlaying().updateCounter("combat", 4);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
    onOtherPlay(gameState, other)  {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class BlobCarrier extends types.Ship {
    constructor() {
        super();
        this.name = "BlobCarrier";
        this.faction = "blob";
        this.cost = 6;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 7 combat
        gameState.getPlaying().updateCounter("combat", 7);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // acquire any ship without paying its cost and put in on top of your deck
        acquireBlobCarrier(gameState);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class Mothership extends types.Ship {
    constructor() {
        super();
        this.name = "Mothership";
        this.faction = "blob";
        this.cost = 7;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        gameState.getPlaying().updateCounter("blobs", 1);
        // 6 combat
        gameState.getPlaying().updateCounter("combat", 6);
        // draw a card
        gameState.getPlaying().draw(1);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // draw a card
        gameState.getPlaying().draw(1);
    }
    onOtherPlay(gameState, other)  {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class BlobWorld extends types.Base {
    constructor() {
        super();
        this.name = "BlobWorld";
        this.faction = "blob";
        this.cost = 8;
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
        this.checkAlly(gameState);
    }
    primaryAbility(gameState) {
        // 5 combat or draw a card for each blob card that you've played this turn
        gameState.getPlaying().updateCounter("blobs", 1);
        let blobs = gameState.getPlaying().get("blobs");
        gameState.addDecision(gameState.playing, [{name: "5 Combat", value: 0}, {name: "Draw " + blobs, value: 1}], (value) => {
            if (value === 0) {
                // 5 combat
                gameState.getPlaying().updateCounter("combat", 5);
            } else if (value === 1) {
                // draw a card for each blob card that you've played this turn
                gameState.getPlaying().draw(blobs);
            }
        });
    }
    resetCounters() {
        this.abilities.primary.available = true;
        this.abilities.primary.used = false;
    }
}

// trade federation _cards TODO 12/12

// machine cult _cards TODO 12/12

// star empire _cards TODO 1/11

class ImperialFighter extends types.Ship {
    constructor() {
        super();
        this.name = "ImperialFighter";
        this.faction = "starEmpire";
        this.cost = 1;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
        // target opponent discards a card
        opponentDiscard(gameState);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class Corvette extends types.Ship {
    constructor() {
        super();
        this.name = "Corvette";
        this.faction = "starEmpire";
        this.cost = 2;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        // 1 combat
        gameState.getPlaying().updateCounter("combat", 1);
        // draw a card
        gameState.getPlaying().draw(1);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class ImperialFrigate extends types.Ship {
    constructor() {
        super();
        this.name = "ImperialFrigate";
        this.faction = "starEmpire";
        this.cost = 3;
        this.abilities = {
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            },
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        // 4 combat
        gameState.getPlaying().updateCounter("combat", 4);
        // target opponent discards a card
        opponentDiscard(gameState);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    scrapAbility(gameState) {
        // draw a card
        gameState.getPlaying().draw(1);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class SurveyShip extends types.Ship {
    constructor() {
        super();
        this.name = "SurveyShip";
        this.faction = "starEmpire";
        this.cost = 3;
        this.abilities = {
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            }
        }
    }
    onPlay(gameState) {
        // 1 trade
        gameState.getPlaying().updateCounter("trade", 1);
        // draw a card
        gameState.getPlaying().draw(1);
    }
    scrapAbility(gameState) {
        // target opponent discards a card
        opponentDiscard(gameState);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
}

class RecyclingStation extends types.Outpost {
    constructor() {
        super();
        this.name = "RecyclingStation";
        this.faction = "starEmpire";
        this.cost = 4;
        this.defense = 4;
        this.abilities = {
            primary: {
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
    primaryAbility(gameState) {
        // 1 trade or discard up to two _cards, then draw that many _cards
        gameState.addDecision(gameState.playing, [{name: "1 Trade", value: 0}, {name: "Discard up to two _cards, then draw that many", value: 1}], (value) => {
            if (value === 0) {
                gameState.getPlaying().updateCounter("trade", 1);
            } else if (value === 1) {
                // TODO discard up to two _cards, then draw that many
            }
        })
    }
}

class SpaceStation extends types.Outpost {
    constructor() {
        super();
        this.name = "SpaceStation";
        this.faction = "starEmpire";
        this.cost = 4;
        this.defense = 4;
        this.abilities = {
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            },
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            },
            primary: {
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
    primaryAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    allyAbility(gameState) {
        // 2 combat
        gameState.getPlaying().updateCounter("combat", 2);
    }
    scrapAbility(gameState) {
        // 4 trade
        gameState.getPlaying().updateCounter("trade", 4);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
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
}

class WarWorld extends types.Outpost {
    constructor() {
        super();
        this.name = "WarWorld";
        this.faction = "starEmpire";
        this.cost = 5;
        this.defense = 4;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            },
            primary: {
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
    primaryAbility(gameState) {
        // 3 combat
        gameState.getPlaying().updateCounter("combat", 3);
    }
    allyAbility(gameState) {
        // 4 combat
        gameState.getPlaying().updateCounter("combat", 4);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
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
}

class Battlecruiser extends types.Ship {
    constructor() {
        super();
        this.name = "Battlecruiser";
        this.faction = "starEmpire";
        this.cost = 6;
        this.abilities = {
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            },
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            }
        }
    }
    onPlay(gameState) {
        // 5 combat
        gameState.getPlaying().updateCounter("combat", 5);
        // draw a card
        gameState.getPlaying().draw(1);
        this.checkAlly(gameState);
    }
    allyAbility(gameState) {
        // target opponent discards a card
        opponentDiscard(gameState);
    }
    scrapAbility(gameState) {
        // draw a card
        gameState.getPlaying().draw(1);
        // you may destroy target base
        destroyBase(gameState);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
    }
    checkAlly(gameState, index) {
        gameState.getPlaying().inPlay.forEach((card, i) => {
            if (index !== i && this.faction === card.faction) {
                this.abilities.ally.available = true;
            }
        });
    }
    resetCounters() {
        this.abilities.ally.available = false;
        this.abilities.ally.used = false;
    }
}

class RoyalRedoubt extends types.Outpost {
    constructor() {
        super();
        this.name = "RoyalRedoubt";
        this.faction = "starEmpire";
        this.cost = 6;
        this.defense = 6;
        this.abilities = {
            ally: {
                available: false,
                used: false,
                func: this.allyAbility
            },
            primary: {
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
    primaryAbility(gameState) {
        // 3 combat
        gameState.getPlaying().updateCounter("combat", 3);
    }
    allyAbility(gameState) {
        // target opponent discards a card
        opponentDiscard(gameState);
    }
    onOtherPlay(gameState, other) {
        if (this.faction === other.faction) {
            this.abilities.ally.available = true;
        }
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
}

class Dreadnaught extends types.Ship {
    constructor() {
        super();
        this.name = "Dreadnaught";
        this.faction = "starEmpire";
        this.cost = 7;
        this.abilities = {
            scrap: {
                available: true,
                used: false,
                func: this.scrapAbility
            }
        }
    }
    onPlay(gameState) {
        // 7 combat
        gameState.getPlaying().updateCounter("combat", 7);
        // draw a card
        gameState.getPlaying().draw(1);
    }
    scrapAbility(gameState) {
        // 5 combat
        gameState.getPlaying().updateCounter("combat", 5);
        let index = gameState.getPlaying().inPlay.indexOf(this);
        gameState.getPlaying().fromInPlay(index);
    }
}

class FleetHQ extends types.Base {
    constructor() {
        super();
        this.name = "FleetHQ";
        this.faction = "starEmpire";
        this.cost = 5;
        this.defense = 8;
        this.abilities = {
            primary: {
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
    primaryAbility(gameState) {
        // all your ships get 1 combat
        gameState.getPlaying().inPlay.forEach((card) => {
            if (card.types.has("ship")) {
                gameState.getPlaying().updateCounter("combat", 1);
            }
        })
    }
    onOtherPlay(gameState, other) {
        if (other.types.has("ship")) {
            gameState.getPlaying().updateCounter("combat", 1);
        }
    }
}

module.exports = {
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
    Scout,
    Viper,
    Explorer,

    BlobFighter,
    BattlePod,
    TradePod,
    BlobWheel,
    Ram,
    BlobDestroyer,
    TheHive,
    BattleBlob,
    BlobCarrier,
    Mothership,
    BlobWorld,

    ImperialFighter,
    Corvette,
    ImperialFrigate,
    SurveyShip,
    RecyclingStation,
    SpaceStation,
    WarWorld,
    Battlecruiser,
    RoyalRedoubt,
    Dreadnaught,
    FleetHQ
};
