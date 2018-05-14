module.exports = (io, gameManager) => {
    io.on('connection', (socket) => {

        socket.on('disconnecting', () => {
            let rooms = Object.keys(socket.rooms);
            let name = (socket.nickname) ? socket.nickname : socket.id;
            console.log(name + " disconnected | " + rooms);
            rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.to(room).broadcast.emit('message', name + ": has left");
                }
            });
        });
        socket.on('message', (message, room) => {
            let name = (socket.nickname) ? socket.nickname : socket.id;
            let s = (room) ? socket.to(room) : socket;
            s.broadcast.emit('message', name + ": " + message);
        });
        socket.on('join', (room) => {
            roomFull(io, room, (full) => {
                if (full) {
                    socket.emit('full');
                } else {
                    // join the room
                    socket.join(room, () => {
                        // send message to client that they joined the room
                        socket.emit("message", "YOU have joined " + room);
                        socket.room = room;
                        sendPlayerList(io, room);
                        roomFull(io, room, (full) => {
                            if (full) {
                                io.in(room).clients((error, clients) => {
                                    if (error) throw error;
                                    gameManager.newGame(io, room, clients, require('./starRealms/rules'));
                                });

                            }
                        });

                    });
                }
            });
        });
        socket.on('responseAction', (action) => {
            if (socket.room) {
                gameManager.getGame(socket.room).handleAction(action);
            }
        });
        socket.on('responseDecision', (choice) => {
            if (socket.room) {
                gameManager.getGame(socket.room).handleDecision(choice);
            }
        });
        socket.on('nickname', (nickname) => {
            socket.nickname = nickname;
            Object.keys(socket.rooms).forEach((room) => {
                if (room !== socket.id) {
                    sendPlayerList(io, room);
                }
            });
        })
    })
};

function sendPlayerList(io, room) {
    // send message to all clients in the room the player list
    io.in(room).clients((error, clients) => {
        if (error) throw error;
        io.to(room).emit("players", clients.map((client) => {
            return (io.sockets.connected[client].nickname) ? io.sockets.connected[client].nickname : client;
        }));
    });
}

function roomFull(io, room, cb) {
    io.to(room).clients((error, clients) => {
        cb(clients.length === 2);
    });
}