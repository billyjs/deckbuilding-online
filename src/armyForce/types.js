const Card = require("../game/card");

function calcArmyPower(player, thisCard) {
    let allCards = [...player.deck, ...player.discard, ...player.hand, ...player.inPlay, thisCard || {}];
    let civilian = 0;
    let soldier = 0;
    let sniper = 0;
    let hitman = 0;
    let recruiter = 0;
    let spy = 0;
    let traitor = 0;
    let reily = 0;
    allCards.forEach(card => {
        switch (card.name) {
            case "Civilian":
                civilian++;
                break;
            case "Soldier":
                soldier++;
                break;
            case "Sniper":
                sniper++;
                break;
            case "Hitman":
                hitman++;
                break;
            case "Recruiter":
                recruiter++;
                break;
            case "Spy":
                spy++;
                break;
            case "Traitor":
                traitor++;
                break;
            case "CommanderReily":
                reily++;
                break;
            default:
                break;
        }
    });
    console.log(reily, traitor, soldier, spy, recruiter, hitman, sniper);
    return (20 * reily) + (-1 * traitor) + (Math.pow(soldier, 2)) + (6 * spy) + (4 * recruiter) + (4 * hitman) + (4 * sniper) + (Math.min(sniper, civilian));
}

class Commander extends Card {
	constructor() {
		super();
		this.types.add("commander");
	}
	onPlay() {}
	onPhaseStart(gameState, location) {
		switch (gameState.phase) {
			case "commander":
				if (location === "inPlay") {
					this.increaseInfluence(gameState);
					this.onActivate(gameState, { ability: "primary" });
				}
				break;
			case "discard":
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	increaseInfluence(gameState) {
		gameState.getPlaying().updateCounter("influence", 2);
	}
	onOtherPlay() {
		// TODO
	}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
}

class Action extends Card {
	constructor() {
		super();
		this.types.add("action");
	}
	onPlay(gameState) {
		gameState.getPlaying().updateCounter("actionPoints", -1);
		if (this.isAvailable("primary")) {
			this.onActivate(gameState, { ability: "primary" });
		}
	}
	onPhaseStart(gameState, location, index) {
		switch (gameState.phase) {
			case "discard":
				if (["hand", "inPlay"].indexOf(location) !== -1) {
					// TODO: function in player to do this
					gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
					gameState.getPlaying()[location][index] = null;
				}
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onAcquire() {}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {
		// TODO
	}
}

class Personnel extends Card {
	constructor() {
		super();
		this.types.add("personnel");
	}
	onPlay(gameState) {
		if (this.isAvailable("primary")) {
			this.onActivate(gameState, { ability: "primary" });
		}
	}
	onPhaseStart(gameState, location, index) {
		switch (gameState.phase) {
			case "discard":
				if (["hand", "inPlay"].indexOf(location) !== -1) {
					// TODO: function in player to do this
					gameState.getPlaying().discard.push(gameState.getPlaying()[location][index]);
					gameState.getPlaying()[location][index] = null;
				}
				this.resetCounters();
				break;
			default:
				break;
		}
	}
	onAcquire(gameState) {
		gameState.getPlaying().setCounter("armyPower", calcArmyPower(gameState.getPlaying(), this));
	}
	resetCounters() {
		if (this.abilities.primary) {
			this.abilities.primary.available = true;
			this.abilities.primary.used = false;
		}
	}
	onOtherPlay(gameState, other) {
		// TODO
	}
}

module.exports = {
	Commander,
	Personnel,
	Action,
	calcArmyPower
};
