 /* This script file handles the game logic */
var maxColumn = 10;
var maxRow = 10;
var maxIndex = maxColumn * maxRow;
var board = new Array(maxIndex);
var currentColumn, currentRow;
var direction = 1;
var saved_board = [];
var component;
var scoreTable = [1, 4, 10, 2, 5, 11];

//Index function used instead of a 2D array
function index(column, row) {
    return column + (row * maxColumn);
}

function startNewGame() {
    //Calculate board size
    maxColumn = Math.floor(gameCanvas.width / gameCanvas.blockSize);
    maxRow = Math.floor(gameCanvas.height / gameCanvas.blockSize);
    maxIndex = maxRow * maxColumn;
//    console.log("cr:", maxColumn,maxRow);

    currentColumn = -1;
    currentRow = maxRow-1;

    //Close dialogs
    dialog.hide();

    try {
        for(var i in board)
            if(board[i] != null) {
                board[i].dying = true;
            }
    } catch(e) {}
    //Initialize Board
    board = new Array(maxIndex);

    gameCanvas.score = 0;
    for (var column = 0; column < maxColumn; column++) {
        for (var row = 0; row < maxRow; row++) {
            board[index(column, row)] = null;
            createBlock(column, row);
        }
    }
//    printMap();
}

function printMap() {
    console.log('---------------');
    var temp_str, column, row;
    for (row = 0; row < maxRow; row++) {
        temp_str = '';
        for (column = 0; column < maxColumn; column++) {
            if (board[index(column, row)] != null) {
                temp_str += board[index(column, row)].type + " ";
            }
            else temp_str += "x ";
        }
        console.log(temp_str);
    }
    console.log('---------------');
}

var second = null;

function createBlock(column, row) {
    if (component == null)
        component = Qt.createComponent("Block.qml");

    // Note that if Block.qml was not a local file, component.status would be
    // Loading and we should wait for the component's statusChanged() signal to
    // know when the file is downloaded and ready before calling createObject().
    if (component.status == Component.Ready) {
        var dynamicObject = component.createObject(gameCanvas);
        if (dynamicObject == null) {
            console.log("error creating block");
            console.log(component.errorString());
            return false;
        }
        var current_type = Math.floor(Math.random() * 6);
        while(findFill(column, row, current_type)) current_type = Math.floor(Math.random() * 6);

        dynamicObject.type = current_type;
        dynamicObject.x = column * gameCanvas.blockSize;
        dynamicObject.y = row * gameCanvas.blockSize;
        dynamicObject.width = gameCanvas.blockSize;
        dynamicObject.height = gameCanvas.blockSize;
        dynamicObject.particleSystem= gameCanvas.ps;
        dynamicObject.spawned = true;
        dynamicObject.shuffle = false;
        board[index(column, row)] = dynamicObject;
    } else {
        console.log("error loading block component");
        console.log(component.errorString());
        return false;
    }
    return true;
}

// 检查连接了多少相同块，能否放在此处
// 能消掉返回true
function findFill(col, row, current_type) {
    var s, n, e, w;
    s = n = row;
    while (s < maxRow-1 && board[index(col, s+1)] != null && board[index(col, s+1)].type == current_type) s++;
    while (n > 0 && board[index(col, n-1)] != null && board[index(col, n-1)].type == current_type) n--;
    e = w = col;
    while (e < maxColumn-1 && board[index(e+1, row)] != null && board[index(e+1, row)].type == current_type) e++;
    while (w > 0 && board[index(w-1, row)] != null && board[index(w-1, row)].type == current_type) w--;
    return (s - n >= 2 || e - w >= 2);
}

var first_selected = null;
var second_selected = null;
var westest = maxColumn-1;
var eastest = 0;
var northest = maxRow-1;
var southest = 0;

