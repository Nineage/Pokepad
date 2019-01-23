var socket = io();
var activeTab = 0;
var currentTeam = {};

// helper function to scroll chat
function autoScroll() {
	$('#messages').scrollTop(Number.MAX_SAFE_INTEGER);
}

// id function makes using Showdown data files simpler
function toId(text) {
    if (text && text.id) {
        text = text.id;
    } else if (text && text.userid) {
        text = text.userid;
    }
    if (typeof text !== 'string' && typeof text !== 'number') return '';
    return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// helper function to update pokemon info
function updatePokemon(pokeid, team, index) {
    var idStr = pokeid;
    if (Number(pokeid) < 100) idStr = "0" + idStr;
    if (Number(pokeid) < 10) idStr = "0" + idStr;
    if (Number(pokeid) > 796 && pokeid !== 802 && pokeid !== 803) idStr = "201";
    $('#mon-pic-' + (index + 1)).attr('src', 'https://pldh.net/media/pokemon/shuffle/' + idStr + '.png');
    $('#mon-select-' + (index + 1)).text(team.pokemon[index]);
    
    $(".base-stat").each(function(elem) {
        $(this).text(pokedex[toId(team.pokemon[index])].baseStats[$(this).data("stat")]);
        calculateStatTotal($(this).data("stat"));
    });
}

/* 
*
* General Socket events 
*
*/

// handle chat messages
socket.on('chat message', (by, msg) => {
	$('#messages').append('<li><strong> ' + by + ':</strong><span class="inline-message"> ' + msg + '</span></li>');
	autoScroll();
});

// handle server messages
socket.on('server message', (message) => {
    $('#messages').append('<li class="server">' + message + '</li>');
    autoScroll();
});

// load chat on join
socket.on('load chat', function(chat) {
    for (var i = 0; i < chat.length; i++) {
		if (!chat[i][0]) {
			$('#messages').append('<li class="server">' + chat[i][1] + '</li>');
		} else {
			$('#messages').append('<li><strong>' + chat[i][0] + ':</strong><span class="inline-message"> ' + chat[i][1] + '</span></li>');
		}    
    }
    autoScroll();
    
    if (localStorage.getItem("username") !== null) {
        socket.emit('name chosen', localStorage.getItem("username"));
        $("#nav-username").text(localStorage.getItem("username"));
    }
});

// load team on join
socket.on('load team', function(team) {
    // Store team object client-side
    currentTeam = team;
    
    // Side Bar
    for (var i = 0; i < team.pokemon.length; i++) {
        updatePokemon(pokedex[toId(team.pokemon[i])].num, team, i);
    }
    
    // Current Tab
    updateTab(activeTab);
});

socket.on('update pokemon', function(team, index) {
    // Store team object client-side
    currentTeam = team;
    
    // Side Bar
    updatePokemon(pokedex[toId(team.pokemon[index])].num, team, index);
    
    // Current Tab
    if (index === activeTab) updateTab(activeTab);
});

// handle team changes
socket.on('update team', function(team, index) {
    currentTeam = team;
    if (index === activeTab) {
        updateTab(activeTab);
    }
});

// handle name changes
socket.on('name change', function() {
    $('.modal').modal('hide');
    $('#name-btn').addClass('hidden');
    $('#chat').removeClass('hidden');
});