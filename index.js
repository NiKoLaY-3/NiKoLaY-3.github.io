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
    this.cellStr = function( r, c ) { return '{'+COLUMNS[c]+(r+1)+'}'; }
}

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
        alert('button '+model.cellStr(r,c)+' clicked');
    }
    this.handleNewGame = function()
    {
        alert('New Game!');
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
