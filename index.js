"use strict"

/**
 * Утилиты для работы с DOM.
 */
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
    const players = [
        null,
        new Player(Model.CPU),  // игрок за X
        new Player(Model.HUMAN) // игрок за O
    ];
    const colors = [
        Model.CROSS,    // фигурка CPU
        Model.NOUGHT    // фигурка игрока
    ]
    var hard_mode = false;      // умный бот?
    var current = Model.NONE;   // кто ходит
    var winner = Model.NONE;    // кто победил
    var finished = false;       // закончена ли игра

    for( var r=0; r<3; ++r ) {
        field[r] = [];
        for( var c=0; c<3; ++c )
            field[r][c] = Model.NONE;
    }

    /**
     * Объект с параметрами игрока.
     * @constructor
     */
    function Player( tp )
    {
        var type;
        var namestr;

        change(tp);

        function change( tp )
        {
            type = tp;
            if( type == Model.CPU ) namestr = 'CPU'; else namestr = 'Гуманоид';
        }

        this.getType = function() { return type; }
        this.getName = function() { return namestr; }
        this.setType = function( tp ) { change(tp); }
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
     * Проверка угроза ли клетка {row,col} со стороны игрока opp.
     */
    function isThreat( row, col, opp )
    {
        // проверим столбец
        var result = true;
        for( var r=0; r<3; ++r ) {
            if( (r!=row) && (field[r][col] != opp) )
                result = false;
        }
        if( result ) return result;
        // проверим строку
        result = true;
        for( var c=0; c<3; ++c ) {
            if( (c!=col) && (field[row][c] != opp) )
                result = false;
        }
        if( result ) return true;
        // проверим диагональ главную
        if( row == col ) {
            result = true;
            for( var i=0; i<3; ++i ) {
                if( (i!=col) && (field[i][i] != opp) )
                    result = false;
            }
            if( result ) return true;
        }
        // проверим диагональ побочную
        if( row == 3-col-1 ) {
            result = true;
            for( var i=0; i<3; ++i ) {
                if( (i!=row) && (field[i][3-i-1] != opp) )
                    result = false;
            }
        }
        return result;
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
        var who = field[0][column];
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
     * Распределяем клетки в соответствии с уровнем
     * предпочтительности и выбираем верхнюю.
     */
    function selectMove()
    {
        var list = makeAvailableList();
        // если первый ход, ходим в центр
        if( list.length == 9 ) return { row: 1, column: 1 };
        // иначе рассчитываем угрозы и шансы
        var me = colors[Model.CPU];
        var opp = colors[Model.HUMAN];
        for( var i in list ) {
            var r = list[i].row;
            var c = list[i].column;
            list[i].threat = isThreat(r,c,opp);
            list[i].chance = isThreat(r,c,me);
        }
        list.sort(function(a,b){
            if( a.chance ) return -1;
            else if( b.chance ) return 1;
            else if( a.threat ) return -1;
            else if( b.threat ) return 1;
            else return 0;
        });
        return { row: list[0].row, column: list[0].column };
    }
    /**
     * Просто выбираем случайную клетку!
     */
    function selectMoveSimple()
    {
        var list = makeAvailableList();
        var index = Math.floor(Math.random()*list.length);
        return { row: list[index].row, column: list[index].column };
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
        var list = makeAvailableList();
        finished = (list.length == 0);
    }

    this.isFinished = function() { return finished; }
    this.getWinner = function() { return winner; }
    this.getWinnerStr = function() { return plrStr(winner); }
    this.getCellStr = function( r, c ) { return '{'+COLUMNS[c]+(r+1)+'}'; }
    this.getNext = function() { return current; }
    this.getNextStr = function() { return plrStr(current); }
    this.getNextType = function() { return players[current].getType(); }
    this.getNextName = function() { return players[current].getName(); }
    this.getPlrType = function( plr ) { return players[plr].getType(); }
    this.getPlrName = function( plr ) { return players[plr].getName(); }
    this.getSpot = function( r, c ) { return field[r][c]; }
    this.getSpotStr = function( r, c ) { return plrStr(field[r][c]); }
    /**
     * Новая игра.
     */
    this.newGame = function( cpu_side, cpu_hard )
    {
        resetField();           // сброс поля
        var cpu = (cpu_side == Model.NONE ? Model.CROSS + Math.floor(Math.random() * 2) : cpu_side);
        var human = (cpu == Model.CROSS ? Model.NOUGHT : Model.CROSS);
        players[cpu].setType(Model.CPU);
        players[human].setType(Model.HUMAN);
        colors[Model.CPU] = cpu;
        colors[Model.HUMAN] = human;
        hard_mode = !!cpu_hard;
        current = Model.CROSS;  // установка текущего игрока
        winner = Model.NONE;    // никто не победил
        finished = false;       // игра идет
    }
    /**
     * Обработка хода в {r,c}.
     */
    this.play = function( r, c )
    {
        field[r][c] = current;
        checkGameEnd();
        current = (winner != Model.NONE ? Model.NONE : (current == Model.CROSS ? Model.NOUGHT : Model.CROSS));
    }
    /**
     * Генерация хода.
     * Возвращает объект {row,column}.
     */
    this.generateMove = function()
    {
        return hard_mode ? selectMove() : selectMoveSimple();
    }
}
Model.NONE = 0;     // никто
Model.CROSS = 1;    // крестик
Model.NOUGHT = 2;   // нолик
Model.CPU = 0;      // бот
Model.HUMAN = 1;    // человек

/**
 * Вид
 * @constructor
 */
function View( model )
{
    const log = Www.get('log');
    const newgamebtn = Www.get('newgame-btn');
    const sideselector = Www.get('cpu-side');
    const levelselector = Www.get('cpu-level');
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
            if( (!model.isFinished()) && (model.getNextType()==Model.HUMAN) )
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

    this.getSelectedSide = function()
    {
        var sidestr = sideselector.value;
        return (sidestr=='X' ? Model.CROSS : (sidestr=='O' ? Model.NOUGHT : Model.NONE));
    }
    this.getHardMode = function()
    {
        var lvlstr = levelselector.value;
        return (lvlstr=='high');
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
    function logMove()
    {
        view.log('Ходит '+model.getNextStr()+' ('+model.getNextName()+')');
    }
    function reset()
    {
        // начало новой игры
        model.newGame(view.getSelectedSide(),view.getHardMode());
        view.logRestart('Новая игра! (\u00D7: '+model.getPlrName(Model.CROSS)+', \u25CB: '+model.getPlrName(Model.NOUGHT)+')');
    }
    function play( r, c )
    {
        // обработка хода игрока
        var plr = model.getNext();
        model.play(r,c);
        view.log(model.getSpotStr(r,c)+' сыграл в '+model.getCellStr(r,c));
    }
    function next()
    {
        // проверка на конец игры и сообщение соответствующее или подготовка к ходу
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
            logMove();
            if( model.getNextType() == Model.CPU ) {
                view.log('Думаем...');
                var move = model.generateMove();
                setTimeout(function(){
                    play(move.row,move.column);
                    next();
                },1000);
            }
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
