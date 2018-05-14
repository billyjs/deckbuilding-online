// common events that can occur to a gameState
const helper = require("../helper");

module.exports = {
    discardHand(gameState, player, index) {
        console.log(player + " : " + index);
        let card = gameState.players[player].hand[index];
        gameState.players[player].hand.splice(index, 1);
        gameState.players[player].discard.push(card);
    },

    // discardHand(gameState, player) {
    //     gameState.players[player].discard.push(...gameState.players[player].hand);
    //     gameState.players[player].hand = [];
    // },

    discardInPlay(gameState, player) {
        gameState.players[player].discard.push(...gameState.players[player].inPlay);
        gameState.players[player].inPlay = [];
    },

    discardInPlay(gameState, player, index) {
        gameState.players[player].discard.push(...gameState.players[player].inPlay.splice(index, 1));
    },

    playHand(gameState, player, index) {
        // card onPlay
        let playedCard =  gameState.players[player].hand[index];
        playedCard.onPlay(gameState);

        // all inPlay _cards onOtherPlay
        gameState.players[player].inPlay.forEach((card) => {
            card.onOtherPlay(gameState, playedCard);
        });

        // move card from hand to in play
        gameState.players[player].inPlay.push(...gameState.players[player].hand.splice(index, 1));
    },

    drawDeck(gameState, player, amount) {
        // draw _cards from deck
        let cards = gameState.players[player].deck.splice(0, amount);

        // add to hand
        gameState.players[player].hand.push(...cards);

        // if couldn't draw all _cards and _cards in discard pile
        // refresh the deck and draw the rest
        if (cards.length < amount && gameState.players[player].discard.length > 0) {
            this.refreshDeck(gameState, player);
            this.drawDeck(gameState, player, amount - cards.length);
        }

    },

    activateAbility(gameState, player, index, ability) {
        gameState.players[player].inPlay[index].onActivate(gameState, ability);
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
        helper.shuffle(gameState.players[player].deck);
    },

    updateCounter: function(gameState, player, counter, value) {
        gameState.players[player][counter] += value;
    },

    setCounter: function(gameState, player, counter, value) {
        gameState.players[player][counter] = value;
    },

    gameOver: function(gameState, winner) {
        gameState.phase = "gameOver";
        gameState.playing = null;
        gameState.winner = winner;
    },

    /**
     * Combat Events
     */

    attackCard: function(gameState, targetPlayer, targetIndex) {
        gameState.players[targetPlayer].inPlay[targetIndex].onDestroyed(gameState);
        this.discardInPlay(gameState, targetPlayer, targetIndex);
    },

    /**
     * Decision Events
     */
    addDecision: function(gameState, player, choices, callback) {
        console.log("ADDED DECISION PLAYER: " + player);
        gameState.decision = true;
        gameState.deciding = player;
        gameState._decisionCallback = callback;
        gameState._choices = choices;
    },



    /**
     * Get card from a location
     */

    fromShopRow: function(gameState, cards, player, row, index) {
        // shop _cards are not instantiated so must be created when acquired
        let cardName = gameState.shop[row].row[index];
        let card = new cards[cardName](player);

        // replace the card in the row with the top of the deck
        gameState.shop[row].row[index] = gameState.shop[row].deck.shift();

        return card;
    },

    fromShopPile: function(gameState, cards, player, pile) {
        // shop _cards are not instantiated so must be created when acquired
        let cardName = gameState.shop[pile].cardName;
        let card = new cards[cardName](player);

        // decrement pile counter
        gameState.shop[pile].amount--;

        return card;
    },

    /**
     * Put a card in a location
     */

    toPlayerLocation: function(gameState, player, location, card) {
        gameState.players[player][location].push(card);
    },

    toHand: function(gameState, player, card) {
        gameState.players[player].hand.push(card);
    },

    toDiscard: function(gameState, player, card) {
        gameState.players[player].discard.push(card);
    }

};