"use strict";

const shortid = require("shortid");

const newEv = {
	'hp': 'hp',
	'at': 'atk',
	'df': 'def',
	'sa': 'spa',
	'sd': 'spd',
	'sp': 'spe'
};

const Rooms = module.exports = {
    rooms: {},
    create: function () {
        let id = shortid.generate();
        Rooms.rooms[id] = {
            id: id,
            users: [],
            team: {
                pokemon: ["Unown","Unown","Unown","Unown","Unown","Unown"],
                shiny: [false, false, false, false, false, false],
                items: ["","","","","",""],
                abilities: ["Levitate", "Levitate", "Levitate", "Levitate", "Levitate", "Levitate"],
                levels: [100, 100, 100, 100, 100, 100],
                moves: [["","","",""],["","","",""],["","","",""],["","","",""],["","","",""],["","","",""]],
                evs: [{hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, 
                    {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}],
                ivs: [{hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, 
                    {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}],
                natures: ["Serious", "Serious", "Serious", "Serious", "Serious", "Serious"],    
            },
            chat: [],
            lastUpdate: null, //avoids occasionally double submission
        };
        return id;
    },
    getTeam: function(room) {
        let rdata = Rooms.rooms[room];
        if (!rdata || !rdata.team) return;
        return rdata.team;
    },
    updateChat: function (room, by, image, msg) {
        if (Rooms.rooms[room]) Rooms.rooms[room].chat.push([by, image, msg]);
    },
    loadChat: function (room) {
        if (Rooms.rooms[room]) return Rooms.rooms[room].chat;
    },
    clearPokemon: function (room, index) {
        index--;
        let rdata = Rooms.rooms[room].team;
        rdata.items[index] = "";
        rdata.shiny[index] = false;
        rdata.levels[index] = 100;
        rdata.abilities[index] = "Serious";
        rdata.moves[index] = ["","","",""];
        rdata.evs[index] = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
        rdata.ivs[index] = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
    },
    updateTeam: function (room, index, cat, change, m) {
        let rdata = Rooms.rooms[room];
        index--;
        if (!rdata) return;
        if (cat === "moves") {
            rdata.team["moves"][index][m - 1] = change;
        } else if (cat === "evs") {
            rdata.team["evs"][index][m] = change;
        } else if (cat === "ivs") {
            rdata.team["ivs"][index][m] = change;
        } else {
            rdata.team[cat][index] = change;
        }
        rdata.lastUpdate = change;
        Rooms.rooms[room] = rdata;
    },
    importSet: function (room, index, pokemon, data) {
        let rdata = Rooms.rooms[room];
        if (!rdata || !rdata.team) return;
        Rooms.clearPokemon(room, index);
        rdata = rdata.team; //awful
        index--;
        rdata.pokemon[index] = pokemon;
        if (data.shiny) rdata.shiny[index] = true;
        rdata.items[index] = data.item || "";
        rdata.abilities[index] = data.ability;
        rdata.levels[index] = data.level;
        rdata.natures[index] = data.nature;
        for (let i = 0; i < 4; i++) {
            rdata.moves[index][i] = data.moves[i] || "";
        }
        for (let k in data.evs) {
            console.log(rdata.evs[index][newEv[k]], data.evs[k])
            rdata.evs[index][newEv[k]] = data.evs[k];
        }
        for (let j in data.ivs) {
            rdata.ivs[index][newEv[j]] = data.ivs[j];
        }
    }
};