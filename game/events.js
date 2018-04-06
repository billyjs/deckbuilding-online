// common events that can occur to a gameState

module.exports = {
    discardHand(player, index, gameState) {
        let card = gameState.players[player].hand[index];
        gameState.players[player].hand.splice(index, 1);
        gameState.players[player].discard.push(card);
    },

    discardHand(gameState, player) {
        gameState.players[player].discard.push(...gameState.players[player].hand);
        gameState.players[player].hand = [];
    },

    discardInPlay(gameState, player) {
        gameState.players[player].discard.push(...gameState.players[player].inPlay);
        gameState.players[player].inPlay = [];
    },

    playHand(gameState, player, index) {
        gameState.players[player].hand[index].onPlay(gameState);
        gameState.players[player].inPlay.push(...gameState.players[player].hand.splice(index, 1));
    },

    drawDeck(gameState, player, amount) {
        // draw cards from deck
        let cards = gameState.players[player].deck.splice(0, amount);

        // add to hand
        gameState.players[player].hand.push(...cards);

        // if couldn't draw all cards and cards in discard pile
        // refresh the deck and draw the rest
        if (cards.length < amount && gameState.players[player].discard.length > 0) {
            this.refreshDeck(gameState, player);
            this.drawDeck(gameState, player, amount - cards.length);
        }

    },

    nextPhase(gameState, phases) {
        let newTurn = false;
        let index = phases.indexOf(gameState.phase);
        index += 1;
        // if end of turn
        if (index >= phases.length) {
            index = 0;
            this.nextTurn(gameState);
            newTurn = true;
        }
        gameState.phase = phases[index];

        // for each card in players hand
        Object.keys(gameState.players).forEach((player) => {
            let p = gameState.players[player];
            p.hand.forEach((card, index) => {
                card.onPhaseStart(gameState, 'hand', index);
            });
            p.hand = p.hand.filter((card) => { return (card !== null) });
            p.inPlay.forEach((card, index) => {
                card.onPhaseStart(gameState, 'inPlay', index);
            });
            p.inPlay = p.inPlay.filter((card) => { return (card !== null) });
        });
        return newTurn;
    },

    nextTurn(gameState) {
        let players = Object.keys(gameState.players);
        let index = players.indexOf(gameState.playing);
        index += 1;
        gameState.turn += 1;
        if (index >= players.length) {
            index = 0;
            console.log("Round End");
        }
        gameState.playing = players[index];
    },

    refreshDeck(gameState, player) {
        gameState.players[player].deck.push(...gameState.players[player].discard);
        this.shuffleDeck(gameState, player);
        gameState.players[player].discard = [];
    },

    shuffleDeck(gameState, player) {
        let deck = gameState.players[player].deck;
        let counter = deck.length;
        while (counter > 0) {
            let index = Math.floor(Math.random() * counter);
            counter--;
            let temp = deck[counter];
            deck[counter] = deck[index];
            deck[index] = temp;
        }
    },

    updateCounter: function(gameState, player, counter, value) {
        gameState.players[player][counter] += value;
    },

    gameOver: function(gameState, winner) {
        gameState.phase = "gameOver";
        gameState.playing = null;
        gameState.winner = winner;
    }

};