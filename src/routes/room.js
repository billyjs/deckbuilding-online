const express = require("express");
const router = express.Router();

router.get("/:room", function(req, res) {
	res.render("room", { room: req.params.room });
});

module.exports = router;
