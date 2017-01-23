"use strict";
/**
 * server
 * https://github.com/nineage/pokepad
 * @license MIT license
 */

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {path:''});
const compression = require('compression');
const helmet = require('helmet');
const port = process.env.PORT || 3000;

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/client/views');
app.use(compression());
app.use(helmet({
  noSniff: false
}));
app.use(express.static(__dirname + '/client/public'));

const Rooms = require('./rooms.js');
const movesets = require('./setdex-xy.js');

const serverData = require('./server-data.js');
const randPoke = serverData.randPoke;
const pokenames = serverData.pokenames;
const items = serverData.items;
const abilities = serverData.abilities;
const moves = serverData.moves;
const natures = serverData.natures;

const oldEv = {
	'hp': 'hp',
	'atk': 'at',
	'def': 'df',
	'spa': 'sa',
	'spd': 'sd',
	'spe': 'sp'
};

/**
 * escapeHTML
 * Prevents input from being parsed as HTML.
 * @param {String} str
 */
const escapeHTML = function (str) {
	if (!str) return '';
	return ('' + str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');
};

/**
 * position
 * Returns the move position.
 * @param {Int} moveno
 */
const position = function (moveno) {
	return ["first", "second", "third", "fourth"][moveno - 1];
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
 * removeNick
 * Clears a nick name from the panel
 * @param {String} line
 */
const removeNick = function (line) {
	let cleanline = line;
	if (~line.indexOf(' (M)')) {
		cleanline = line.substr(0, line.indexOf('(M')).trim();
	} else if (~line.indexOf(' (F)')) {
		cleanline = line.substr(0, line.indexOf('(F')).trim();
	}
	if (~cleanline.indexOf('(')) {
		//Worst code in this whole project I swear
		cleanline = cleanline.substr(cleanline.indexOf('(') + 1);
		cleanline = cleanline.substr(0, cleanline.length - 1);
	}
	return cleanline;
};

/**
 * packSet
 * Prepares a moveset for delivery to the user.
 * @param {String} moveset
 */
const packSet = function (moveset) {
	if (!moveset) return;
	let data = moveset.split('\n');
	if (!data.length) return;
	let pokeItem = data[0].split(' @ ');
	let pokemon = removeNick(pokeItem[0].trim());
	let item;
	if (pokeItem[1]) item = pokeItem[1].trim();
	if (!~pokenames.indexOf(pokemon) || (item && !~items.indexOf(item))) return;
	let ability;
	let evs;
	let ivs;
	let nature;
	let shiny = false;
	let level = 100;
	let moves = [];
	for (let i = 1; i < data.length; i++) {
		if (~data[i].indexOf('Ability: ')) ability = data[i].substr(data[i].indexOf(" ")).trim();
		if (~data[i].indexOf('EVs: ')) evs = data[i].substr(data[i].indexOf(" ")).trim();
		if (~data[i].indexOf('IVs: ')) ivs = data[i].substr(data[i].indexOf(" ")).trim();
		if (~data[i].indexOf('Shiny: ')) shiny = true; //assuming this isn't in if the value is "No"
		if (~data[i].indexOf('Level: ')) level = data[i].substr(data[i].indexOf(" ")).trim();
		if (~data[i].indexOf('Nature')) nature = data[i].substr(0, data[i].indexOf(" ")).trim();
		if (data[i][0] === '-') moves.push(data[i].substr(data[i].indexOf(" ")).trim());
	}
	if (evs) {
		let evObj = {};
		let evArr = evs.split(" / ");
		let swap = [];
		for (let j = 0; j < evArr.length; j++) {
			swap = evArr[j].split(" ");
			if (!swap[1] || !oldEv[swap[1].toLowerCase()]) return;
			evObj[oldEv[swap[1].toLowerCase()]] = Number(swap[0]);
		}
		evs= evObj;
	}
	if (ivs) {
		let ivObj = {};
		let ivArr = ivs.split(" / ");
		let swap = [];
		for (let j = 0; j < ivArr.length; j++) {
			swap = ivArr[j].split(" ");
			if (!swap[1] || !oldEv[swap[1].toLowerCase()]) return;
			ivObj[oldEv[swap[1].toLowerCase()]] = Number(swap[0]);
		}
		ivs= ivObj;
	}
	if (!ability || !~abilities.indexOf(ability) || moves.length > 4) return;
    if (!nature || !natures[nature.toLowerCase()]) nature = "Serious";
	let output = {"name": pokemon, "ability": ability, "nature": nature, "level": level, "moves": moves};
	if (evs) output.evs = evs;
	if (ivs) output.ivs = ivs;
	if (item) output.item = item;
	return output;
};

/**
 * Set up the server
 */
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create', (req,res) => {
		let id = Rooms.create();
		res.redirect('./build/' + id);
});

