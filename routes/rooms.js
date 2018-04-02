var express = require('express');
var router = express.Router();

var rooms = [
        {name: "Test1", description: "Star Realms 2 Player", id: "a123", players: 2, playing: 1},
        {name: "Room2", description: "Dominion 4 Player", id: "qwertyuio",  players: 4, playing: 3, viewers: 10}
    ];

var ids = ["a123", "qwertyuio"];

router.get('/', function(req, res, next) {
    res.render('rooms/index', { rooms: rooms });
});

router.get('/create', function(req, res, next) {
    res.render('rooms/create');
});

router.post('/create', function(req, res, next) {
    if (validateRoom(req.body)) {
        rooms.push({
            name: req.body.name,
            description: req.body.desc,
            id: req.body.name,
            players: req.body.players,
            playing: 0,
            viewers: 0
        });
        ids.push(req.body.name);
        res.redirect("/rooms");
    } else {
        res.send({
            error: "invalid room settings"
        });
    }
});

function validateRoom(room) {
    if (!room.name || !room.desc || !room.players) {
        return false;
    }
    if (ids.includes(room.name)) {
        return false;
    }
    if (room.players < 0 || room.players > 2) {
        return false;
    }
    return true;
}

module.exports = router;
