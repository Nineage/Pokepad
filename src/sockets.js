'use strict';
/**
 * sockets
 * @license MIT license
 */

const parser = require('./chat-parser');
const randPoke = require('./data/randpoke.js');
const labels = ["1st","2nd","3rd","4th","5th","6th"];

var lastUpdate = [];

/**
 * escapeHTMLx
 * Prevents input from being parsed as HTML.
 * @param {String} str
 */
const escapeHTML = function (str) {
	if (!str) return '';
	return ('' + str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');
};

/**
 * parseName
 * Cleans up usernames and checks for validity.
 * @param {String} name
 */
const parseName = function (name) {
	let cleanName = escapeHTML(name).trim();
	if (!cleanName || cleanName.length < 1) return("Pikachu");
	if (cleanName.length > 19) return (cleanName.substr(0, 19));
	return cleanName;
};

/**
 * toId
 * Converts a string into an id
 * @param {String} text
 */
global.toId = function(text) {
    if (text && text.id) {
        text = text.id;
    } else if (text && text.userid) {
        text = text.userid;
    }
    if (typeof text !== 'string' && typeof text !== 'number') return '';
    return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const checkSubmission = function (element, index, data, opts) {
	let args = {"element": element, "index": index, "data": data, "opts": opts};
	let throttle = 0;
	for (let i in args) {
		if (lastUpdate.hasOwnProperty(i) && args[i] === lastUpdate[i]) throttle++;
	}
	if (throttle > 2) return true; //too similar
	return false;
}

const checkStats = function (obj, iv) {
	let stats = ["hp", "atk", "def", "spa", "spd", "spe"];
	for (let i in obj) {
		let index = stats.indexOf(i);
		if (!~index) return false;
		if (typeof obj[i] !== "number") return false;
		stats.splice(index, 1);
	}
	for (let j = 0; j < stats.length; j++) {
		obj[stats[j]] = (iv ? 31 : 0);
	}
	return obj;
};

const sanitizeSet = function (index, data, pokemon) {
	//Make sure we've been sent good data
	if (pokemon && typeof pokemon !== "string") return false;
	if (!data.hasOwnProperty('ivs')) data.ivs = {};
	if (!data.hasOwnProperty('item') || !data.hasOwnProperty('ability') || !data.hasOwnProperty('nature')) return false;
	if (!data.hasOwnProperty('evs') || !data.hasOwnProperty('moves')) return false;
	if (typeof data.item !== "string" || typeof data.ability !== "string" || typeof data.nature !== "string") return false;
	if (typeof data.evs !== "object" || typeof data.ivs !== "object" || !Array.isArray(data.moves)) return false;
	if (data.moves.length < 1 || data.moves.length > 4) return false;

	//Create safe ev and iv objects for storage
	let evs = checkStats(data.evs);
	let ivs = checkStats(data.ivs, true);
	if (!evs || !ivs) return false;

	if (pokemon) data["pokemon"] = pokemon;
	data["evs"] = evs;
	data["ivs"] = ivs;
	
	return data;
};

module.exports = function (io) {
	io.on("connection", socket => {
		let pokemon = randPoke();
		socket.name = "Anonymous " + pokemon;
		socket.edit = false;

		socket.on('load', room => {
			let data = Rooms.get(room);
			socket.edit = true;

			socket.join(room);
			socket.room = room;
			
			socket.emit('load chat', Rooms.getChat(room));
			socket.emit('load team', Rooms.getTeam(room));
			
			let message = socket.name + ' has joined.';
			io.sockets.in(room).emit('server message', message);
			Rooms.updateChat(room, null, message);
		});

		socket.on('chat message', message => {
			if (typeof message !== 'string' || message.length < 1) return;
			
			let parsedMessage = parser.parseMessage(message);
			io.sockets.in(socket.room).emit('chat message', socket.name, parsedMessage);
			Rooms.updateChat(socket.room, socket.name, parsedMessage);
		});
		
		socket.on('name chosen', (name) => {
			name = parseName(name);
			let oldName = socket.name;
			
			socket.name = name;
			socket.emit('name change');
			
			let msg = oldName + ' is now known as ' + name + '.';
			io.sockets.in(socket.room).emit('server message', msg);
			Rooms.updateChat(socket.room, false, msg);
		});
		
		socket.on('change mon', (index, newMon) => {
			let args = [index, newMon].join("/");
			if (lastUpdate === args) return; // Prevents double selection on bad browsers
			lastUpdate = args;
			
			if (isNaN(index) || index < 0 || index > 5) return;
			let team = Rooms.updateTeam(socket.room, 'pokemon', index, newMon, null);
			io.sockets.in(socket.room).emit('update pokemon', team, index); 
			
			let msg = socket.name + " changed the " + labels[index] +
				" Pokemon to " + newMon;
			io.sockets.in(socket.room).emit('server message', msg);
			Rooms.updateChat(socket.room, false, msg);
		});
		
		// Does NOT! handle Pokemon changes
		// Does not handle importables
		socket.on('team update', (element, index, data, opts) => {
			let throttle = checkSubmission(element, index, data, opts);
			if (throttle) return;

			let oldElement = element;
			element += "s";
			element = element.replace("ys", "ies");
			
			if (!~["items", "abilities", "shiny", "levels", "moves", "evs", "ivs", "natures", "shinies"].indexOf(element)) {
				return;
			}
			
			if (isNaN(index) || index < 0 || index > 5) return;
			if (typeof data !== "string" && typeof data !== "boolean" && element !== "shinies") return;
			
			let innerIndex;
			let innerWord = ""; //the way we describe the inner index in the return message
			if (element === "moves") {
				if (isNaN(opts.move) || opts.move < 1 || opts.move > 4) return;
				innerIndex = opts.move - 1;
				innerWord = ["first", "second", "third", "fourth"][innerIndex] + " ";
			}
			if (element === "evs" || element === "ivs") {
				if (!~["hp","atk","def","spa","spd","spe"].indexOf(opts.stat)) return;
				innerIndex = opts.stat;
				innerWord = {"hp": "HP", "atk": "Attack", "def": "Defense", "spa": "Special Attack", "spd": "Special Defense", "spe": "Speed"}[innerIndex] + " ";
			}
			
			let team = Rooms.updateTeam(socket.room, element, index, data, innerIndex);
			if (!team) return;
			io.sockets.in(socket.room).emit('update team', team, index);
			
			let msg = socket.name + ' changed ' + team["pokemon"][index] + '\'s ' + 
				innerWord + (oldElement.length < 3 ? oldElement.toUpperCase() : oldElement) + 
				' to ' + data + '.';
			io.sockets.in(socket.room).emit('server message', msg);
			Rooms.updateChat(socket.room, false, msg);
		});
		
		socket.on('import set', (index, data, pokemon, smogName) => {
			let cleanSet = sanitizeSet(index, data, pokemon);
			if (!cleanSet) return false;

			let team = Rooms.replaceSet(socket.room, index, data);
			io.sockets.in(socket.room).emit('update pokemon', team, index);
			
			let msg = socket.name + ' changed the ' + labels[index] +
				" set to " + (smogName ? " the Smogon set '" + pokemon + ": " + smogName + "'": " a custom set") + ".";
			io.sockets.in(socket.room).emit('server message', msg);
			Rooms.updateChat(socket.room, false, msg);
		});
		
		socket.on('disconnect', () => {
			let message = socket.name + ' has left.';
			io.sockets.in(socket.room).emit('server message', message);
			Rooms.updateChat(socket.room, null, message);
		});
	});
};