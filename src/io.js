module.exports = (io, gameManager) => {
	io.on("connection", socket => {
		socket.on("disconnecting", () => {
			let rooms = Object.keys(socket.rooms);
			let name = socket.nickname ? socket.nickname : socket.id;
			rooms.forEach(room => {
				if (room !== socket.id) {
					socket.to(room).broadcast.emit("message", name + ": has left");
				}
			});
		});
		socket.on("message", (message, room) => {
			let name = socket.nickname ? socket.nickname : socket.id;
			let s = room ? socket.to(room) : socket;
			s.broadcast.emit("message", name + ": " + message);
		});
		socket.on("join", room => {
			roomFull(io, room, full => {
				if (full) {
					socket.emit("full");
				} else {
					// join the room
					socket.join(room, () => {
						// send message to client that they joined the room
						socket.emit("message", "YOU have joined " + room);
						socket.room = room;
						sendPlayerList(io, room);
						roomFull(io, room, full => {
							if (full) {
								io.in(room).clients((error, clients) => {
									if (error) throw error;
									gameManager.newGame(
										io,
										room,
										clients,
										require("./starRealms/rules")
									);
								});
							}
						});
					});
				}
			});
		});
		socket.on("loaded", () => {
			let game = gameManager.getGame(socket.game);
			if (game.running) {
				socket.loaded = true;
				game.onPlayerLoaded(socket);
			}
		});
		socket.on("responseAction", action => {
			let game = gameManager.getGame(socket.game);
			if (game) {
				game.handleAction(action);
			}
		});
		socket.on("responseDecision", choice => {
			let game = gameManager.getGame(socket.game);
			if (game) {
				game.handleDecision(choice);
			}
		});
		socket.on("nickname", nickname => {
			socket.nickname = nickname;
			Object.keys(socket.rooms).forEach(room => {
				if (room !== socket.id) {
					sendPlayerList(io, room);
				}
			});
		});
		socket.on("newGame", request => {
			if (request.name && typeof request.name === "string") {
				let game = gameManager.newGame(io, request.game);
				if (game) {
					let added = game.addPlayer(request.name, socket);
					if (added) {
						socket.emit("responseJoin", {
							gameId: game.gameId,
							game: game.name,
							success: true,
							admin: true
						});
					} else {
						socket.emit("responseJoin", {
							gameId: game.gameId,
							success: false,
							message: "Game is full"
						});
					}
				} else {
					socket.emit("responseJoin", {
						gameId: null,
						success: false,
						message: "Game is not supported"
					});
				}
			} else {
				socket.emit("responseJoin", {
					gameId: null,
					success: false,
					message: "Name must not be empty"
				});
			}
		});
		socket.on("joinGame", request => {
			let gameId = request.gameId.toUpperCase();
			let game = gameManager.getGame(gameId);
			if (!request.name || typeof request.name !== "string") {
				socket.emit("responseJoin", {
					gameId: gameId,
					success: false,
					message: "Name must not be empty"
				});
			} else if (!game) {
				socket.emit("responseJoin", {
					gameId: gameId,
					success: false,
					message: "Game does not exist"
				});
			} else if (game.running) {
				socket.emit("responseJoin", {
					gameId: gameId,
					success: false,
					message: "Game is already running"
				});
			} else {
				let added = game.addPlayer(request.name, socket);
				if (added) {
					socket.emit("responseJoin", {
						gameId: gameId,
						game: game.name,
						success: true
					});
				} else {
					socket.emit("responseJoin", {
						gameId: gameId,
						success: false,
						message: "Game is full"
					});
				}
			}
		});
		socket.on("startGame", request => {
			let gameId = request.gameId.toUpperCase();
			let game = gameManager.getGame(gameId);
			if (!game) {
				socket.emit("responseStart", {
					gameId: gameId,
					success: false,
					message: "Game does not exist"
				});
			} else {
				let error = game.startGame(socket);
				if (error) {
					socket.emit("responseStart", {
						gameId: gameId,
						success: false,
						message: error.message || "Unable to start game"
					});
				} else {
					io.to(gameId).emit("responseStart", {
						gameId: gameId,
						success: true
					});
				}
			}
		});
	});
};

function sendPlayerList(io, room) {
	// send message to all clients in the room the player list
	io.in(room).clients((error, clients) => {
		if (error) throw error;
		io.to(room).emit(
			"players",
			clients.map(client => {
				return io.sockets.connected[client].nickname
					? io.sockets.connected[client].nickname
					: client;
			})
		);
	});
}

function roomFull(io, room, cb) {
	io.to(room).clients((error, clients) => {
		cb(clients.length === 2);
	});
}
