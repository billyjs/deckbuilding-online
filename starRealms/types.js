const Card = require('../game/card');

module.exports = {
    Ship: class Ship extends Card {
        constructor(player) {
            super(player);
        }

        onPhaseStart(gameState) {

        }
    },

    Base: class Base extends Card {
        constructor(player) {
            super(player);
        }
    },

    Outpost: class Outpost extends this.Base {
        constructor(player) {
            super(player);
        }
    }

 };