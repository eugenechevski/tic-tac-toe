"use strict"

/**
 * Factory function which produces player's objects.
 */
var Player = (name) => {
    var isRobot = false;
    
    function getName() {
        return name;
    }

    return { getName, isRobot: isRobot};
}


/**
 * The main control-center, which manages all the other functionality.
 */
 var GameFlow = (function (){
    var _isPlaying = false;
    var _gameMode;
    var _crossPlayer = Player('Cross');
    var _noughtPlayer = Player('Nought');
    var _currentPlayer;

    function updateGame(position) {
        if (_isPlaying) {
            if (GameBoard.updateBoard(position, _currentPlayer)) {
                let win = GameBoard.isWin(position);
    
                if (win) { 
                    DisplayController.greetWinner(win, _currentPlayer);
                    _isPlaying = false;
                } else if (GameBoard.getEmpty() == 0) {
                    _isPlaying = false;
                    DisplayController.updateGrid(position, _currentPlayer);
                    DisplayController.updateLabel('Tie!');
                } else {
                    DisplayController.updateGrid(position, _currentPlayer);
                    _currentPlayer = _currentPlayer == _crossPlayer ? _noughtPlayer : _crossPlayer;
                    DisplayController.updateLabel(_currentPlayer.getName() + ', now is your turn.');

                    if (_currentPlayer.isRobot) {
                        updateGame(minimax(randomInt(0, 9), 0, true));
                    }
                }
            }
        }
    }

    function startGame() {
        GameBoard.resetBoard()
        DisplayController.clearGrid();

        _isPlaying = true;
        _gameMode = DisplayController.getMode();
        
        let choice = DisplayController.getChoice();
        if (choice == 'CROSS_CHOICE') {
            _crossPlayer.isRobot = false;

            if (_gameMode == 'COMPUTER_MODE') {
                _noughtPlayer.isRobot = true;
            } else {
                _noughtPlayer.isRobot = false;
            }
        } else {
            _noughtPlayer.isRobot = false;

            if (_gameMode == 'COMPUTER_MODE') {
                _crossPlayer.isRobot = true;
            } else {
                _crossPlayer.isRobot = false;
            }
        }

        _currentPlayer = _crossPlayer; // Cross moves first
        DisplayController.updateLabel(_currentPlayer.getName() + ', now is your turn.');

        if (_currentPlayer.isRobot) {
            updateGame(randomInt(0, 9));
        }
    }

    function minimax(position, depth, isMaximizer){
        if (GameBoard.isWin(position)) {
            return depth == 0 ? pos : [(!isMaximizer ? 1 : -1), depth];
        } else if (GameBoard.getEmpty() == 0) {
            return [0, depth];
        }

        let bestResult;
        let bestPosition = -1;
        if (isMaximizer) {
            bestResult = [-2, 0];

            for (let i = 0; i < 9; i++) {
                if (GameBoard.updateBoard(i, _currentPlayer)) {
                    let result = minimax(i, depth + 1, false);
                    GameBoard.removePosition(i);

                    if (result[0] > bestResult[0] || (result[0] == bestResult[0] && result[1] < bestResult[1])) {
                        bestResult = result;
                        bestPosition = i;
                    }
                }
            }

        } else {
            bestResult = [2, 0];

            for (let i = 0; i < 9; i++) {
                if (GameBoard.updateBoard(i, (_currentPlayer == _crossPlayer ? _noughtPlayer : _crossPlayer))) {
                    let result = minimax(i, depth + 1, true);
                    GameBoard.removePosition(i);

                    if (result[0] < bestResult[0] || (result[0] == bestResult[0] && result[1] < bestResult[1])) {
                        bestResult = result;
                    }
                }
            }            
        }

        return depth == 0 ? bestPosition : bestResult;
    }

    return {
        updateGame,
        startGame,
    }

})();


/**
 * The logical representation of the game board.
 */
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
        _availPositions = 9;
    }

    function removePosition(position) {
        _board[position] = null;
        _availPositions++;
    }

    function isWin(position) {
        let result = false;

        if (getEmpty() < 6)  {
            let positions = [];
    
            let row = Math.floor(position / 3) * 3;
            let column = position % 3;
    
            if (_board[row] != null && 
                _board[row] == _board[row + 1] && 
                _board[row + 1] == _board[row + 2]) { // Check for row

                positions.push(row);
                positions.push(row + 1);
                positions.push(row + 2);
            } else if (_board[column] != null & 
                       _board[column] == _board[3 + column] &&
                       _board[3 + column] == _board[6 + column]) { // Check for column

                positions.push(column);
                positions.push(3 + column);
                positions.push(6 + column);
            } else if (_board[0] != null && 
                       _board[0] == _board[4] && 
                       _board[4] == _board[8]) { // Check for diagonal from left to right

                positions.push(0);
                positions.push(4);
                positions.push(8);
            } else if (_board[2] != null &&
                       _board[2] == _board[4] && 
                       _board[4] == _board[6]) { // Check for diagonal from right to left

                positions.push(2);
                positions.push(4);
                positions.push(6);
            }
            
            if (positions.length == 3) {
                result = positions;
            }
        } 

        return result;
    }

    return { 
        updateBoard,
        resetBoard, 
        isWin,
        getEmpty,
        removePosition
    };
})();


/**
 * Controller of the display, which renders the logical representation of the game into the graphical.
 */
var DisplayController = (function (){
    const _elGrid = Array.from(document.getElementsByClassName('square'));
    _elGrid.forEach(square => square.addEventListener('click', GameFlow.updateGame.bind(event, square.id)));    

    // Controls 

    const _elControlsDiv = document.getElementById('controls');
    const _elStartBtn = document.getElementById('start-btn');
    _elStartBtn.addEventListener('click', GameFlow.startGame);

    const _elPlayerChoiceDiv = document.getElementById('playerChoice');
    _elPlayerChoiceDiv.remove();

    const _elPlayerChoice = document.getElementsByName('player-choice');

    const _elMode = document.getElementById('game-mode');
    _elMode.addEventListener('change', () => { _elControlsDiv.insertBefore(_elPlayerChoiceDiv, _elMode) }); // TODO

    const _elStatusLabel = document.getElementById('status-label');


    function updateGrid(position, player) {
        let sprite = document.createElement('img');
        sprite.src = '../images/' + player.getName() + '.png';

        _elGrid[position].appendChild(sprite);
    }

    function updateLabel(message) {
        _elStatusLabel.innerHTML = message;
    }

    function clearGrid() {
        _elGrid.forEach(square => {
            if (square.firstChild != null) {
                square.firstChild.remove();
            }
        });
    }

    function greetWinner(positions, player) {
        let sprite = document.createElement('img');
        sprite.src = '../images/' + player.getName() + '_win.png';

        if (_elGrid[positions[0]].firstChild != null) {
            _elGrid[positions[0]].firstChild.remove();
        }
        _elGrid[positions[0]].appendChild(sprite.cloneNode(true));

        if (_elGrid[positions[1]].firstChild != null) {
            _elGrid[positions[1]].firstChild.remove();
        }
        _elGrid[positions[1]].appendChild(sprite.cloneNode(true));

        if (_elGrid[positions[2]].firstChild != null) {
            _elGrid[positions[2]].firstChild.remove();
        }
        _elGrid[positions[2]].appendChild(sprite.cloneNode(true));


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
        updateLabel,
        clearGrid,
        greetWinner,
        getChoice,
        getMode,
    }
})();


/**
 * The helper produces a random number between min and max - 1 inclusively.
 */
function randomInt(min, max) {
    return min + Math.floor(Math.random() * max);
}

 

