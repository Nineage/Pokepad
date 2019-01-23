'use strict';
/**
 * router
 * @license MIT license
 */

const express = require('express');
const Router = module.exports = express.Router();

/**
 * Routes to index
*/
Router.route('/').get((req, res) => {
	res.render('index');
});

/**
 * Route to create a new room
*/
Router.route('/create').get((req, res) => {
	let id = Rooms.create();
	res.redirect('/build/' + id);
});

/**
 * Routes to a build room
*/
Router.route('/build/:id').get((req, res) => {
	if (Rooms.get(req.path.substring(7))) {
		res.render('builder');
	} else {
		res.status(404);
		res.render('400');
	}
});

/**
 * Routes to a view room
*/
Router.route('/view/:id').get((req, res) => {
	if (Rooms.get(req.path.substring(6)), true) {
		res.send('This will be the landing page for the viewer.');
	} else {
		res.status(404);
		res.render('400');
	}
});