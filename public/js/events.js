/* 
*
* Event Handlers
*
*/

var nature = {
	'Adamant': ['atk', 'spa'],
	'Bashful': ['', ''],
	'Bold': ['def', 'atk'],
	'Brave': ['atk', 'spe'],
	'Calm': ['spd', 'atk'],
	'Careful': ['spd', 'spa'],
	'Docile': ['', ''],
	'Gentle': ['spd', 'def'],
	'Hardy': ['', ''],
	'Hasty': ['spe', 'def'],
	'Impish': ['def', 'spa'],
	'Jolly': ['spe', 'spa'],
	'Lax': ['def', 'spd'],
	'Lonely': ['atk', 'def'],
	'Mild': ['spa', 'def'],
	'Modest': ['spa', 'atk'],
	'Naive': ['spe', 'spd'],
	'Naughty': ['atk', 'spd'],
	'Quiet': ['spa', 'spe'],
	'Quirky': ['', ''],
	'Rash': ['spa', 'spd'],
	'Relaxed': ['def', 'spe'],
	'Sassy': ['spd', 'spe'],
	'Serious': ['', ''],
	'Timid': ['spe', 'atk']
};

function packSet(moveset) {
	if (!moveset || typeof moveset !== "string") return;
	var data = moveset.split('\n');
	if (!data.length) return;
	
	var result = {"pokemon": "", "item": "", "ability": "", "level": 100, "evs": {}, "ivs": {}, "nature": "Serious", "moves": ["","","",""]};
	data[0] = data[0].split(' @ ');
	result.pokemon = data[0][0].trim();
	
	if (data[0][1]) result.item = data[0][1].trim();
	var moveIndex = 0;
	
	for (var i = 1; i < data.length; i++) {
		if (~data[i].indexOf('Ability: ')) result.ability = data[i].substr(data[i].indexOf(" ")).trim();
		if (~data[i].indexOf('Nature')) result.nature = data[i].substr(0, data[i].indexOf(" ")).trim();
		if (~data[i].indexOf('Level: ')) result.level = data[i].substr(data[i].indexOf(" ")).trim();
		
		if (data[i][0] === '-') {
			result.moves[moveIndex] = data[i].substr(data[i].indexOf(" ")).trim();
			moveIndex++;
		}
		
		if (~data[i].indexOf('EVs: ')) result.evs = packStats(data[i].substr(data[i].indexOf(" ")).trim());
		if (~data[i].indexOf('IVs: ')) result.ivs = packStats(data[i].substr(data[i].indexOf(" ")).trim());
	}
	return result;
}

function packStats(valueString) {
	var result = {};
	var data = valueString.split(" / ");
	
	for (var i = 0; i < data.length; i++) {
		var values = data[i].split(" ");
		
		if (typeof values[1] !== "string") return result;
		result[values[1].toLowerCase()] = Number(values[0]);
	}
	return result;
}

// updates the current tab
function updateTab(tab) {
    var index = tab;
    $("#pokemon-title").text(currentTeam.pokemon[index]);
    $("#pokemon-input").val(currentTeam.pokemon[index]);
    $("#ability-input").val(currentTeam.abilities[index]);
    $("#level-input").val(currentTeam.levels[index]);
    $("#item-input").val(currentTeam.items[index]);
    $("#shiny-input").prop("checked", currentTeam.shinies[index]);
    $("#nature").val(currentTeam.natures[index]);
    
    $(".base-stat").each(function(elem) {
        $(this).text(pokedex[toId(currentTeam.pokemon[index])].baseStats[$(this).data("stat")]);
        calculateStatTotal($(this).data("stat"));
    });
    
    var setHTML = "";
    var mon = pokedex[toId(currentTeam.pokemon[index])].species;
    var sets;
    
    try {
        sets = Object.keys(SETDEX_SM[mon]);
    } catch (e) {
        sets = [];
    }

    
     $('#smogdex-dropdown').html("<option value='custom'>Custom Set</option>")
    for (var i = 0; i < sets.length; i++) {
        $('#smogdex-dropdown').append($('<option>', {
            value: sets[i],
            text : sets[i]
        }));
    }
    
    updateEVs(tab);
    updateIVs(tab);
    updateMoves(tab);
};

