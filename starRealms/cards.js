const types = require('./types');

module.exports = {
    Test: class Test extends types.Ship {
        constructor(player) {
            super(player);
        }
    }
};
