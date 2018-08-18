/** Class representing a Base Card from which individual cards extend */
module.exports = class Card {
	/** Create a base card */
	constructor() {
		this.types = new Set(["card"]);
		this.name = "Base Card";
		this.value = 0;
		this.cost = 0;
		this.abilities = {};
	}

	/**
	 * Check if the ability can be used
	 * @param {string} ability
	 * @returns {boolean}
	 */
	isAvailable(ability) {
		return (
			this.abilities.hasOwnProperty(ability) &&
			this.abilities[ability].available === true &&
			this.abilities[ability].used === false &&
			typeof this.abilities[ability].func === "function"
		);
	}

	/**
	 * Get the abilities that this card can currently activate
	 * @returns {Array}
	 */
	availableAbilities() {
		let abilities = [];

		Object.keys(this.abilities).forEach(ability => {
			// check is the ability is available
			if (this.isAvailable(ability)) {
				abilities.push(ability);
			}
		});

		return abilities;
	}

	/**
	 * Add an ability to the card
	 * @param {string} ability
	 * @param {function} func
	 * @param {boolean} [available=true]
	 * @param {boolean} [used=false]
	 * @returns {boolean}
	 */
	addAbility(ability, func, available = true, used = false) {
		// check that ability doesn't already exist and that func is a function
		if (this.abilities.hasOwnProperty(ability) || typeof func !== "function") {
			return false;
		}

		this.abilities[ability] = { available, used, func };
		return true;
	}

	/**
	 * If the ability is available run the ability's function and set it to used
	 * @param {object} gameState
	 * @param {object} action
	 * @param {string} action.ability
	 * @returns {boolean}
	 */
	onActivate(gameState, action) {
		// check if the ability in the action is available
		if (action && this.isAvailable(action.ability)) {
			// run the ability's function
			this.abilities[action.ability].func(gameState, action);

			// set the ability to be used
			this.abilities[action.ability].used = true;

			return true;
		}
		return false;
	}

	/**
	 * @abstract
	 * @param gameState
	 */
	onPlay(gameState) {
		throw new Error("Card.onPlay() must be implemented by subclass");
	}

	/**
	 * @abstract
	 * @param gameState
	 * @param other
	 */
	onOtherPlay(gameState, other) {
		throw new Error("Card.onOtherPlay() must be implemented by subclass");
	}

	/**
	 * @abstract
	 * @param gameState
	 * @param location
	 * @param index
	 */
	onPhaseStart(gameState, location, index) {
		throw new Error("Card.onPhaseStart() must be implemented by subclass");
	}

	/**
	 * @abstract
	 * @param gameState
	 */
	onAcquire(gameState) {
		throw new Error("Card.onAcquire() must be implemented by subclass");
	}

	/**
	 * @abstract
	 * @param gameState
	 */
	onDestroy(gameState) {
		throw new Error("Card.onDestroy() must be implemented by subclass");
	}
};
