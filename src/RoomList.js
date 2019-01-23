'use strict';
/**
 * rooms
 * @license MIT license
 */

const shortid = require('shortid');
const Room = require('./Room.js');

/**
 * Roomlist
 * Class representing a the list of rooms.
 */
module.exports = class RoomList {
	constructor() {
		this.roomlist = {};
	}

    /**
     * create
     * Generates a shortid for the new room's
     * view and edit page and adds it to the list
     * @return {string}
     */
	create() {
	    let id = shortid.generate();
	    let viewid = shortid.generate();
	    this.roomlist[id] = new Room(id, viewid);
	    return id;
	}
	
	 /**
     * get
     * Checks if a room exists and returns it
     * @param {String} room
     * @return {Room}
     */
	get(room) {
		if (!this.hasRoom(room)) return;
		return this.roomlist[room];
    }
   
   	 /**
     * get
     * Checks if a room exists and returns its chat
     * @param {String} room
     * @return {array}
     */ 
    getChat(room) {
        if (!this.hasRoom(room)) return;
        return this.roomlist[room].getChat();
    }
    
    /**
     * updateChat
     * Updates the chat of a room
     * @param {String} room
     * @param {String} name
     * @param {String} message
     */
    updateChat(room, name, message) {
        if (!this.hasRoom(room)) return;
        this.roomlist[room].updateChat(room, name, message);
    }
    
     /**
     * getTeam
     * returns the team in a room
     * @param {String} room
     * @return {object}
     */ 
    getTeam(room) {
        if (!this.hasRoom(room)) return;
        return this.roomlist[room].getTeam();
    }
    
    /* Needs Documentation */
    updateTeam(room, element, index, data, innerIndex) {
        if (!this.hasRoom(room)) return;
        return this.roomlist[room].updateTeam(element, index, data, innerIndex);
    }
    
    replaceSet(room, index, data) {
        if (!this.hasRoom(room)) return;
        return this.roomlist[room].replaceSet(index, data);
    }
    
     /**
     * hasRoom
     * Checks if a room exists
     * @param {String} room
     * @return {boolean}
     */ 
	hasRoom(room) {
		return room in this.roomlist;
	}
};