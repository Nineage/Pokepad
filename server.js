'use strict';

/* Begin by configuring variables */
const express = require('express');
const app = express();
const http = require('http').Server(app);
const compression = require('compression');
const helmet = require('helmet');
const chalk = require('chalk');
const RoomList = require('./src/RoomList.js');
const winston = require('winston');
const port = process.env.PORT || 3000;

/* Set up express middleware before launch */
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.use(compression());
app.use(helmet({noSniff: false}));
app.use(express.static(__dirname + '/public'));


/* Set up our routes (found in src/router.js) */
app.use('/', require('./src/router'));

/* handle 400 errors */
app.use(function(req, res) {
	res.status(400);
	res.render('400');
});

/* handle 500 errors */
app.use(function(error, req, res, next) {
	res.status(500);
	res.render('500');
});

/* Set up our RoomList */
global.Rooms = new RoomList();

/* Set up our sockets (found in src/sockets.js) */
const io = require('socket.io')(http);
require('./src/sockets')(io);

/* Finally, start listening */
http.listen(port, error => {
	if (error) winston.error(error);
	winston.info("Now listening on port " + chalk.green(port));
});