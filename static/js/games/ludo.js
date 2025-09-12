class LudoGame extends BaseGame {
    constructor() {
        super();
        this.players = 4;
        this.currentPlayer = 0;
        this.diceValue = 0;
        this.consecutiveSixes = 0;
        this.gameState = 'waiting'; // waiting, rolling, moving, finished
        this.playerColors = ['red', 'blue', 'yellow', 'green'];
        this.playerNames = ['Red', 'Blue', 'Yellow', 'Green'];
        
        // Initialize player pieces
        this.pieces = {};
        this.playerColors.forEach((color, playerIndex) => {
            this.pieces[color] = [];
            for (let i = 0; i < 4; i++) {
                this.pieces[color].push({
                    id: `${color}-${i}`,
                    position: -1, // -1 = home, 0-39 = main track, 40-45 = home stretch, 46 = finished
                    isInHomeStretch: false,
                    isFinished: false
                });
            }
        });
        
        // Board configuration
        this.safeSpots = [8, 13, 21, 26, 34, 39, 47, 52]; // Safe positions on board
        this.homeEntrances = {
            red: 51,    // Red home entrance
            blue: 12,   // Blue home entrance  
            yellow: 25, // Yellow home entrance
            green: 38   // Green home entrance
        };
        
        this.finishedPlayers = [];
        this.winner = null;
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.updatePlayerTurn();
        this.gameState = 'rolling';
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="ludo-container">
                <div class="ludo-board">
                    <!-- Player Home Areas -->
                    <div class="home-area red-home">
                        <div class="home-title">Red</div>
                        <div class="home-spots">
                            <div class="home-spot" data-home="red-0"></div>
                            <div class="home-spot" data-home="red-1"></div>
                            <div class="home-spot" data-home="red-2"></div>
                            <div class="home-spot" data-home="red-3"></div>
                        </div>
                    </div>
                    
                    <div class="home-area blue-home">
                        <div class="home-title">Blue</div>
                        <div class="home-spots">
                            <div class="home-spot" data-home="blue-0"></div>
                            <div class="home-spot" data-home="blue-1"></div>
                            <div class="home-spot" data-home="blue-2"></div>
                            <div class="home-spot" data-home="blue-3"></div>
                        </div>
                    </div>
                    
                    <div class="home-area yellow-home">
                        <div class="home-title">Yellow</div>
                        <div class="home-spots">
                            <div class="home-spot" data-home="yellow-0"></div>
                            <div class="home-spot" data-home="yellow-1"></div>
                            <div class="home-spot" data-home="yellow-2"></div>
                            <div class="home-spot" data-home="yellow-3"></div>
                        </div>
                    </div>
                    
                    <div class="home-area green-home">
                        <div class="home-title">Green</div>
                        <div class="home-spots">
                            <div class="home-spot" data-home="green-0"></div>
                            <div class="home-spot" data-home="green-1"></div>
                            <div class="home-spot" data-home="green-2"></div>
                            <div class="home-spot" data-home="green-3"></div>
                        </div>
                    </div>
                    
                    <!-- Main Track -->
                    <div class="main-track">
                        ${this.createMainTrack()}
                    </div>
                    
                    <!-- Center Area -->
                    <div class="center-area">
                        <div class="center-triangle red-triangle"></div>
                        <div class="center-triangle blue-triangle"></div>
                        <div class="center-triangle yellow-triangle"></div>
                        <div class="center-triangle green-triangle"></div>
                        <div class="finish-area"></div>
                    </div>
                    
                    <!-- Home Stretches -->
                    <div class="home-stretch red-stretch">
                        ${this.createHomeStretch('red')}
                    </div>
                    <div class="home-stretch blue-stretch">
                        ${this.createHomeStretch('blue')}
                    </div>
                    <div class="home-stretch yellow-stretch">
                        ${this.createHomeStretch('yellow')}
                    </div>
                    <div class="home-stretch green-stretch">
                        ${this.createHomeStretch('green')}
                    </div>
                </div>
                
                <div class="game-info">
                    <div class="current-player">
                        <span class="player-indicator" id="current-player-indicator"></span>
                        <span id="current-player-name">Red Player</span>'s Turn
                    </div>
                    
                    <div class="dice-container">
                        <div class="dice" id="ludo-dice">
                            <div class="dice-face">?</div>
                        </div>
                        <button id="roll-dice-btn" class="roll-btn">Roll Dice</button>
                    </div>
                    
                    <div class="game-status" id="ludo-status">
                        Click "Roll Dice" to start your turn!
                    </div>
                    
                    <div class="players-finished">
                        <div class="finished-title">Finished Players:</div>
                        <div class="finished-list" id="finished-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.placePieces();
    }

    createMainTrack() {
        let trackHTML = '';
        for (let i = 0; i < 52; i++) {
            const isSafe = this.safeSpots.includes(i);
            const isStart = [0, 13, 26, 39].includes(i);
            const isEntrance = Object.values(this.homeEntrances).includes(i);
            
            trackHTML += `
                <div class="track-spot ${isSafe ? 'safe-spot' : ''} ${isStart ? 'start-spot' : ''} ${isEntrance ? 'entrance-spot' : ''}" 
                     data-position="${i}">
                    <div class="spot-content"></div>
                </div>
            `;
        }
        return trackHTML;
    }

    createHomeStretch(color) {
        let stretchHTML = '';
        for (let i = 0; i < 6; i++) {
            stretchHTML += `
                <div class="stretch-spot ${color}-stretch-spot" data-stretch="${color}-${i}">
                    <div class="spot-content"></div>
                </div>
            `;
        }
        return stretchHTML;
    }

    placePieces() {
        // Place all pieces in their home areas initially
        this.playerColors.forEach((color, playerIndex) => {
            this.pieces[color].forEach((piece, pieceIndex) => {
                const homeSpot = document.querySelector(`[data-home="${color}-${pieceIndex}"]`);
                if (homeSpot) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `ludo-piece ${color}-piece`;
                    pieceElement.id = piece.id;
                    pieceElement.addEventListener('click', () => this.handlePieceClick(piece.id));
                    homeSpot.appendChild(pieceElement);
                }
            });
        });
    }

    setupControls() {
        const rollBtn = document.getElementById('roll-dice-btn');
        if (rollBtn) {
            rollBtn.addEventListener('click', () => this.rollDice());
        }
    }

    rollDice() {
        if (this.gameState !== 'rolling') return;
        
        const dice = document.getElementById('ludo-dice');
        const rollBtn = document.getElementById('roll-dice-btn');
        
        rollBtn.disabled = true;
        this.gameState = 'rolling-animation';
        
        // Animate dice roll
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            dice.querySelector('.dice-face').textContent = this.diceValue;
            dice.className = 'dice rolling';
            
            rollCount++;
            if (rollCount >= 10) {
                clearInterval(rollInterval);
                dice.className = 'dice';
                this.handleDiceRoll();
            }
        }, 100);
        
        // Play dice sound
        this.playSound('dice');
    }

    handleDiceRoll() {
        const currentColor = this.playerColors[this.currentPlayer];
        const status = document.getElementById('ludo-status');
        
        status.textContent = `Rolled ${this.diceValue}! Click a piece to move.`;
        
        // Check if player rolled a 6
        if (this.diceValue === 6) {
            this.consecutiveSixes++;
            if (this.consecutiveSixes >= 3) {
                status.textContent = `Three sixes in a row! Turn skipped.`;
                this.consecutiveSixes = 0;
                setTimeout(() => this.nextPlayer(), 2000);
                return;
            }
        }
        
        // Find moveable pieces
        const moveablePieces = this.getMoveablePieces(currentColor);
        
        if (moveablePieces.length === 0) {
            status.textContent = `No valid moves! ${this.diceValue === 6 ? 'Roll again.' : 'Next player.'}`;
            if (this.diceValue === 6) {
                this.gameState = 'rolling';
                document.getElementById('roll-dice-btn').disabled = false;
            } else {
                setTimeout(() => this.nextPlayer(), 2000);
            }
            return;
        }
        
        // Highlight moveable pieces
        this.highlightMoveablePieces(moveablePieces);
        this.gameState = 'moving';
    }

    getMoveablePieces(color) {
        const pieces = this.pieces[color];
        const moveable = [];
        
        pieces.forEach(piece => {
            if (piece.isFinished) return;
            
            // Piece in home - can only move out on a 6
            if (piece.position === -1) {
                if (this.diceValue === 6) {
                    moveable.push(piece);
                }
                return;
            }
            
            // Piece on main track or home stretch
            const newPosition = this.calculateNewPosition(piece, this.diceValue);
            if (newPosition !== null) {
                moveable.push(piece);
            }
        });
        
        return moveable;
    }

    calculateNewPosition(piece, steps) {
        if (piece.position === -1) {
            // Moving out of home
            const startPosition = this.getPlayerStartPosition(piece.id.split('-')[0]);
            return startPosition;
        }
        
        if (piece.isInHomeStretch) {
            // Moving in home stretch
            const newStretchPosition = piece.position + steps;
            if (newStretchPosition > 45) return null; // Can't move past finish
            return newStretchPosition;
        }
        
        // Moving on main track
        const color = piece.id.split('-')[0];
        const homeEntrance = this.homeEntrances[color];
        const newPosition = (piece.position + steps) % 52;
        
        // Check if piece should enter home stretch
        if (piece.position < homeEntrance && (piece.position + steps) >= homeEntrance) {
            const overshoot = (piece.position + steps) - homeEntrance;
            if (overshoot <= 6) {
                return 40 + overshoot; // Enter home stretch
            }
        }
        
        return newPosition;
    }

    getPlayerStartPosition(color) {
        const startPositions = { red: 0, blue: 13, yellow: 26, green: 39 };
        return startPositions[color];
    }

    highlightMoveablePieces(pieces) {
        // Remove previous highlights
        document.querySelectorAll('.ludo-piece').forEach(p => p.classList.remove('moveable'));
        
        // Highlight moveable pieces
        pieces.forEach(piece => {
            const pieceElement = document.getElementById(piece.id);
            if (pieceElement) {
                pieceElement.classList.add('moveable');
            }
        });
    }

    handlePieceClick(pieceId) {
        if (this.gameState !== 'moving') return;
        
        const piece = this.findPiece(pieceId);
        const currentColor = this.playerColors[this.currentPlayer];
        
        if (!piece || !pieceId.startsWith(currentColor)) return;
        
        // Check if piece is moveable
        const moveablePieces = this.getMoveablePieces(currentColor);
        if (!moveablePieces.includes(piece)) return;
        
        this.movePiece(piece);
    }

    findPiece(pieceId) {
        const [color, index] = pieceId.split('-');
        return this.pieces[color][parseInt(index)];
    }

    movePiece(piece) {
        const oldPosition = piece.position;
        const newPosition = this.calculateNewPosition(piece, this.diceValue);
        
        if (newPosition === null) return;
        
        // Remove piece from old position
        const pieceElement = document.getElementById(piece.id);
        
        // Check for captures
        const capturedPiece = this.checkForCapture(newPosition, piece);
        
        // Update piece position
        piece.position = newPosition;
        
        // Handle home stretch entry
        if (newPosition >= 40 && newPosition <= 45) {
            piece.isInHomeStretch = true;
        }
        
        // Handle finish
        if (newPosition === 46 || (piece.isInHomeStretch && newPosition === 45)) {
            piece.isFinished = true;
            this.handlePieceFinish(piece);
        }
        
        // Move piece visually
        this.animatePieceMove(pieceElement, piece, oldPosition, newPosition);
        
        // Play move sound
        this.playSound(capturedPiece ? 'capture' : 'move');
        
        // Check for game end
        if (this.checkGameEnd()) return;
        
        // Continue turn logic
        this.handleTurnContinuation();
    }

    checkForCapture(position, movingPiece) {
        // Can't capture on safe spots
        if (this.safeSpots.includes(position)) return null;
        
        // Check for pieces at the target position
        for (const color of this.playerColors) {
            if (color === movingPiece.id.split('-')[0]) continue; // Can't capture own pieces
            
            for (const piece of this.pieces[color]) {
                if (piece.position === position && !piece.isInHomeStretch) {
                    this.capturePiece(piece);
                    return piece;
                }
            }
        }
        
        return null;
    }

    capturePiece(piece) {
        piece.position = -1;
        piece.isInHomeStretch = false;
        
        // Move piece back to home visually
        const pieceElement = document.getElementById(piece.id);
        const color = piece.id.split('-')[0];
        const pieceIndex = piece.id.split('-')[1];
        const homeSpot = document.querySelector(`[data-home="${color}-${pieceIndex}"]`);
        
        if (pieceElement && homeSpot) {
            homeSpot.appendChild(pieceElement);
        }
        
        document.getElementById('ludo-status').textContent += ` Captured ${color} piece!`;
    }

    animatePieceMove(pieceElement, piece, oldPosition, newPosition) {
        let targetElement;
        
        if (newPosition >= 40 && newPosition <= 45) {
            // Moving to home stretch
            const color = piece.id.split('-')[0];
            const stretchIndex = newPosition - 40;
            targetElement = document.querySelector(`[data-stretch="${color}-${stretchIndex}"]`);
        } else if (piece.isFinished) {
            // Moving to finish area
            targetElement = document.querySelector('.finish-area');
        } else {
            // Moving on main track
            targetElement = document.querySelector(`[data-position="${newPosition}"]`);
        }
        
        if (targetElement) {
            const spotContent = targetElement.querySelector('.spot-content') || targetElement;
            spotContent.appendChild(pieceElement);
        }
        
        // Remove moveable highlighting
        document.querySelectorAll('.ludo-piece').forEach(p => p.classList.remove('moveable'));
    }

    handlePieceFinish(piece) {
        const color = piece.id.split('-')[0];
        
        // Check if all pieces of this color are finished
        const allFinished = this.pieces[color].every(p => p.isFinished);
        
        if (allFinished && !this.finishedPlayers.includes(color)) {
            this.finishedPlayers.push(color);
            this.updateFinishedList();
            
            if (this.finishedPlayers.length === 1) {
                this.winner = color;
            }
        }
    }

    updateFinishedList() {
        const finishedList = document.getElementById('finished-list');
        finishedList.innerHTML = '';
        
        this.finishedPlayers.forEach((color, index) => {
            const position = index + 1;
            const div = document.createElement('div');
            div.className = `finished-player ${color}`;
            div.textContent = `${position}. ${this.playerNames[this.playerColors.indexOf(color)]}`;
            finishedList.appendChild(div);
        });
    }

    handleTurnContinuation() {
        // If rolled a 6, captured a piece, or got a piece home, player continues
        const shouldContinue = this.diceValue === 6;
        
        if (shouldContinue) {
            this.gameState = 'rolling';
            document.getElementById('roll-dice-btn').disabled = false;
            document.getElementById('ludo-status').textContent = 'Roll again!';
        } else {
            this.consecutiveSixes = 0;
            setTimeout(() => this.nextPlayer(), 1500);
        }
    }

    nextPlayer() {
        do {
            this.currentPlayer = (this.currentPlayer + 1) % this.players;
            const currentColor = this.playerColors[this.currentPlayer];
        } while (this.finishedPlayers.includes(this.playerColors[this.currentPlayer]) && this.finishedPlayers.length < 3);
        
        this.updatePlayerTurn();
        this.gameState = 'rolling';
        document.getElementById('roll-dice-btn').disabled = false;
        document.getElementById('ludo-status').textContent = 'Click "Roll Dice" to start your turn!';
    }

    updatePlayerTurn() {
        const currentColor = this.playerColors[this.currentPlayer];
        const indicator = document.getElementById('current-player-indicator');
        const nameElement = document.getElementById('current-player-name');
        
        if (indicator && nameElement) {
            indicator.className = `player-indicator ${currentColor}`;
            nameElement.textContent = this.playerNames[this.currentPlayer];
        }
    }

    checkGameEnd() {
        if (this.finishedPlayers.length >= 3) {
            this.gameState = 'finished';
            const status = document.getElementById('ludo-status');
            status.textContent = `Game Over! ${this.playerNames[this.playerColors.indexOf(this.winner)]} wins!`;
            document.getElementById('roll-dice-btn').disabled = true;
            this.playSound('win');
            return true;
        }
        return false;
    }

    reset() {
        this.currentPlayer = 0;
        this.diceValue = 0;
        this.consecutiveSixes = 0;
        this.gameState = 'rolling';
        this.finishedPlayers = [];
        this.winner = null;
        
        // Reset all pieces
        this.playerColors.forEach(color => {
            this.pieces[color].forEach(piece => {
                piece.position = -1;
                piece.isInHomeStretch = false;
                piece.isFinished = false;
            });
        });
        
        this.init();
    }
}