const events = require('./events');
const cards = require('./cards');

module.exports = {

    phases: ['play', 'discard', 'draw'],

    getStartingState: function(players) {
        let state = {
            phase: this.phases[0], // current phase
            playing: players[0], // current player TODO: choose first player better
            players: {},
            turn: 1
        };
        players.forEach((player) => {
            state.players[player] = {
                hand: [], // array of instantiated cards in hand
                inPlay: [], // array of instantiated cards in play
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
                break;
            case 'end':
                // run on phase end functionality

                // go to next phase
                let newTurn = events.nextPhase(gameState, this.phases);
                this.onPhaseStart(gameState);
                if (newTurn) {
                    this.onTurnStart(gameState);
                }
                console.log("End Phase");
                break;
            // case "draw":
            //     events.drawDeck(gameState, gameState.playing, 5);
            //     break;
            default:
                console.log("Error: invalid action")
        }
    },

    onPhaseStart: function(gameState) {
        switch(gameState.phase) {
            case "draw":
                events.drawDeck(gameState, gameState.playing, 5);
                break;
            default:
                break;
        }
    },

    onTurnStart: function(gameState) {
        let winner = this.endCheck(gameState);
        console.log("WINNER: " + winner);
        if (winner !== null) {
            console.log("Winner: " + winner);
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
        console.log("END CHECK");
        let winner = null;
        Object.keys(gameState.players).forEach((id) => {
            if (gameState.players[id].points >= 20) {
                winner = id;
            }
        });
        return winner;
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