// update ev tab
function updateEVs(tab) {
    $(".evfield").each(function() {
        $(this).val(currentTeam.evs[tab][$(this).data("stat")]);
    });
    
    $(".evslider").each(function() {
        $(this).val(currentTeam.evs[tab][$(this).data("stat")]);
    });
}

// update iv fields
function updateIVs(tab) {
    $(".iv-stat").each(function() {
        $(this).val(currentTeam.ivs[tab][$(this).data("stat")]);
    });
}

// updates moves
function updateMoves(tab) {
    var current;
    for (var i = 0; i < 4; i++) {
        current = "#move-input-" + (i + 1);
        $(current).val(currentTeam.moves[tab][i]);
    }
}

// update stat total
function calculateStatTotal(stat) {
    var ev = Number(currentTeam.evs[activeTab][stat]);
    var iv = Number(currentTeam.ivs[activeTab][stat]);
    var level = Number(currentTeam.levels[activeTab]);
    var base = pokedex[toId(currentTeam.pokemon[activeTab])].baseStats[stat];
    var result = 0;

    if (stat === "hp") {
        result = Math.floor((((2 * base + iv + Math.floor(ev/4)) * level) / 100)) + level + 10;
    } else {
        result =  Math.floor(Math.floor(((2 * base + iv + Math.floor(ev/4)) * level) / 100) + 5);
        var multiplier = nature[currentTeam.natures[activeTab]].indexOf(stat);
        if (multiplier === 0) result = Math.floor(result * 1.1);
        if (multiplier === 1) result = Math.floor(result * 0.9);
    }
    
    $("#total-" + stat).text(result);
}

// generates an importable
function getImportable() {
    var output = [];
    var data = [];
    var t = currentTeam; //assigned for concision
    
    for (var i = 0; i < 6; i++) {
        output.push(t["pokemon"][i] + (t["items"][i].length ? " @ " + t["items"][i] : ""));
        output.push("Ability: " + t["abilities"][i]);
        if (t["levels"][i] !== 100) output.push("Level: " + t["levels"][i]);
        if (t["shinies"][i]) output.push("Shiny: Yes");
        
        for (var j in t["evs"][i]) {
            if (t["evs"][i].hasOwnProperty(j) && t["evs"][i][j] !== 0) {
                data.push(t["evs"][i][j] + " " + j);
            }
        }
        
        if (data.length > 0) output.push("EVs: " + data.join(" / "));
        data = [];
        output.push(t["natures"][i] + " Nature");
        for (var k in t["ivs"][i]) {
            if (t["ivs"][i].hasOwnProperty(k) && t["ivs"][i][k] !== 31) {
                data.push(t["ivs"][i][k] + " " + k);
            }
        }
        if (data.length > 0) output.push("IVs: " + data.join(" / "));
        data = [];
        for (var m = 0; m < 4; m++) {
            if (t["moves"][i][m].length) output.push("- " + t["moves"][i][m]);
        }
        if (i < 5) output.push("");
    }
    return output.join("\n");
}

// load up datafiles
function loadDataFile(dataFile, value, id) {
    var data = [];
    var dex = Object.keys(dataFile);
    
    for (var i = 0; i < dex.length; i++) {
        data.push(dataFile[dex[i]][value]);
    }
    $("." + id).typeahead({ source: data });    
}

// Load data
$(document).ready(function() {
    var path = window.location.pathname;
    socket.emit('load', path.substring(path.lastIndexOf('/') + 1));
    
    loadDataFile(pokedex, "species", "pokemon");
    loadDataFile(items, "name", "item");
    loadDataFile(moveDex, "name", "move");
    loadDataFile(abilityDex, "name", "ability");
});

//choose name
$('#nameform').submit(function(e) {
    var name = $('#namefield').val();
    socket.emit('name chosen', name);
    localStorage.setItem("username", name);
    $("#nav-username").text(name);
    return false;
});

$('#nav-username').click(function(e) {
    
});

// Add Chat messages
$('#chat').submit(function() {
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    autoScroll();
    return false;
});

