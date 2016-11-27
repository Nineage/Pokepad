"use strict";

const socket = io();

const hpArr = ["Hidden Power Fire", "Hidden Power Water", "Hidden Power Grass", "Hidden Power Electric", "Hidden Power Fighting", "Hidden Power Flying", "Hidden Power Fairy", "Hidden Power Ice", "Hidden Power Poison", "Hidden Power Ghost", "Hidden Power Psychic", "Hidden Power Dark", "Hidden Power Steel", "Hidden Power Rock", "Hidden Power Ground", "Hidden Power Bug", "Hidden Power Dragon"];

const toId = function (text) { //I love Zarel
	if (text && text.id) {
		text = text.id;
	} else if (text && text.userid) {
		text = text.userid;
	}
	if (typeof text !== 'string' && typeof text !== 'number') return '';
    return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
};

const newEv = {
	'hp': 'hp',
	'at': 'atk',
	'df': 'def',
	'sa': 'spa',
	'sd': 'spd',
	'sp': 'spe'
};

const setPokemon = function (pokeno, pokemon, server) {
    //This gets to be its own function because its more complicated
    let pokevar = '#pokemon-input-' + pokeno;
    let panel = '#panel-title-' + pokeno;
    let img = '#panel-image-' + pokeno;
    let oldMon = $(panel).text();
    $(pokevar).val(pokemon);
            
    //First lets clear everything
    $(img).removeClass(oldMon.toLowerCase())
    $('#item-input-' + pokeno).val("");
    $('#level-input-' + pokeno).val(100);
    $('#shiny-input-' + pokeno).prop("checked", false);
    $('#nature-input-' + pokeno).val("Serious");
    for (let i = 1; i < 5; i++) {
        $('#move-input-' + pokeno + '-' + i).val("");
    }
    for (let j in newEv) {
        let stat = newEv[j];
        $('#' + stat + '-input-' + pokeno).val(0);
        $('#' + stat + '-iv-input-' + pokeno).val(31);
    }
    
    //Now we propagate
    $(panel).text(pokemon);
    $(img).addClass(pokemon.toLowerCase())
    let data = [];
    let pokeData = pokedex[0][toId(pokemon)];
    for (let i in pokeData.abilities) {
        data.push(pokeData.abilities[i]);
    }
    $('#ability-input-' + pokeno).typeahead('destroy');
    $('#ability-input-' + pokeno).typeahead({ source:data });
    $('#ability-input-' + pokeno).val(pokeData.abilities[0]);
    if (!server) socket.emit('ability selected', pokeno, pokeData.abilities[0], true);
    data = learnsets[0][toId(pokemon)];
    if (~data.indexOf('Hidden Power')) data = data.concat(hpArr);
    let moveVar = '#move-input-' + pokeno;
    for (let j = 1; j < 5; j++) {
        $(moveVar + '-' + j).typeahead('destroy');
        $(moveVar + '-' + j).typeahead({ source:data });
    }
    $('#moveset-input-' + pokeno).empty();
    for (let i in movesets[0][pokemon]) {
        $('#moveset-input-' + pokeno).append('<a id= "' + toId(i) + '-' + pokeno + '" class="dropdown-item" href="#">' + i + '</a>');
    }
};

$(document).ready(() => {
    let data = [];
    for (let i in pokedex[0]) {
        data.push(pokedex[0][i].species);
    }
    $(".pokemon").typeahead({ source:data });
    data = [];
    for (let i in items[0]) {
        data.push(items[0][i].name);
    }
    $('.item').typeahead({ source:data });
    data = [];
    /*for (let i in moves[0]) {
        data.push(moves[0][i].name);
    }*/
    $('.move').typeahead({ source: data });
    data = [];
    for (let i in natures[0]) {
        data.push(natures[0][i].name);
    }
    $('.nature').typeahead({ source: data });
    
    socket.emit('send team', 'load data');
});

socket.on('connect', () => {
    socket.emit('load', window.location.pathname.substr(7));
});

socket.on('load chat', messages => {
    for (let i = (messages.length > 50 ? messages.length - 50 : 0); i < messages.length; i++) {
        if (messages[i][0]) {
            $('#messages').append('<li><img src="' + messages[i][1] + '" /><b> ' + messages[i][0] + ':</b><span class="inline-message"> ' + messages[i][2] + '</span></li>');
        } else {
            $('#messages').append('<li class="server">' + messages[i][2] + '</li>');
        }
    }
    $('#messages').scrollTop(10 * 40^100000000000);
});

