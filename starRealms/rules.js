const events = require('../game/events');

module.exports = {

    phases: ['main', 'discard', 'draw'],

    getStartingState: function(players) {
        let state = {
            phase: this.phases[0], // current phase
            playing: players[0], // current player TODO: choose first player better
            players: {},
            shop: {
                explorers: 10, // int count of explorers remaining
                tradeRow: [null, null, null, null, null], // array of card names in trade row
                tradeDeck: this.startingTradeDeck() // array of card names in trade deck
            }
        };
        players.forEach((player) => {
            state.players[player] = {
                hand: [], // array of instantiated cards in hand
                inPlay: [], // array of instantiated cards in play
                discard: [], // array of card names in discard
                deck: this.startingDeck(), // array of card names in deck
                authority: 50, // int count of authority remaining
                trade: 0,
                combat: 0
            }
        });
        this.replaceTradeRow(state);
        this.startingHands(state);
        return state;
    },

    makeActions: function(gameState) {
        let actions = [];
        switch (gameState.phase) {
            case "main":
                actions += this.playActions(gameState);
                break;
            case "discard":
                break;
            case "draw":
                break;
            default:
                console.log("Error: invalid phase");
        }
        return actions;
    },

    // apply action to gameState
    applyAction: function(action, gameState) {
        switch (action.action) {
            case "play":
                this.applyPlay(action, gameState);
                break;
            default:
                console.log("Error: invalid action");
        }
    },

    // returns a censored gameState for a player. NOTE: does not modify gameState
    censorGameState: function(player, gameState) {
        let gs = JSON.parse(JSON.stringify(gameState)); // deep copy of gameState
        gs.shop.tradeDeck = gs.shop.tradeDeck.length;
        Object.keys(gs.players).forEach((id) => {
            let p = gs.players[id];
            p.deck = p.deck.length;
            if (player !== id) {
                p.hand = p.hand.length;
            }
        });
        return gs;
    },

    // returns a boolean of if game is over.
    endCheck: function(gameState) {
        let alive = [];
        Object.keys(gameState.players).forEach((player) => {
            if (gameState.players[player].authority > 0) {
                alive.push(player);
            }
        });
        return alive.length === 1;
    },


    /*
     ======================= Helpers =======================
     */

    applyPlay: function(action, gameState) {
        // events.playHand(gameState.)
    },

    playActions: function(gameState) {
        let actions = [];
        gameState.players[gameState.playing].hand.forEach((card, index) => {
            actions.push({ action: "play", card: card, index: index });
        });
        return actions;
    },

    startingDeck: function() {
        let deck = [];
        for (let i = 0; i < 8; i++) {
            // deck.push('scout');
            deck.push('Test');
        }
        for (let i = 0; i < 2; i++) {
            // deck.push('viper');
            deck.push('Test');
        }
        return deck;
    },

    startingTradeDeck: function() {
        let deck = [];
        for(let i = 0; i < 10; i++) {
            deck.push('Test');
        }
        return deck;
    },

    startingHands: function(gameState) {
        Object.keys(gameState.players).forEach((id) => {
            let player = gameState.players[id];
            if (gameState.playing === id) {
                player.hand = this.drawDeck(3, id, gameState);
            } else {
                player.hand = this.drawDeck(5, id, gameState);
            }
        });
    },

    drawDeck: function(amount, player, gameState) {
        return gameState.players[player].deck.splice(0, amount);
    },

    // return top of trade deck and modify trade deck in place
    drawTradeDeck: function(gameState) {
        return gameState.shop.tradeDeck.shift();
    },

    // modify trade row in place to fill missing cards
    replaceTradeRow: function(gameState) {
        gameState.shop.tradeRow = gameState.shop.tradeRow.map((card) => {
            return (card === null) ? this.drawTradeDeck(gameState): card;
        });
    }



};