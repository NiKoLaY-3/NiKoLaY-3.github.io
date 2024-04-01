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
    var winner = Model.NONE;
    var finished = false;

    for( var r=0; r<3; ++r ) {
        field[r] = [];
        for( var c=0; c<3; ++c )
            field[r][c] = Model.NONE;
    }

    /**
     * Объект с параметрами игрока.
     * @constructor
     */
    function Player( type )
    {
        this.type = type;
        this.str = (type == Model.CPU ? 'CPU' : (type == Model.HUMAN ? 'Гуманоид' : 'некто'));
    }
    /**
     * Объект с параметрами ячейки.
     * @constructor
     */
    function Cell( r, c )
    {
        this.row = r;
        this.column = c;
        this.threat = false;    // является ли угрозой (соперник выиграет если в нее сыграет)
        this.chance = false;    // является ли шансом (мы выиграем если в нее сыграем)
    }

    /**
     * Список доступных ячеек (класса Cell).
     */
    function makeAvailableList()
    {
        var ret = [];
        for( var r=0; r<3; ++r )
            for( var c=0; c<3; ++c )
                if( field[r][c] == Model.NONE )
                    ret.push(new Cell(r,c));
        return ret;
    }
    /**
     * Строка со значком игрока plr.
     */
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
    /**
     * Определяем кто заполнил строку row.
     */
    function getRowOwner( row )
    {
        var who = field[row][0];
        if( who != Model.NONE ) {
            for( var c=1; c<3; ++c ) {
                if( field[row][c] != who ) {
                    return Model.NONE;
                }
            }
            return who;
        } else
            return Model.NONE; // никто не завершил строку
    }
    /**
     * Определяем кто заполнил столбец column.
     */
    function getColumnOwner( column )
    {
        var who = field[column][0];
        if( who != Model.NONE ) {
            for( var r=1; r<3; ++r ) {
                if( field[r][column] != who ) {
                    return Model.NONE;
                }
            }
            return who;
        } else
            return Model.NONE; // никто не завершил столбец
    }
    /**
     * Определяем кто заполнил диагональ (главную или побочную).
     */
    function getDiagonalOwner( main )
    {
        var who = main ? field[0][0] : field[0][2];
        if( who != Model.NONE ) {
            for( var r=1; r<3; ++r ) {
                if( field[r][main?r:3-r-1] != who ) {
                    return Model.NONE;
                }
            }
            return who;
        } else
            return Model.NONE; // никто не завершил столбец
    }
    /**
     * Проверка на окончание игры.
     */
    function checkGameEnd()
    {
        winner = Model.NONE;
        var who = winner;
        for( var i=0; i<3; ++i ) {
            who = getRowOwner(i);
            if( who != Model.NONE ) { winner = who; finished = true; return; }
            who = getColumnOwner(i);
            if( who != Model.NONE ) { winner = who; finished = true; return; }
        }
        who = getDiagonalOwner(true);
        if( who != Model.NONE ) { winner = who; finished = true; return; }
        who = getDiagonalOwner(false);
        if( who != Model.NONE ) { winner = who; finished = true; return; }
        if( winner == Model.NONE ) {
            var list = makeAvailableList();
            finished = list.length == 0;
        } else {
            finished = true;
        }
    }

    this.isFinished = function() { return finished; }
    this.getWinner = function() { return winner; }
    this.getWinnerStr = function() { return plrStr(winner); }
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
        winner = Model.NONE;    // никто не победил
        finished = false;       // игра идет
    }
    this.play = function( r, c )
    {
        field[r][c] = current;
        checkGameEnd();
        current = (winner != Model.NONE ? Model.NONE : (current == Model.CROSS ? Model.NOUGHT : Model.CROSS));
    }
}
Model.NONE = 0;
Model.CROSS = 1;
Model.NOUGHT = 2;
Model.CPU = 0;
Model.HUMAN = 1;

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
        else {
            if( !model.isFinished() )
                Www.replace(Www.setCl(cells[r][c],''),Www.setCl(buttons[r][c],'spot '+getNextPlrClass()));
            else
                Www.clear(Www.setCl(cells[r][c],''));
        }
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
    function reset()
    {
        model.newGame();
        view.logRestart('Новая игра!');
    }
    function play( r, c )
    {
        var plr = model.getNext();
        model.play(r,c);
        view.log(model.getSpotStr(r,c)+' сыграл в '+model.getCellStr(r,c));
    }
    function next()
    {
        view.prepareMove();
        if( model.isFinished() ) {
            var winner = model.getWinner();
            if( winner != Model.NONE ) {
                var winnerstr = model.getWinnerStr();
                view.log('Игра окончена! Победитель: '+winnerstr+'!');
            } else {
                view.log('Игра завершилась вничью!');
            }
        } else {
            view.log('Ходит '+model.getNextStr());
        }
    }

    this.run = function()
    {
        view.setController(this);
        view.log('Приложение запущено ОК');
    }
    this.handleSpot = function( r, c )
    {
        play(r,c);
        next();
    }
    this.handleNewGame = function()
    {
        reset();
        next();
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