socket.on('chat message', (by, poke, msg) => {
    $('#messages').append('<li><img src="' + poke + '" /><b> ' + by + ':</b><span class="inline-message"> ' + msg + '</span></li>');
    $('#messages').scrollTop(10 * 40^100000000000);
});

socket.on('server message', (message) => {
    $('#messages').append('<li class="server">' + message + '</li>');
    $('#messages').scrollTop(10 * 40^100000000000);
});

socket.on('name change', () => {
    $('button.name-button').replaceWith('<form class="chat"><input type="text" class="form-control" id="m" autocomplete="off" /></form>');
});

socket.on('load data', data => {
    if (typeof data !== 'object') return;
    for (let i = 0; i < 6; i++) {
        let pokeno = i + 1;
        setPokemon(pokeno, data["pokemon"][i]);
        $('#item-input-' + pokeno).val(data["items"][i]);
        $('#ability-input-' + pokeno).val(data["abilities"][i]);
        $('#shiny-input-' + pokeno).prop("checked", data["shiny"][i]);
        $('#level-input-' + pokeno).val(data["levels"][i]);
        $('#nature-input-' + pokeno).val(data["natures"][i]);
        for (let j = 0; j < 4; j++) {
            $('#move-input-' + pokeno + '-' + (j + 1)).val(data["moves"][i][j]);
        }
        for (let k in data.evs[i]) {
            $('#' + k + '-input-' + pokeno).val(data.evs[i][k]);
        }
        for (let l in data.ivs[i]) {
            $('#' + l + '-iv-input-' + pokeno).val(data.ivs[i][l]);
        }
    } 
});

socket.on('build importable', data => {
    if (typeof data !== 'object') return;
    let output = [];
    for (let i = 0; i < 6; i++) {
        output.push(data["pokemon"][i] + (data["items"][i].length ? " @ " + data["items"][i] : ""));
        output.push("Ability: " + data["abilities"][i]);
        if (data.levels[i] !== 100) output.push("Level: " + data.levels[i]);
        if (data.shiny[i]) output.push("Shiny: Yes");
        let evs = [];
        for (let k in data.evs[i]) {
            //Reason for weird check is below
            if (!~[0, "0"].indexOf(data.evs[i][k])) evs.push(data.evs[i][k] + " " + k);
        }
        if (evs.length) output.push("EVs: " + evs.join(" / "));
        output.push(data.natures[i] + " Nature");
        let ivs = [];
        for (let l in data.ivs[i]) {
            //Weird check here is because sometimes IVs are a number and sometimes a string. Will fix.
            if (!~[31, "31"].indexOf(data.ivs[i][l])) ivs.push(data.ivs[i][l] + " " + l);
        }
        if (ivs.length) output.push("IVs: " + ivs.join(" / "));
        for (let j = 0; j < 4; j++) {
            if (data["moves"][i][j]) output.push("- " + data["moves"][i][j]);
        }
        output.push("");
    }
    $('#export-box-area').text(output.join('\n'));
});

//Here come the big ones
socket.on('single change', (type, pokeno, change) => {
    switch (type) {
        case 'pokemon':
            setPokemon(pokeno, change);
        break;
        case 'item':
            $('#item-input-' + pokeno).val(change);
        break;
        case 'ability':
            $('#ability-input-' + pokeno).val(change);
        break;
        case 'level':
            $('#level-input-' + pokeno).val(change);
        break;
        case 'shiny':
            $('#shiny-input-' + pokeno).prop("checked", change);
        break;
        case 'move':
            $('#move-input-' + pokeno).val(change);
        break;
        case 'nature':
            $('#nature-input-' + pokeno).val(change);
        break;
        case 'ev':
            $('#' + pokeno).val(change);
        break;
        case 'iv':
            $('#' + pokeno).val(change);
        break;
        default:
            alert("An error has ocurred. Please report this in the smogon thread.");
        break;
    }
});

socket.on('moveset change', (pokeno, pokemon, data) => {
    setPokemon(pokeno, pokemon, true);
    if (data.item) $('#item-input-' + pokeno).val(data.item);
    if (data.shiny) $('#shiny-input-' + pokeno).prop("checked", true);
    $('#ability-input-' + pokeno).val(data.ability);
    $('#level-input-' + pokeno).val(data.level);
    $('#nature-input-' + pokeno).val(data.nature);
    for (let i = 0; i < data.moves.length; i++) {
        $('#move-input-' + pokeno + '-' + (i + 1)).val(data.moves[i]);
    };
    for (let k in data.evs) {
        $('#' + newEv[k] + '-input-' + pokeno).val(data.evs[k]);
    }
    for (let j in data.ivs) {
        $('#' + newEv[j] + '-iv-input-' + pokeno).val(data.ivs[j]);
    }
});