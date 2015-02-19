var express = require("express");
var router = express.Router();

/* GET the page */
router.get("/", function(req, res) {
    res.render("fullcanvas", { title: "Grow", script: "Grow" });
});

module.exports = router;
