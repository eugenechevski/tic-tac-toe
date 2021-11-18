"use strict"

/**
 * Factory function to produce an object of a player.
 * 
 * @param {string} - Player's name
 * @returns {object} - Player's object
 */
var Player = (name) => {
    var isRobot = false;
    
    function getName() {
        return name;
    }

    return { getName, isRobot: isRobot};
}


/**
 * The control-module manages the flow of the game.
 */
 var GameFlow = (function (){
    // Properties
    var _isPlaying = false;
    var _gameMode;
    var _crossPlayer = Player('Cross');
    var _noughtPlayer = Player('Nought');
    var _currentPlayer;


    /**
     * Updates the status of the game, after being called by an event-listener.
     * 
     * @param {string} - ID of the square that was clicked
     */
    function updateGame(position) {
        // Validate the status of the game
        if (_isPlaying) {
            // Validate the move by the current player
            if (GameBoard.updateBoard(position, _currentPlayer)) {
                // Check if the won
                let win = GameBoard.isWin(position);
                
                if (win) { // Player has won
                    _isPlaying = false;
                    DisplayController.greetWinner(win, _currentPlayer);
                    DisplayController.updateLabel(_currentPlayer.getName() + ' has won, congratulations!');

                } else if (GameBoard.getEmpty() == 0) { // Tie
                    _isPlaying = false;
                    DisplayController.updateGrid(position, _currentPlayer);
                    DisplayController.updateLabel('Tie!');

                } else { // Continue playing
                    DisplayController.updateGrid(position, _currentPlayer);
                    _currentPlayer = _currentPlayer == _crossPlayer ? _noughtPlayer : _crossPlayer;
                    DisplayController.updateLabel(_currentPlayer.getName() + ', now is your turn.');

                    if (_currentPlayer.isRobot) { // Check if the next turn is the computer's turn
                        updateGame(minimax(randomInt(0, 9), 0, true));
                    }
                }
            }
        }
    }

    
    /**
     * Starts a new game by resetting the status of all the functionality.
     */
    function startGame() {
        GameBoard.resetBoard()
        DisplayController.clearGrid();

        _isPlaying = true;
        _gameMode = DisplayController.getMode();

        if (_gameMode == 'COMPUTER_MODE') { 
            let choice = DisplayController.getChoice();

            if (choice == 'crossChoice') {
                _crossPlayer.isRobot = false;
                _noughtPlayer.isRobot = true;
            } else {
                _noughtPlayer.isRobot = false;
                _crossPlayer.isRobot = true;
            }
        } else {
            _crossPlayer.isRobot = false;
            _noughtPlayer.isRobot = false;
        }
        
        _currentPlayer = _crossPlayer; // Cross moves first
        DisplayController.updateLabel(_currentPlayer.getName() + ', now is your turn.');

        if (_currentPlayer.isRobot) { 
            updateGame(randomInt(0, 9)); // Generate a move for the computer
        }
    }


    /**
     * The function calculates the best move, given the current state of the game.
     * It utilizes the recursive-backtracking Minimax-algorithm.
     * 
     * @param position - The last move being made on the board
     * @param depth - The search depth of the current call
     * @param isMaximizer - The condition that determines a player at the current call
     * @returns The position with the best outcome
     */
    function minimax(position, depth, isMaximizer){
        // Termination conditions

        if (GameBoard.isWin(position)) { // Someone has won
            return depth == 0 ? pos : [(!isMaximizer ? 1 : -1), depth];
        } else if (GameBoard.getEmpty() == 0) { // It's tie
            return [0, depth];
        }

        // stores an outcome of the best position chosen
        let bestResult; 
        // stores the best position so far
        let bestPosition = -1;

        // The condition for the maximizer
        if (isMaximizer) {
            bestResult = [-2, 0]; // reinitialize the array

            // Iterate through all positions and find the one that is empty
            for (let i = 0; i < 9; i++) { 
                // Found an empty slot
                if (GameBoard.updateBoard(i, _currentPlayer)) {
                    // Start the search of the best outcome, given the current position
                    let result = minimax(i, depth + 1, false);
                    // Clear the position, to try another combination
                    GameBoard.removePosition(i);

                    // Compare the outcome of the chosen position with the outcome of the best position so far
                    if (result[0] > bestResult[0] || (result[0] == bestResult[0] && result[1] < bestResult[1])) {
                        bestResult = result;
                        bestPosition = i;
                    }
                }
            }

        // The condition for the opponent(minimizer)
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


    /**
     * Produces a random number.
     * 
     * @param min - lower bound
     * @param max - upper bound(exclusive)
     */
    function randomInt(min, max) {
        return min + Math.floor(Math.random() * max);
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


    /**
     * Getter for available(empty) positions.
     */
    function getEmpty() {
        return _availPositions;
    }


    /**
     * Adds (if valid) the player's object to the board at the given position.
     * 
     * @param position - Position chosen
     * @param player - Player's object
     * @returns status of the insertion
     */
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


    /**
     * Resets all the objects on the board to null and available positions to 9.
     */
    function resetBoard() {
        _board.fill(null);
        _availPositions = 9;
    }


    /**
     * Resets an object at the given position to null.
     * 
     * @param position - The position that needed to be reset
     */
    function removePosition(position) {
        _board[position] = null;
        _availPositions++;
    }


    /**
     * Checks if the given position has the winning pattern.
     * 
     * @param position - The position to check
     * @returns The winning positions or false-status.
     */
    function isWin(position) {
        let result = false;

        // Start check only after 5 moves were made 
        if (getEmpty() < 5)  {
            let positions = [];
    
            let row = Math.floor(position / 3) * 3;
            let column = position % 3;
    
            // Check for row
            if (_board[row] != null && 
                _board[row] == _board[row + 1] && 
                _board[row + 1] == _board[row + 2]) { 

                positions.push(row);
                positions.push(row + 1);
                positions.push(row + 2);

            // Check for column
            } else if (_board[column] != null & 
                       _board[column] == _board[3 + column] &&
                       _board[3 + column] == _board[6 + column]) { 

                positions.push(column);
                positions.push(3 + column);
                positions.push(6 + column);

            // Check for diagonal from left to right
            } else if (_board[0] != null && 
                       _board[0] == _board[4] && 
                       _board[4] == _board[8]) {

                positions.push(0);
                positions.push(4);
                positions.push(8);
                
            // Check for diagonal from right to left
            } else if (_board[2] != null &&
                       _board[2] == _board[4] && 
                       _board[4] == _board[6]) { 

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
 * Controls the graphical aspect of the game, by interacting with the DOM-elements.
 */
var DisplayController = (function (){
    const _elGrid = Array.from(document.getElementsByClassName('square'));
    _elGrid.forEach(square => square.addEventListener('click', GameFlow.updateGame.bind(event, square.id)));    

    const _elControlsContainer = document.getElementById('controls');
    const _elStartBtn = document.getElementById('startBtn');
    _elStartBtn.addEventListener('click', GameFlow.startGame);

    const _elChoiceContainer = document.getElementById('playerChoiceContainer');
    _elChoiceContainer.remove();

    const _elChoice = document.getElementsByName('playerChoice');

    const _elMode = document.getElementById('gameMode');
    _elMode.addEventListener('change', () => { 
        if (_elControlsContainer.children.length == 3) {
            _elControlsContainer.insertBefore(_elChoiceContainer, _elMode) 
        } else {
            _elControlsContainer.removeChild(_elChoiceContainer);
        }
    });

    const _elStatusLabel = document.getElementById('statusLabel');


    /**
     * Draws a player's sprite on a square of the given position.
     * 
     * @param position - ID of the square
     * @param player - Player's that needs to be drawn
     */
    function updateGrid(position, player) {
        let sprite = document.createElement('img');
        sprite.src = './images/' + player.getName().toLowerCase() + '.png';

        _elGrid[position].appendChild(sprite);
    }


    /**
     * Updates the status label with the given message.
     * 
     * @param message - The message to be displayed
     */
    function updateLabel(message) {
        _elStatusLabel.children[0].textContent = '';
        _elStatusLabel.lastChild.textContent = '';

        if (message.length > 0) {
            if (message.startsWith('Cross')) {
                _elStatusLabel.children[0].textContent = 'Cross';

                if (message.endsWith('congratulations!')) {
                    _elStatusLabel.children[0].style.color = '#3BD04C';
                } else {
                    _elStatusLabel.children[0].style.color = '#F8443E';
                }

                message = message.slice('Cross'.length);
            } else if(message.startsWith('Nought')){
                _elStatusLabel.children[0].textContent = 'Nought';

                if (message.endsWith('congratulations!')) {
                    _elStatusLabel.children[0].style.color = '#3BD04C';
                } else {
                    _elStatusLabel.children[0].style.color = '#0784EE';
                }

                message = message.slice('Nought'.length);
            }
        }

        _elStatusLabel.lastChild.textContent = message;
    }


    /**
     * Removes all the image-elements from the squares.
     */
    function clearGrid() {
        _elGrid.forEach(square => {
            if (square.firstChild != null) {
                square.firstChild.remove();
            }
        });
    }

    
    /**
     * Draws an winning-sprite of the given player at the given square.
     */
    function greetWinner(positions, player) {
        let sprite = document.createElement('img');
        sprite.src = './images/' + player.getName().toLowerCase() + '_win.png';

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
    }


    /**
     * 
     * @returns a chosen player
     */
    function getChoice() {
        return _elChoice[0].checked ? _elChoice[0].id : _elChoice[1].id;
    }


    /**
     * 
     * @returns a chosen mode
     */
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