//![1]
function handleClick(xPos, yPos) {
    var column = Math.floor(xPos / gameCanvas.blockSize);
    var row = Math.floor(yPos / gameCanvas.blockSize);
    if (column >= maxColumn || column < 0 || row >= maxRow || row < 0)
        return;
    if (board[index(column, row)] == null)
        return;

//    console.log('clicked', column, row, board[index(column, row)].x, board[index(column, row)].y, board[index(column, row)].dying, board[index(column, row)].spawned, board[index(column, row)].opacity);
    if (first_selected == null) {
        first_selected = [column, row];
        board[index(column, row)].opacity = 0.5; // 选中变透明
    } else if ((column - 1 == first_selected[0] && row == first_selected[1])
               || (column + 1 == first_selected[0] && row == first_selected[1])
               || (column == first_selected[0] && row + 1 == first_selected[1])
               || (column == first_selected[0] && row - 1 == first_selected[1])) {
        second_selected = [column, row];
        swapBlock();
        board[index(first_selected[0], first_selected[1])].opacity = 1;


        var maxFillFound = floodFill(first_selected[0], first_selected[1]);
        gameCanvas.score += (maxFillFound >= 3 ? scoreTable[maxFillFound - 3] : 0);
        var temp_sc = floodFill(column, row);
        maxFillFound = Math.max(maxFillFound, temp_sc);
        gameCanvas.score += (temp_sc >= 3 ? scoreTable[temp_sc - 3] : 0);
//        console.log('after first round, fillFound: ' + maxFillFound);
        if (maxFillFound <= 2) {
            swapBlock(function() {
                first_selected = null;
            });
            return;
        } else {
            first_selected = null;
            screen.shuffle();
        }
    } else {
        board[index(first_selected[0], first_selected[1])].opacity = 1;
        first_selected = [column, row];
        board[index(column, row)].opacity = 0.5;
    }
}
//![1]

function swapBlock(callback) {
    var temp = board[index(first_selected[0], first_selected[1])].type;
    board[index(first_selected[0], first_selected[1])].type = board[index(second_selected[0], second_selected[1])].type;
    board[index(second_selected[0], second_selected[1])].type = temp;
    if(callback != null) callback();
}

// 消除块
function floodFill(column, row) {
    var temps, tempn, tempe, tempw;
    var sc = 0;
    var current_type = board[index(column, row)].type;
    temps = row;
    tempn = row;
    while (temps < maxRow-1 && board[index(column, temps+1)] != null && board[index(column, temps+1)].type == current_type) temps++;
    while (tempn > 0 && board[index(column, tempn-1)] != null && board[index(column, tempn-1)].type == current_type) tempn--;

    tempe = column;
    tempw = column;
    while (tempe < maxColumn-1 && board[index(tempe+1, row)] != null && board[index(tempe+1, row)].type == current_type) tempe++;
    while (tempw > 0 && board[index(tempw-1, row)] != null && board[index(tempw-1, row)].type == current_type) tempw--;

    var i;
    if (temps-tempn >= 2) {
        if(tempe > eastest) eastest = tempe;
        if(tempw < westest) westest = tempw;
        if(temps > southest) southest = temps;
//        console.log("fill column" + column + ",", tempn, temps);
        for (i = tempn; i <= temps; i++) {
            if (board[index(column, i)] != null) {
                board[index(column, i)].dying = true;
                board[index(column, i)] = null;
            }
        }
        sc += (temps-tempn+1);
    }
    if (tempe-tempw >= 2) {
        if(tempe > eastest) eastest = tempe;
        if(tempw < westest) westest = tempw;
        if(temps > southest) southest = temps;
//        console.log("fill row" + row + ",", tempw, tempe);
        for (i = tempw; i <= tempe; i++) {
            if (board[index(i, row)] != null) {
                board[index(i, row)].dying = true;
                board[index(i, row)] = null;
            }
        }
        sc += (tempe-tempw+1);
    }
    return sc;
}

function shuffleDown() {
    //Fall down
//    console.log("before shuffle down:");
//    printMap();
    for (var column = 0; column < maxColumn; column++) {
        for (var row = maxRow - 1; row >= 0; row--) {
            var fallDist = 0;
            if (board[index(column, row)] == null) {
                while(row-fallDist >= 0 && board[index(column, row-fallDist)] == null) fallDist += 1;
                if(row-fallDist < 0) break;
                board[index(column, row)] = board[index(column, row-fallDist)];
                board[index(column, row - fallDist)] = null;
                board[index(column, row)].y = (row * gameCanvas.blockSize);
            }
        }
    }
//    console.log("after shuffle down:");
//    printMap();
}

