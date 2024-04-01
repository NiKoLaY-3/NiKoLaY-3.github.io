"use strict"

const Www = {
    newEl: function( tag ) { return document.createElement(tag); },
    newText: function( str ) { return document.createTextNode(str); },
    clear: function( el ) { while( el.firstChild ) el.removeChild(el.firstChild); return el; },
    append: function( el, child ) { el.appendChild(child); return el; },
    replace: function( el, newchild ) { return Www.append(Www.clear(el),newchild); },
    setText: function( el, text ) { return Www.append(Www.clear(el),Www.newText(text)); },
    addText: function( el, text ) { return Www.append(el,Www.newText(text)); },
    newPara: function( str ) { return Www.append(Www.newEl('p'),Www.newText(str)); },
    newImg: function( src ) { const ret = Www.newEl('img'); ret.src = src; return ret; },
    setCl: function( el, classname ) { el.className = classname; return el; },
    addCl: function( el, classname ) { el.classList.add(classname); return el; },
    delCl: function( el, classname ) { el.classList.remove(classname); return el; },
    clearCl: function( el ) { return Www.setCl(el,''); },
    onclick: function( el, handler ) { el.addEventListener('click',handler); },
    get: function( idstring ) { return document.getElementById(idstring); }
};

/**
 * Модель
 * @constructor
 */
function Model()
{
    const COLUMNS = [ 'A', 'B', 'C' ];
    const field = [];
    var current = Model.NONE;

    for( var r=0; r<3; ++r ) {
        field[r] = [];
        for( var c=0; c<3; ++c )
            field[r][c] = Model.NONE;
    }

    function plrStr( plr )
    {
        return plr == Model.CROSS ? '\u00D7' : (plr == Model.NOUGHT ? '\u25CB' : 'никто');
    }
    /**
     * Сброс поля.
     */
    function resetField()
    {
        for( var r=0; r<3; ++r )
            for( var c=0; c<3; ++c )
                field[r][c] = Model.NONE;
    }

    this.getCellStr = function( r, c ) { return '{'+COLUMNS[c]+(r+1)+'}'; }
    this.getNext = function() { return current; }
    this.getNextStr = function() { return plrStr(current); }
    this.getSpot = function( r, c ) { return field[r][c]; }
    this.getSpotStr = function( r, c ) { return plrStr(field[r][c]); }
    /**
     * Новая игра.
     */
    this.newGame = function()
    {
        resetField();           // сброс поля
        current = Model.CROSS;  // установка текущего игрока
    }
    this.play = function( r, c )
    {
        field[r][c] = current;
        current = (current == Model.CROSS ? Model.NOUGHT : Model.CROSS);
    }
}
Model.NONE = 0;
Model.CROSS = 1;
Model.NOUGHT = 2;

/**
 * Вид
 * @constructor
 */
function View( model )
{
    const log = Www.get('log');
    const newgamebtn = Www.get('newgame-btn');
    const cells = [];
    const buttons = [];
    var ctl = null;

    for( var r=0; r<3; ++r ) {
        cells[r] = [];
        buttons[r] = [];
        for( var c=0; c<3; ++c ) {
            cells[r][c] = Www.get('spot'+r+c);
            const btn = Www.setCl(Www.newEl('button'),'spot');
            btn.spotindex = { r: r, c: c };
            Www.onclick(btn,onSpotClicked);
            buttons[r][c] = btn;
        }
    }
    Www.onclick(newgamebtn,onNewGameClicked);

    function getPlrClass( plr )
    {
        return plr == Model.CROSS ? 'x' : (plr == Model.NOUGHT ? 'o' : '');
    }
    function getNextPlrClass()
    {
        return getPlrClass(model.getNext());
    }
    function prepareCell( r, c )
    {
        var piece = model.getSpot(r,c);
        if( piece == Model.CROSS )
            Www.clear(Www.setCl(cells[r][c],'x'));
        else if( piece == Model.NOUGHT )
            Www.clear(Www.setCl(cells[r][c],'o'));
        else
            Www.replace(Www.setCl(cells[r][c],''),Www.setCl(buttons[r][c],'spot '+getNextPlrClass()));
    }

    function onSpotClicked( ev )
    {
        ctl.handleSpot(ev.target.spotindex.r,ev.target.spotindex.c);
    }
    function onNewGameClicked( ev )
    {
        for( var r=0; r<3; ++r )
            for( var c=0; c<3; ++c )
                Www.replace(cells[r][c],Www.addCl(buttons[r][c],'x'));
        ctl.handleNewGame();
    }

    this.setController = function( controller ) { ctl = controller; }
    this.log = function( str ) { Www.append(log,Www.newPara(str)); }
    this.logRestart = function( str ) { Www.append(Www.clear(log),Www.newPara(str)); }
    this.prepareMove = function()
    {
        for( var r=0; r<3; ++r ) {
            for( var c=0; c<3; ++c ) {
                prepareCell(r,c);
            }
        }
    }
}

/**
 * Контроллер
 * @constructor
 */
function Controller( model, view )
{
    this.run = function()
    {
        view.setController(this);
        view.log('Приложение запущено ОК');
    }
    this.handleSpot = function( r, c )
    {
        var plr = model.getNext();
        model.play(r,c);
        view.log(model.getSpotStr(r,c)+' помещен в '+model.getCellStr(r,c));
        view.log('Ход '+model.getNextStr());
        view.prepareMove();
    }
    this.handleNewGame = function()
    {
        model.newGame();
        view.logRestart('Новая игра!');
        view.log('Ход '+model.getNextStr());
        view.prepareMove();
    }
}

/**
 * Launch the program.
 */
window.addEventListener('load',function(ev){
    const model = new Model();
    const view = new View(model);
    const ctl = new Controller(model,view);
    ctl.run();
});
