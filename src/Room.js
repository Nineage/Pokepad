'use strict';
/**
 * Room
 * @license MIT license
 */

const defaultTeam = require('./data/defaultTeam.json');
const dex = require('./data/pokedex.js');


/**
 * Room
 * Class representing a room.
 *      
 * @param {String} id
 * @param {String} viewid
 */
module.exports = class Room {
    constructor(id, viewid) {
    	this.id = id;
    	this.viewid = viewid;
    	this.chat = [];
    	this.team = JSON.parse(JSON.stringify(defaultTeam));
	}
	
    /**
     * getId
     * getter for id
     * @return {string}
     */
	getId() {
	    return this.id;
	}
	
	/**
     * getViewId
     * getter for viewid
     * @return {string}
     */
	getViewId() {
	    return this.viewid;
	}
	
    /**
     * getChat
     * getter for chat
     * @return {array}
     */
	getChat() {
	    return this.chat;
	}
	
    /**
     * getTeam
     * getter for team
     * @return {object}
     */	
	getTeam() {
	    return this.team;
	}
	
    /**
     * updateChat
     * Adds a new chat message to the chat list
     * @param {String} room
     * @param {String} name
     * @param {String} message
     */	
     updateChat(room, name, message) {
	    this.chat.push([name, message]);
	}
	
    /**
     * updateTeam
     * updates the passed value on the room
     * @param {String} element
     * @param {int} index
     * @param {String} data
     * @param {int} data
     */		
     updateTeam(element, index, data, innerIndex) {
     	if (element === "pokemon") {
     		this.team[element][index] = data;
     		this.team["items"][index] = "";
     		this.team["abilities"][index] = dex[toId(data)]["abilities"]["0"];
     		this.team["moves"][index] = ["","","",""];
     		this.team["evs"][index] = {"hp": 0, "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0};
     		this.team["ivs"][index] = {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31};
     		this.team["natures"][index] = "Serious";
     	} else if (element === "moves" || element === "evs" || element === "ivs") {
			this.team[element][index][innerIndex] = data;
		} else {
			this.team[element][index] = data;
		}
		return this.team;
	}
	
	replaceSet(index, data) {
		this.team["pokemon"][index] = data.pokemon;
		this.team["items"][index] = data.item;
		this.team["abilities"][index] = data.ability;
		this.team["moves"][index] = data.moves;
		this.team["evs"][index] = data.evs;
		this.team["ivs"][index] = data.ivs;
		this.team["natures"][index] = data.nature;
		this.team["levels"][index] = data.level;
		
		return this.team;
	}
};