//![2]
function victoryCheck() {
    var column, row;

    var gameOver = true;
    for (column = 0; column < maxColumn && gameOver; column++) {
        for (row = maxRow-1; row >= 0 && gameOver; row--) {
            if(board[index(column, row)] == null) continue;
            // try swap left
            if(column+1 < maxColumn && board[index(column+1, row)] != null) {
                swap(board[index(column, row)], board[index(column+1, row)]);
                if(findFill(column, row, board[index(column, row)].type) ||
                        findFill(column+1, row, board[index(column+1, row)].type))
                    gameOver = false;

                swap(board[index(column, row)], board[index(column+1, row)]);
            }
            // try swap top
            if(row-1 >= 0 && board[index(column, row-1)] != null) {
                swap(board[index(column, row)], board[index(column, row-1)]);
                if(findFill(column, row, board[index(column, row)].type) ||
                        findFill(column, row-1, board[index(column, row-1)].type))
                    gameOver = false;

                swap(board[index(column, row)], board[index(column, row-1)]);
            }
        }
    }

    // Check whether game has finished
    if (gameOver)
        dialog.show("Game Over. Your score is " + gameCanvas.score);
    return gameOver;
}
//![2]

function floodCheck(){
    var maxScore;
    var temp_score;
    maxScore = 0;

    var i, j;
    for(i = 0; i <= maxColumn; i++) {
        for(j = 0; j <= maxRow; j++) {
            if(board[index(i, j)] != null) {
                temp_score = floodFill(i, j);
                gameCanvas.score += ((temp_score>=3) ? scoreTable[temp_score-3] : 0);
                maxScore = Math.max(maxScore, temp_score);
            }
        }
    }

//    console.log("score: " + maxScore);
    if(maxScore >= 2) {
        return true;
    } else return false;
}

function swap(block1, block2) {
    var temp = block1.type;
    block1.type = block2.type;
    block2.type = temp;
}

function swapRight() {
    if(board[index(currentColumn, currentRow)] == null) return false;
    if(currentColumn == maxColumn || board[index(currentColumn+1, currentRow)] == null) return false;
    swap(board[index(currentColumn, currentRow)], board[index(currentColumn+1, currentRow)]);
    var maxScore = floodFill(currentColumn, currentRow);
    gameCanvas.score += ((maxScore>=3) ? scoreTable[maxScore-3] : 0);
    var temp_score = floodFill(currentColumn+1, currentRow);
    gameCanvas.score += ((temp_score>=3) ? scoreTable[temp_score-3] : 0);
    maxScore = Math.max(maxScore, temp_score);
    return (maxScore >= 2);
}

function swapTop() {
    if(board[index(currentColumn, currentRow)] == null) return false;
    if(currentRow == 0 || board[index(currentColumn, currentRow-1)] == null) return false;
    swap(board[index(currentColumn, currentRow)], board[index(currentColumn, currentRow-1)]);
    var maxScore = floodFill(currentColumn, currentRow);
    gameCanvas.score += ((maxScore>=3) ? scoreTable[maxScore-3] : 0);
    var temp_score = floodFill(currentColumn, currentRow-1);
    gameCanvas.score += ((temp_score>=3) ? scoreTable[temp_score-3] : 0);
    maxScore = Math.max(maxScore, temp_score);
    return (maxScore >= 2);
}

function storeBoard() {
    var type_map = [];
    for(var i in board) {
        if(board[i] == null) type_map.push(null);
        else type_map.push(board[i].type);
    }
    saved_board.push({
                         board: type_map,
                         currentColumn: currentColumn,
                         currentRow: currentRow,
                         score: gameCanvas.score,
                         direction: direction
                     });
}

function restoreBoard() {
    if(saved_board.length == 0) return false;
    var temp_board = saved_board.pop();
    var type_map = temp_board['board'];
    currentColumn = temp_board['currentColumn'];
    currentRow = temp_board['currentRow'];
    gameCanvas.score = temp_board['score'];
    direction = temp_board['direction'];
    var column, row;
    var i;
    for(column = 0; column < maxColumn; column++)
        for(row = 0; row < maxRow; row++) {
            i = index(column, row);
            if(type_map[i] == null) board[i] = null;
            else if(board[i] == null) {
                var dynamicObject = component.createObject(gameCanvas);
                if (dynamicObject == null) {
//                    console.log("error creating block");
//                    console.log(component.errorString());
                    return false;
                }

                dynamicObject.type = type_map[i];
                dynamicObject.x = column * gameCanvas.blockSize;
                dynamicObject.y = row * gameCanvas.blockSize;
                dynamicObject.width = gameCanvas.blockSize;
                dynamicObject.height = gameCanvas.blockSize;
                dynamicObject.particleSystem= gameCanvas.ps;
                dynamicObject.spawned = true;
                dynamicObject.shuffle = false;
                board[i] = dynamicObject;
            }
            else board[i].type = type_map[i];
        }
    return true;
}