// Change active mon
$(".mon-select-button").click(function(e) {
    $(".mon-select-span").each(function() {
        $(this).removeClass("active");
    });
    
    $(this).children().first().addClass("active");
    activeTab = Number($(this).data("tab-num"));
    updateTab(activeTab);
});

// Change current pokemon on server
$("#pokemon-input").change(function() {
    if (pokedex.hasOwnProperty(toId($("#pokemon-input").val()))) {
        socket.emit('change mon', activeTab, $("#pokemon-input").val());
    }
});

// Change ability on server
$("#ability-input").change(function() {
    if (abilityDex.hasOwnProperty(toId($("#ability-input").val()))) {
        socket.emit('team update', 'ability', activeTab, $("#ability-input").val());
    }
});

// Change item on serer
$("#item-input").change(function() {
    if (items.hasOwnProperty(toId($("#item-input").val()))) {
        socket.emit('team update', 'item', activeTab, $("#item-input").val());
    }
});

// Update level value on server
$("#level-input").change(function() {
    socket.emit('team update', 'level', activeTab, $("#level-input").val());
});

// Update shiny value on server
$("#shiny-input").change(function() {
    socket.emit('team update', 'shiny', activeTab, this.checked);
});

// Update move on server
$(".move").change(function() {
    var id = this.id.substr(11);
    if (moveDex.hasOwnProperty(toId($(this).val()))) {
        socket.emit('team update', 'move', activeTab, $(this).val(), {"move": Number(id)});
    }
});

// update nature on server
$("#nature").change(function() {
    socket.emit('team update', 'nature', activeTab, $("#nature").val());
    calculateStatTotal(stat);
});

// change evs with input field
$(".evfield").change(function() {
    var stat = $(this).data("stat");
    $("#evslider-" + stat).val($(this).val());
    $("#evslider-" + stat).trigger('change');
    
    socket.emit('team update', 'ev', activeTab, $(this).val(), {"stat": stat});
    calculateStatTotal(stat);
})

// change evs with slider
$(".evslider").change(function() {
    var stat = $(this).data("stat");
    $("#stat-" + stat).val($(this).val());
    
    socket.emit('team update', 'ev', activeTab, $(this).val(), {"stat": stat});
    calculateStatTotal(stat);
})

$(".iv-stat").change(function() {
    var stat = $(this).data("stat");
    socket.emit('team update', 'iv', activeTab, $(this).val(), {"stat": stat});
    calculateStatTotal(stat);
});

// Change iv spread for hidden powers TODO UPDATE THE IVS ON SERVER WHEN CHANGED
$("#ivspread").change(function() {
    var spread = $("#ivspread").val().split("/");
    var i = 0;
    $(".iv-stat").each(function(iv) {
        $(this).val(spread[i]);
        i++;
    });
    var stats = ["hp", "atk", "def", "spa", "spd", "spe"];
    for (var j = 0; j < stats.length; j++) {
        calculateStatTotal(stats[j]);
    }
});

// Export the team
$("#export-btn").click(function() {
    $("#export-box-area").text(getImportable());
});

// Export the team
$("#copy-export-btn").click(function() {
    $("#export-box-area").select();
    document.execCommand('copy');
});

// toggle import set
$("#import-set-btn").click(function() {
    $("#pokeinfo-panel-view").toggleClass("hidden");
    $("#import-panel-view").toggleClass("hidden");
});

// import a set
$("#submit-import-btn").click(function() {
    var importSet = $("#import-set-area").val();
    var objectSet = packSet(importSet);
    if (objectSet) socket.emit('import set', activeTab, objectSet);
    
    $("#import-set-area").val("");
    $("#pokeinfo-panel-view").toggleClass("hidden");
    $("#import-panel-view").toggleClass("hidden");
});

// Select a SmogDex Set 
$("#smogdex-dropdown").change(function() {
    let setName = $(this).val();
    let pokeName = $("#pokemon-input").val();
    if (setName === "Custom Set") return;
    socket.emit('import set', activeTab, SETDEX_SM[pokeName][setName], pokeName, setName);
});