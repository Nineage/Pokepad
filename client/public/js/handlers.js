'use strict';
/**
 * Handlers
 * https://github.com/nineage/pokepad
 * @license MIT license
 */

/**
 * changeTab
 * Changes the current active title.
 * @param {String} tab
 * @param {String} curPanel
 */
function changeTab(tab, curPanel) {
    if (tab === 'toggle-general-' + curPanel) {
        tab = '#' + tab + '-li';
        $(tab).addClass('active');

        var show = '#mon-' + curPanel + '-general';
        $(show).removeClass('hidden-button');

        var moves = '#toggle-moves-' + curPanel + '-li';
        $(moves).removeClass('active');

        var evs = '#toggle-evs-' + curPanel + '-li';
        $(evs).removeClass('active');

        var impor = '#toggle-import-' + curPanel + '-li';
        $(impor).removeClass('active');

        var hide1 = '#mon-' + curPanel + '-moves';
        $(hide1).addClass('hidden-button');

        var hide2 = '#mon-' + curPanel + '-evs';
        $(hide2).addClass('hidden-button');

        var hide3 = '#mon-' + curPanel + '-import';
        $(hide3).addClass('hidden-button');

    } else if (tab === 'toggle-moves-' + curPanel) {
        tab = '#' + tab + '-li';
        $(tab).addClass('active');

        var show = '#mon-' + curPanel + '-moves';
        $(show).removeClass('hidden-button');

        var general = '#toggle-general-' + curPanel + '-li';
        $(general).removeClass('active');

        var evs = '#toggle-evs-' + curPanel + '-li';
        $(evs).removeClass('active');

        var impor = '#toggle-import-' + curPanel + '-li';
        $(impor).removeClass('active');

        var hide1 = '#mon-' + curPanel + '-general';
        $(hide1).addClass('hidden-button');

        var hide2 = '#mon-' + curPanel + '-evs';
        $(hide2).addClass('hidden-button');

        var hide3 = '#mon-' + curPanel + '-import';
        $(hide3).addClass('hidden-button');

    } else if (tab === 'toggle-evs-' + curPanel) {
        tab = '#' + tab + '-li';
        $(tab).addClass('active');

        var show = '#mon-' + curPanel + '-evs';
        $(show).removeClass('hidden-button');

        var general = '#toggle-general-' + curPanel + '-li';
        $(general).removeClass('active');

        var moves = '#toggle-moves-' + curPanel + '-li';
        $(moves).removeClass('active');

        var impor = '#toggle-import-' + curPanel + '-li';
        $(impor).removeClass('active');

        var hide1 = '#mon-' + curPanel + '-general';
        $(hide1).addClass('hidden-button');

        var hide2 = '#mon-' + curPanel + '-moves';
        $(hide2).addClass('hidden-button');

        var hide3 = '#mon-' + curPanel + '-import';
        $(hide3).addClass('hidden-button');

    } else {
        tab = '#' + tab + '-li';
        $(tab).addClass('active');

        var show = '#mon-' + curPanel + '-import';
        $(show).removeClass('hidden-button');

        var general = '#toggle-general-' + curPanel + '-li';
        $(general).removeClass('active');

        var moves = '#toggle-moves-' + curPanel + '-li';
        $(moves).removeClass('active');

        var evs = '#toggle-evs-' + curPanel + '-li';
        $(evs).removeClass('active');

        var hide1 = '#mon-' + curPanel + '-general';
        $(hide1).addClass('hidden-button');

        var hide2 = '#mon-' + curPanel + '-moves';
        $(hide2).addClass('hidden-button');

        var hide3 = '#mon-' + curPanel + '-evs';
        $(hide3).addClass('hidden-button');
    }
}

/**
 * Jquery event handlers
 */
 
 $("input[type='text']").click(function () {
   $(this).select();
});

$(window).load(function() {
    $(".se-pre-con").fadeOut("slow");;
});

$('#chat').submit(() => {
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

$('form.name').submit(() => {
    socket.emit('name chosen', $('#n').val());
    $('#n').val('');
    $('.modal').modal('hide');
    $('#name-btn').addClass('hidden-button');
    $('#m').removeClass('hidden-button');
    return false;
});

$('#export-btn').click(() => {
    socket.emit('send team', 'build importable');
    $('#export').modal('show');
});

$('.panel-tab-item').click((e) => {
    let tab = e.target.id;
    let curPanel = tab.charAt(tab.length - 1);
    changeTab(tab, curPanel);
});

$('.import').click((e) => {
    let pokeno = Number(e.target.id[11]);
    let importArea = '#import-area-' + pokeno;
    socket.emit('import moveset', pokeno, $(importArea).val());
    $(importArea).val("");
    let curTab = 'toggle-general-' + pokeno;
    changeTab(curTab, pokeno)
})

$('.dropdown-toggle').click((e) => {
    var panel = e.target.id;
    var curPanel = panel.charAt(panel.length - 1);
    var target = '#moveset-input-' + curPanel;
    if ($(target).hasClass('hidden-button')) {
        $(target).removeClass('hidden-button');
    } else {
        $(target).addClass('hidden-button');
    }
});

$(document).on('click', '.dropdown-item', function(e) {
    var target = '#' + e.target.id;
    var moveset = $(target).text();
    var pokeno = Number(target.charAt(target.length - 1));
    var mon = '#pokemon-input-' + pokeno;
    var pokemon = $(mon).val();
    socket.emit('get moveset', pokeno, pokemon, moveset);
    var dropdown = '#moveset-input-' + pokeno;
    $(dropdown).addClass('hidden-button');
});

/**
 * Pokemon Changes
 */

$('.pokemon').change((e) => {
    let pokeno = Number(e.target.id[14]);
    socket.emit('pokemon selected', pokeno, e.target.value);
});

$('.item').change((e) => {
    let pokeno = Number(e.target.id[11]);
    socket.emit('item selected', pokeno, e.target.value);
});

$('.ability').change((e) => {
    let pokeno = Number(e.target.id[14]);
    socket.emit('ability selected', pokeno, e.target.value);
});

$('.level').change((e) => {
    let pokeno = Number(e.target.id[12]);
    socket.emit('level change', pokeno, e.target.value);
});

$('.move').change((e) => {
    let id = e.target.id;
    let pokeno = Number(id[11]); //I think this is ok to hardcode
    let moveno = Number(id[13]);
    socket.emit('move selected', pokeno, moveno, e.target.value);
});

$('.shiny').change((e) => {
    let id = e.target.id;
    let pokeno = Number(id[id.length - 1]);
    socket.emit('shiny change', pokeno, $("#shiny-input-" + pokeno).prop("checked"));
});

$('.ev').change((e) => {
    let id = e.target.id;
    let pokeno = Number(id[id.length - 1]); //lol
    let stat = id.substr(0, id.indexOf('-'));
    socket.emit('ev selected', pokeno, stat, e.target.value);
});

$('.nature').change((e) => {
    let pokeno = Number(e.target.id[13]);
    socket.emit('nature selected', pokeno, e.target.value);
});

$('.iv').change((e) => {
    let id = e.target.id;
    let pokeno = Number(id[id.length - 1]); //lol
    let stat = id.substr(0, id.indexOf('-'));
    console.log(pokeno, stat);
    socket.emit('iv selected', pokeno, stat, e.target.value);
});
