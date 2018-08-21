const types = require("./types");

const cards = {
	CommanderBernard: class CommanderBernard extends types.Commander {
		constructor() {
			super();
			this.name = "CommanderBernard";
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("influence", 2);
		}
	},

	ImpressiveAction: class ImpressiveAction extends types.Action {
		constructor() {
			super();
			this.name = "ImpressiveAction";
			this.cost = 1;
			this.addAbility("primary", this.primaryAbility);
		}
		primaryAbility(gameState) {
			gameState.getPlaying().updateCounter("influence", 2);
		}
	},

	Civilian: class Civilian extends types.Personnel {
		constructor() {
			super();
			this.name = "Civilian";
			this.cost = 1;
		}
	}
};

module.exports = {
	...cards
};
