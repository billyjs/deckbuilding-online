const events = require('./events');
const cards = require('./cards');

module.exports = {

    phases: ['play', 'discard', 'draw'],

    getStartingState: function(players) {
        let state = {
            phase: this.phases[0], // current phase
            playing: players[0], // current player TODO: choose first player better
            players: {},
            shop: this.startingShop(),
            turn: 1
        };
        players.forEach((player) => {
            state.players[player] = {
                hand: [], // array of instantiated _cards in hand
                inPlay: [], // array of instantiated _cards in play
                discard: [], // array of card names in discard
                deck: this.startingDeck(player), // array of card names in deck
                points: 0,
                authority: 50,
                combat: 0,
                trade: 0
            }
        });
        this.firstDraw(state);
        return state;
    },

    makeActions: function(gameState) {
        let actions = [];
        switch (gameState.phase) {
            case "play":
                actions.push(...this.playingActions(gameState));
                actions.push(...this.cardAbilities(gameState));
                actions.push(...this.combatActions(gameState));
                actions.push(...this.buyActions(gameState));
                actions.push(this.endAction());
                break;
            case "discard":
                actions.push(this.endAction());
                break;
            case "draw":
                // actions.push({ action: "draw" });
                actions.push(this.endAction());
                break;
            default:
                console.log("Error: invalid phase");
        }
        return actions;
    },

    applyAction: function(gameState, action) {
        console.log(action);
        switch (action.action) {
            case 'play':
                events.playHand(gameState, gameState.playing, action.index);
                return 'Play ' + action.card;
            case "ability":
                events.activateAbility(gameState, gameState.playing, action.index, action.ability);
                return 'Ability ' + action.card + ' ' + action.ability;
            case "combat":
                if (action.target === "player") {
                    events.updateCounter(gameState, action.player, "authority", -action.damage);
                    events.updateCounter(gameState, gameState.playing, "combat", -action.damage);
                } else if (action.target === "card") {
                    events.attackCard(gameState, action.player, action.index);
                    events.updateCounter(gameState, gameState.playing, "combat", -action.damage);
                }
                return "Combat";
            case "buy":
                let card = null;
                switch(action.target) {
                    case "tradeRow":
                        // get card from trade row in shop
                        card = events.fromShopRow(gameState, cards, gameState.playing, 'tradeRow', action.index);
                        // add card to players hand
                        events.toDiscard(gameState, gameState.playing, card);
                        // remove trade cost from player
                        events.updateCounter(gameState, gameState.playing, 'trade', -card.cost);
                        break;
                    case "explorers":
                        // get card from trade row in shop
                        card = events.fromShopPile(gameState, cards, gameState.playing, 'explorers');
                        // add card to players hand
                        events.toDiscard(gameState, gameState.playing, card);
                        // remove trade cost from player
                        events.updateCounter(gameState, gameState.playing, 'trade', -card.cost);
                        break;
                    default:
                        break;
                }
                return "Buy";
            case 'end':
                let phase = gameState.phase;
                // go to next phase
                let newTurn = events.nextPhase(gameState, this.phases);
                this.onPhaseStart(gameState);
                if (newTurn) {
                    this.onTurnStart(gameState);
                }
                console.log("End Phase");
                return "End " + phase + " phase";
            // case "draw":
            //     events.drawDeck(gameState, gameState.playing, 5);
            //     break;
            default:
                console.log("Error: invalid action");
                return "Invalid Action";
        }
    },

    onPhaseStart: function(gameState) {
        switch(gameState.phase) {
            case "draw":
                events.drawDeck(gameState, gameState.playing, 5);
                break;
            case "discard":
                events.setCounter(gameState, gameState.playing, "trade", 0);
                events.setCounter(gameState, gameState.playing, "combat", 0);
            default:
                break;
        }
    },

    onTurnStart: function(gameState) {
        let winner = this.endCheck(gameState);
        if (winner !== null) {
            events.gameOver(gameState, winner);
        }
    },

    censorGameState: function(gameState, player) {
        let gs = JSON.parse(JSON.stringify(gameState)); // deep copy of gameState
        // console.log(JSON.stringify(gs, null, 2));
        Object.keys(gs.players).forEach((id) => {
            let p = gs.players[id];
            p.deck = p.deck.length;
            p.inPlay = p.inPlay.map(this.cardToName);
            p.discard =  p.discard.map(this.cardToName);
            if (player !== id) {
                p.hand = p.hand.length;
            } else {
                p.hand = p.hand.map(this.cardToName);
            }
        });
        return gs;
    },

    cardToName: function(card) {
        if (card.name === null) {
            console.log(card);
        }
        return card.name;
    },

    endCheck: function(gameState) {
        let alive = [];
        Object.keys(gameState.players).forEach((id) => {
            if (gameState.players[id].authority > 0) {
                alive.push(id);
            }
        });
        return (alive.length === 1) ? alive[0] : null;
    },


    // helpers

    playingActions: function(gameState) {
        let actions = [];
        gameState.players[gameState.playing].hand.forEach((card, index) => {
            actions.push({
                action: 'play',
                card: card.name,
                index: index
            })
        });
        return actions;
    },

    buyActions: function(gameState) {
        let actions = [];
        let trade = gameState.players[gameState.playing].trade;
        Object.keys(gameState.shop).forEach((key) => {
            let source = gameState.shop[key];
            // if trade pile and has _cards left
            if (source.amount > 0 && cards._costEnum[source.cardName] <= trade) {
                actions.push({
                    action: "buy",
                    target: key,
                })
            }
            if (source.row) {
                source.row.forEach((card, index) => {
                    if (card !== null && cards._costEnum[source.row[index]] <= trade) {
                        actions.push({
                            action: "buy",
                            target: key,
                            index: index
                        });
                    }
                });
            }
        });
        return actions;
    },

    cardAbilities: function(gameState) {
        let actions = [];
        gameState.players[gameState.playing].inPlay.forEach((card, index) => {
            card.availableAbilities().forEach((ability) => {
                actions.push({
                    action: "ability",
                    ability: ability,
                    card: card.name,
                    index: index
                });
            });
        });
        return actions;
    },

    combatActions: function(gameState) {
        let actions = [];
        let combat = gameState.players[gameState.playing].combat;
        Object.keys(gameState.players).forEach((id) => {
            let bases = [];
            let outposts = [];
            if (id !== gameState.playing) {
                gameState.players[id].inPlay.forEach((card, index) => {
                    if (card.defense <= combat) {
                        if (card.types.has("outpost")) {
                            outposts.push({card, index});
                        } else {
                            bases.push({card, index});
                        }
                    }
                });
                outposts.forEach((outpost) => {
                    actions.push({
                        action: "combat",
                        target: "card",
                        player: id,
                        damage: outpost.card.defense,
                        card: outpost.card.name,
                        index: outpost.index
                    });
                });
                if (outposts.length === 0) {
                    bases.forEach((base) => {
                        actions.push({
                            action: "combat",
                            target: "card",
                            player: id,
                            damage: base.card.defense,
                            card: base.card.name,
                            index: base.index
                        });
                    });
                    if (combat > 0) {
                        actions.push({
                            action: "combat",
                            target: "player",
                            player: id,
                            damage: combat
                        });
                    }
                }
            }
        });
        console.log(actions);
        return actions;
    },

    endAction: function() {
        return {
            action: 'end'
        }
    },

    startingDeck: function(player) {
        let deck = [];
        for (let i = 0; i < 4; i++) {
            deck.push(new cards.One(player));
            deck.push(new cards.Two(player));
            deck.push(new cards.Three(player));
        }
        return deck;
    },

    startingShop: function() {
        let shop = {
            tradeRow: {
                row: [],
                deck: [],
            },
            explorers: {
                cardName: "One",
                amount: 10
            }
        };
        for (let i = 0; i < 10; i++) {
            shop.tradeRow.deck.push("One");
            shop.tradeRow.deck.push("Two");
            shop.tradeRow.deck.push("Three");
        }
        shop.tradeRow.row = shop.tradeRow.deck.splice(0, 5);
        return shop;
    },

    firstDraw: function(gameState) {
        Object.keys(gameState.players).forEach((id) => {
            events.shuffleDeck(gameState, id);
            if (gameState.playing === id) {
                events.drawDeck(gameState, id, 3);
            } else {
                events.drawDeck(gameState, id, 5);
            }
        });
    }

};