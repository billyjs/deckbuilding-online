module.exports = class Game {
    constructor(io, gameId, socketIds, rules) {
        this.io = io;
        this.rules = rules;
        this.gameId = gameId;
        this.socketIds = socketIds;
        this.gameState = null;
        this.running = false;

        // current valid actions
        this.actions = null;

        // bro put this last
        this.startGame();
    }

    startGame() {
        this.all().emit('log', 'Game Started');
        this.gameState = this.rules.getStartingState(this.socketIds);
        this.running = true;
        this.requestAction();
    }

    requestAction() {
        this.sendGameState();
        this.actions = this.rules.makeActions(this.gameState);
        console.log(this.actions.length);
        if (this.actions.length === 1) {
            // if only 1 action do it automatically
            this.handleAction(this.actions[0]);
        } else if (this.actions.length === 0) {
            // error if no actions available
        } else {
            // if multiple actions let player choose
            this.io.sockets.connected[this.gameState.playing].emit('requestAction', JSON.stringify(this.actions));
        }
    }

    handleAction(action) {
        // if (actions.indexOf(action) === -1) {
        //     // invalid action
        //     console.log("Invalid action: " + action);
        // } else {
        //     // do action
        //     this.running = this.rules.applyAction(this.gameState, action);
        // }
        // TODO: Validate action is correct player and valid action
        this.rules.applyAction(this.gameState, action);

        // after action is handled request a new one
        if (this.gameState.phase !== "gameOver") {
            this.requestAction();
        } else {
            this.sendGameState();
        }
    }

    sendGameState() {
        this.socketIds.forEach((socketId) => {
            this.io.to(socketId).emit('gameState', this.rules.censorGameState(this.gameState, socketId));
        })
    }

    all() {
        return this.io.to(this.gameId);
    }
};
