module.exports = class Game {
    constructor(io, gameId, socketIds, rules) {
        this.io = io;
        this.rules = rules;
        this.gameId = gameId;
        this.socketIds = socketIds;
        this.gameState = null;
        this.running = false;

        // current valid actions
        this.actions = [];

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

        // gameState.decision = true;
        // gameState.decisionCallback = callback;
        // gameState.choices = choices;
        this.actions = this.rules.makeActions(this.gameState);

        switch(this.actions.length) {
            case 0:
                break;
            case 1:
                this.handleAction(this.actions[0]);
                break;
            default:
                this.io.sockets.connected[this.gameState.playing].emit('requestAction', JSON.stringify(this.actions));
                break;
        }
    }

    handleAction(action) {
        // TODO: Validate action is correct player and valid action

        let log = this.rules.applyAction(this.gameState, action);
        this.all().emit('log', 'Action: ' + log);
        this.next();

    }

    requestDecision() {
        this.sendGameState();
        let choices = this.gameState.choices;
        switch(choices.length) {
            case 0:
                break;
            case 1:
                this.handleDecision(choices[0]);
                break;
            default:
                this.io.sockets.connected[this.gameState.deciding].emit('requestDecision', JSON.stringify(choices));
                break;
        }
    }

    handleDecision(choice) {
        // TODO: validate decision

        this.gameState.decisionCallback(choice.value);
        this.all().emit('log', 'Decision: ' + choice.name);

        this.next();

    }

    next() {
        if (this.gameState.phase !== "gameOver") {
            if (this.gameState.decision) {
                this.requestDecision();
                this.gameState.decision = false;
            } else {
                this.requestAction();
            }
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