app.get('/build/:id', (req,res) => {
	if (Rooms.rooms[req.path.substr(7)]) {
		res.render('builder');
	}	else {
		res.render('404');
	}
});

app.get('/view/:id', (req,res) => {
	if (Rooms.views[req.path.substr(6)]) {
		res.render('viewer');
	}	else {
		res.render('404');
	}
});
/**
 * Socket events
 */

io.on('connection', (socket) => {
	socket.pokemon = randPoke();
	socket.name = 'Anonymous ' + socket.pokemon;
	socket.img = 'http://www.pokestadium.com/assets/img/sprites/misc/icons/' + socket.pokemon.toLowerCase() + '.png';

	socket.on('load', (data) => {
		socket.edit = true;
		if (!Rooms.rooms[data] && data && typeof data === "string") {
			data = Rooms.views[data] || data;
			socket.edit = false;
		}
  		socket.join(data);
  		socket.room = data;
  		socket.emit('load chat', Rooms.loadChat(socket.room));
  		let msg = socket.name + ' has joined.';
  		io.sockets.in(data).emit('server message', msg);
  		Rooms.updateChat(data, false, false, msg);
	});
	socket.on('chat message', (msg, room) => {
		if (msg.trim().length < 1) return;
    	io.sockets.in(socket.room).emit('chat message', socket.name, socket.img, escapeHTML(msg));
    	Rooms.updateChat(socket.room, socket.name, socket.img, msg);
	});
	socket.on('send team', (res) => {
		socket.emit(res, Rooms.getTeam(socket.room));
	});
	socket.on('name chosen', (name) => {
		name = parseName(name);
		if (name === 'Nineage') socket.img = 'http://www.pokestadium.com/assets/img/sprites/misc/icons/phanpy.png';
		if (name === 'Infamy') socket.img = 'http://www.pokestadium.com/assets/img/sprites/misc/icons/gible.png';
		let oldName = socket.name;
		socket.name = name;
		socket.emit('name change');
		let msg = oldName + ' is now known as ' + name + '.';
		io.sockets.in(socket.room).emit('server message', msg);
		Rooms.updateChat(socket.room, false, false, msg);
	});
	socket.on('default level', (level) => {
		if (!socket.edit) return;
		let room = socket.room;
		let n = Number(level);
		if (isNaN(n) || n < 1 || n % 1 !== 0) return;
		Rooms.setDefaultLevel(room, n);
		io.sockets.in(room).emit('default level', n);
		let msg = 'The default level has been changed to ' + n + ' by ' + socket.name;
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
	});
	socket.on('pokemon selected', (pokeno, pokemon) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (!~pokenames.indexOf(pokemon)) return;
		let room = socket.room;
		if (Rooms.rooms[room].team.pokemon[pokeno - 1] === pokemon) return;
		if (Rooms.rooms[room].lastUpdate === pokemon) return;
		io.sockets.in(room).emit('single change', "pokemon", pokeno, pokemon);
		let msg = 'Pokemon ' + pokeno + ' has been changed to ' +	pokemon + ' by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.clearPokemon(room, pokeno);
		Rooms.updateTeam(room, pokeno, 'pokemon', pokemon);
	});
	socket.on('item selected', (pokeno, item) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (!~items.indexOf(item)) return;
		let room = socket.room;
		if (Rooms.rooms[room].lastUpdate === item) return;
		io.sockets.in(room).emit('single change', "item", pokeno, item);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno-1] + '\'s item has been changed to ' +	item + ' by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'items', item);
	});
	socket.on('ability selected', (pokeno, ability, auto) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (!~abilities.indexOf(ability)) return;
		let room = socket.room;
		if (auto) { //Done by the client
			Rooms.updateTeam(room, pokeno, 'abilities', ability);
			return;
		}
		if (Rooms.rooms[room].lastUpdate === ability) return;
		io.sockets.in(room).emit('single change', "ability", pokeno, ability);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno-1] + '\'s ability has been changed to ' +	ability + ' by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'abilities', ability);
	});
	socket.on('shiny change', (pokeno, bool) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (typeof bool !== 'boolean') return;
		let room = socket.room;
		if (Rooms.rooms[room].lastUpdate === bool) return;
		io.sockets.in(room).emit('single change', "shiny", pokeno, bool);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno-1] + ' has been ' + (bool ? 'made' : 'un-made') + ' shiny by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'shiny', bool);
	});
	socket.on('level change', (pokeno, level) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		level = Number(level);
		if (isNaN(level)) return;
		let room = socket.room;
		if (Rooms.rooms[room].lastUpdate === level) return;
		io.sockets.in(room).emit('single change', "level", pokeno, level);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno-1] + '\'s level has been changed to ' +	level + ' by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'levels', level);
	});
	socket.on('nature selected', (pokeno, nature) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (!natures[nature.toLowerCase()]) return;
		let room = socket.room;
		if (Rooms.rooms[room].lastUpdate === nature) return;
		io.sockets.in(room).emit('single change', "nature", pokeno, nature);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno-1] + '\'s nature has been changed to ' +	nature + ' by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'natures', nature);
	});
	socket.on('move selected', (pokeno, moveno, move) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (!~moves.indexOf(move)) return;
		let room = socket.room;
		if (Rooms.rooms[room].lastUpdate === move) return;
		io.sockets.in(room).emit('single change', "move", pokeno + '-' + moveno, move);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno - 1] + '\'s ' + position(moveno) + ' move has been changed to ' +	move + ' by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'moves', move, moveno);
	});
	socket.on('ev selected', (pokeno, stat, ev) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		ev = Number(ev);
		if (isNaN(ev)) return;
		let room = socket.room;
		io.sockets.in(room).emit('single change', "ev", stat + '-input-' + pokeno, ev);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno - 1] + '\'s EVs have been updated by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'evs', ev, stat);
	});
	socket.on('iv selected', (pokeno, stat, iv) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		iv = Number(iv);
		if (isNaN(iv)) return;
		let room = socket.room;
		io.sockets.in(room).emit('single change', "iv", stat + '-iv-input-' + pokeno, iv);
		let msg = Rooms.rooms[room].team["pokemon"][pokeno - 1] + '\'s IVs have been updated by ' + socket.name + '.';
		io.sockets.in(room).emit('server message', msg);
		Rooms.updateChat(room, null, null, msg);
		Rooms.updateTeam(room, pokeno, 'ivs', iv, stat);
	});
	socket.on('get moveset', (pokeno, pokemon, moveset) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		if (!pokemon || !movesets[pokemon]) return false;
		let data  = movesets[pokemon][moveset];
		let room = socket.room;
		if (data) {
			io.sockets.in(room).emit('moveset change', pokeno, pokemon, data);
			let msg = pokemon + '\'s moveset has been changed to ' + moveset + ' by ' + socket.name;
			io.sockets.in(room).emit('server message', msg);
			Rooms.updateChat(room, null, null, msg);
			Rooms.importSet(room, pokeno, pokemon, data);
		}
	});
	socket.on('import moveset', (pokeno, moveset) => {
		if (!socket.edit) return;
		if (isNaN(pokeno) || pokeno > 6 || pokeno < 1) return;
		let room = socket.room
		let data = packSet(moveset);
		if (data) {
			io.sockets.in(room).emit('moveset change', pokeno, data.name, data);
			let msg = data.name + '\'s moveset has been changed to a custom moveset by ' + socket.name;
			io.sockets.in(room).emit('server message', msg);
			Rooms.updateChat(room, null, null, msg);
			Rooms.importSet(room, pokeno, data.name, data);
		}
	});
	socket.on('get view only', () => {
		if (!socket.edit) return;
		let room = socket.room;
		io.sockets.in(room).emit('view only', Rooms.rooms[room].viewid || '');
	});
	socket.on('disconnect', () => {
		let msg = socket.name + ' has left.';
		io.sockets.in(socket.room).emit('server message', msg);
		Rooms.updateChat(socket.room, false, false, msg);
	});
});

/**
 * Finally run the server
 */
http.listen(port, () => {
    console.log('Application started at http://localhost:' + port);
});
