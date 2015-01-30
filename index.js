// make it easy to load modules relative to root directory
global.rootRequire = function(name) {
	return require(__dirname + "/" + name);
}

// create our express app
var express = require("express");
var app = express();

// serve static content from "public" folder
app.use(express.static(__dirname + "/public"));

// start listening
app.listen(rootRequire("config").port);
