var express = require('express');
var router = express.Router();

/* GET the page */
router.get('/', function(req, res, next) {
    res.render('fullcanvas', { title: 'Grow', script: "grow" });
});

module.exports = router;
