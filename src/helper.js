/**
 * Shuffle an array in place
 * @param {[]} array
 */
function shuffle(array) {
	let counter = array.length;
	while (counter > 0) {
		let index = Math.floor(Math.random() * counter);
		counter--;
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
}

/**
 * Shuffle and return a copy of an array
 * @param {[]} array
 * @returns {[]}
 */
function shuffleCopy(array) {
	let copy = array.slice();
	this.shuffle(copy);
	return copy;
}

module.exports = {
	shuffle,
	shuffleCopy
};
