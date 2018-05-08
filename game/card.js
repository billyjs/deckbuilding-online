module.exports =  class Card {
    constructor(player) {
        this.player = player;
        // this.location = location;
        this.types = new Set(["card"]);
        this.name = "Base Card";
        this.value = 0;
    }

    getName() {
        return this.name;
    }

    setLocation(location) {
        this.location = location;
    }

    getLocation() {
        return this.location;
    }

    availableAbilities() {
        return [];
    }

    // abstract functions
    onPlay(gameState) {
        throw new Error("Abstract function Card.onPlay used");
    }
    onOtherPlayed(other, gameState) {
        throw new Error("Abstract function Card.onOtherPlay used");
    }
    onActivated(ability, gameState) {
        throw new Error("Abstract function Card.onOtherPlay used");
    }
    onPhaseStart(gameState, phase) {
        throw new Error("Abstract function Card.onPhaseStart used");
    }
    onAcquired(gameState) {
        throw new Error("Abstract function Card.onAcquired used");
    }
    onDestroyed(gameState) {
        throw new Error("Abstract function Card.onDestroyed used");
    }
};