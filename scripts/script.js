"use strict"

var GameBoard = (function () {
    var _availPositions = 9;

    var _board = new Array(9);
    resetBoard();


    function getEmpty() {
        return _availPositions;
    }

    function updateBoard(position, player) {
        let success = true;
        if (_board[position] != null) {
            success = false;
        } else {
            _board[position] = player;
            _availPositions--;
        }

        return success;
    }

    function resetBoard() {
        _board.fill(null);
    }

    function removePosition(position) {
        _board[position] = null;
    }

    function isWin(position) {
        let result = [];

        let row = (position / 3) * 3;
        let column = position % 3;

        if (_board[row] == _board[row + 1] && _board[row + 1] == _board[row + 2]) { // Check for row
            result.push(row);
            result.push(row + 1);
            result.push(row + 2);
        } else if (_board[column] == _board[3 + column] && _board[3 + column] == _board[6 + column]) { // Check for column
            result.push(column);
            result.push(3 + column);
            result.push(6 + column);
        } else if (_board[0] == _board[4] && _board[4] == _board[8]) { // Check for diagonal from left to right
            result.push(0);
            result.push(4);
            result.push(8);
        } else if (_board[2] == _board[4] && _board[4] == _board[6]) { // Check for diagonal from right to left
            result.push(2);
            result.push(4);
            result.push(6);
        } else { // Couldn't find the win
            result = false;
        }
        
        return result;
    }

    return { 
        updateBoard,
        resetBoard, 
        isWin 
    };
})();


var Player = (name) => {
    var isRobot = false;
    
    function getName() {
        return name;
    }

    return { getName, isRobot: isRobot};
}


var DisplayController = (function (){
    const _elGrid = document.getElementsByClassName('square');
    _elGrid.forEach(square => {
        square.addEventListener('click', GameFlow.updateGame.bind(square.id));
    });

    const _elStartBtn = document.getElementById('start-btn');
    _elStartBtn.addEventListener('click', GameFlow.startGame);

    const _elPlayerChoice = document.getElementsByName('player-choice');
    const _elMode = document.getElementById('game-mode');
    const _elStatusLabel = document.getElementById('status-label');

    function updateGrid(position, player) {
        let sprite = document.createElement('img');
        sprite.src = new URL('../images/' + player.getName() + '.png')

        _elGrid[position].appendChild(sprite);

        updateLabel((player.getName == 'cross' ? 'Cross' : 'Nought') + ', now is your turn.');
    }

    function updateLabel(message) {
        _elStatusLabel.innerHTML = message;
    }

    function clearGrid() {
        _elGrid.forEach(square => {
            square.firstChild.remove();
        });

        updateLabel('');
    }

    function greetWinner(positions, player) {
        let sprite = document.createElement('img');
        sprite.src = new URL('../images/' + player.getName() + '_win.png');

        _elGrid[positions[0]].firstChild.remove();
        _elGrid[positions[0]].appendChild(sprite);
        _elGrid[positions[1]].firstChild.remove();
        _elGrid[positions[1]].appendChild(sprite);
        _elGrid[positions[2]].firstChild.remove();
        _elGrid[positions[2]].appendChild(sprite);

        updateLabel(player.getName() + ' has won, congratulations!');
    }

    function getChoice() {
        return _elPlayerChoice[0].checked ? _elPlayerChoice[0].id : _elPlayerChoice[1].id;
    }

    function getMode() {
        return _elMode.value;
    }

    return {
        updateGrid,
        clearGrid,
        greetWinner,
        getChoice,
        getMode,
    }
})();


var GameFlow = (function (){
    var isPlaying = false;
    var gameMode;
    var crossPlayer = Player('cross');
    var noughtPlayer = Player('nought');
    var currentPlayer;

    function updateGame(position) {
        if (isPlaying) {
            if (GameBoard.updateBoard(position, currentPlayer)) {
                let win = GameBoard.isWin();
    
                if (win) {
                    GameBoard.greetWinner(win, currentPlayer);
                    isPlaying = false;
                } else {
                    DisplayController.updateGrid(position, currentPlayer);
                    currentPlayer = currentPlayer == crossPlayer ? noughtPlayer : crossPlayer;

                    // TODO: rewrite
                    if (currentPlayer.isRobot) {
                        let computerMove = 0;
                        if (GameBoard.getEmpty() > 5) {
                            while(!GameBoard.updateBoard(computerMove, currentPlayer)) {
                                computerMove = randomInt(0, 9);
                            }
                            
                            GameBoard.removePosition(computerMove);
                        } else {
                            computerMove = generateMove();
                        }
                        
                        updateGame(computerMove);
                    }
        
                }
                
            }
        }
    }

    function startGame() {
        GameBoard.resetBoard()
        DisplayController.clearGrid();

        isPlaying = true;
        gameMode = DisplayController.getMode();
        
        let choice = DisplayController.getChoice();
        if (choice == 'cross-choice') {
            crossPlayer.isRobot = false;

            if (gameMode == 'COMPUTER_MODE') {
                noughtPlayer.isRobot = true;
            }
        } else {
            noughtPlayer.isRobot = false;

            if (gameMode == 'COMPUTER_MODE') {
                crossPlayer.isRobot = true;
            }
        }

        currentPlayer = crossPlayer;
        DisplayController.updateLabel(currentPlayer.getName() + ', now is your turn.');

        if (currentPlayer.isRobot) {
            let computerMove = randomInt(0, 9);
            updateGame(computerMove);
        }
    }

    function generateMove() {
       
    }
    
    function minimax(root, board, depth, isMaximizer){
       
    }
})();


function randomInt(min, max) {
    return min + Math.floor(Math.random() * max);
}


