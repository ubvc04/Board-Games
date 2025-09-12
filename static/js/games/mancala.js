class MancalaGame extends BaseGame {
    constructor() {
        super();
        this.currentPlayer = 'player1'; // 'player1' (bottom), 'player2' (top/AI)
        this.gameState = 'playing'; // 'playing', 'animating', 'finished'
        this.board = this.createInitialBoard();
        this.scores = { player1: 0, player2: 0 };
        this.gameMode = 'ai'; // 'ai' or 'human'
        this.winner = null;
        this.lastMove = null;
        this.animationQueue = [];
        this.isAnimating = false;
        this.animationSpeed = 300; // ms per stone drop
        
        // Board layout: 
        // Player 2: [12][11][10][9][8][7]
        // Stores:   [13]              [6]
        // Player 1: [0] [1] [2] [3][4][5]
        this.player1Pits = [0, 1, 2, 3, 4, 5];
        this.player2Pits = [7, 8, 9, 10, 11, 12];
        this.player1Store = 6;
        this.player2Store = 13;
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.updateDisplay();
    }

    createInitialBoard() {
        // Create array for 14 positions: 6 pits + 1 store for each player
        const board = new Array(14).fill(0);
        
        // Fill each pit with 4 stones initially
        for (let i = 0; i < 6; i++) {
            board[i] = 4; // Player 1 pits
            board[i + 7] = 4; // Player 2 pits  
        }
        
        // Stores start empty
        board[6] = 0;  // Player 1 store
        board[13] = 0; // Player 2 store
        
        return board;
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="mancala-container">
                <div class="game-area">
                    <div class="mancala-board">
                        <!-- Player 2 side (top) -->
                        <div class="player-side player2-side">
                            <div class="player-label">Player 2 (AI)</div>
                            <div class="pits-row">
                                ${this.createPitsHTML([12, 11, 10, 9, 8, 7], 'player2')}
                            </div>
                        </div>
                        
                        <!-- Stores -->
                        <div class="stores-row">
                            <div class="store player2-store" data-pit="13">
                                <div class="store-label">Player 2</div>
                                <div class="stones-container" id="pit-13">
                                    ${this.createStonesHTML(0)}
                                </div>
                                <div class="store-count">0</div>
                            </div>
                            
                            <div class="board-center">
                                <div class="game-title">Mancala</div>
                                <div class="turn-indicator" id="turn-indicator">
                                    Player 1's Turn
                                </div>
                            </div>
                            
                            <div class="store player1-store" data-pit="6">
                                <div class="store-label">Player 1</div>
                                <div class="stones-container" id="pit-6">
                                    ${this.createStonesHTML(0)}
                                </div>
                                <div class="store-count">0</div>
                            </div>
                        </div>
                        
                        <!-- Player 1 side (bottom) -->
                        <div class="player-side player1-side">
                            <div class="pits-row">
                                ${this.createPitsHTML([0, 1, 2, 3, 4, 5], 'player1')}
                            </div>
                            <div class="player-label">Player 1 (You)</div>
                        </div>
                    </div>
                </div>
                
                <div class="game-panel">
                    <div class="game-header">
                        <h2>Mancala</h2>
                        <div class="game-status" id="game-status">
                            Choose a pit to sow stones
                        </div>
                    </div>
                    
                    <div class="score-display">
                        <div class="score-item player1">
                            <div class="score-info">
                                <div class="score-label">Player 1</div>
                                <div class="score-value" id="player1-score">0</div>
                            </div>
                            <div class="score-visual">
                                <div class="score-stones" id="player1-visual"></div>
                            </div>
                        </div>
                        
                        <div class="score-item player2">
                            <div class="score-info">
                                <div class="score-label">Player 2</div>
                                <div class="score-value" id="player2-score">0</div>
                            </div>
                            <div class="score-visual">
                                <div class="score-stones" id="player2-visual"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="move-info">
                        <div class="last-move">
                            <strong>Last Move:</strong>
                            <span id="last-move-display">Game started</span>
                        </div>
                        <div class="animation-status" id="animation-status" style="display: none;">
                            Sowing stones...
                        </div>
                    </div>
                    
                    <div class="game-controls">
                        <button id="hint-btn" class="control-btn">
                            <i class="fas fa-lightbulb"></i> Show Hint
                        </button>
                        <button id="speed-btn" class="control-btn secondary">
                            <i class="fas fa-tachometer-alt"></i> Animation: Normal
                        </button>
                        <button id="reset-btn" class="control-btn">
                            <i class="fas fa-refresh"></i> New Game
                        </button>
                    </div>
                    
                    <div class="game-rules">
                        <h4>How to Play:</h4>
                        <ul>
                            <li>Click a pit on your side to sow stones</li>
                            <li>Stones are distributed counter-clockwise</li>
                            <li>If last stone lands in your store, play again</li>
                            <li>If last stone lands in empty pit on your side, capture opponent's opposite stones</li>
                            <li>Game ends when one side is empty</li>
                            <li>Player with most stones wins</li>
                        </ul>
                    </div>
                    
                    <div class="game-tips">
                        <h4>Strategy Tips:</h4>
                        <ul>
                            <li>Try to end moves in your store for extra turns</li>
                            <li>Look for capture opportunities</li>
                            <li>Count stones to plan ahead</li>
                            <li>Control the tempo of the game</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    createPitsHTML(pitIndices, player) {
        return pitIndices.map(pitIndex => `
            <div class="pit ${player}-pit ${this.currentPlayer === player ? 'active-player' : ''}" 
                 data-pit="${pitIndex}">
                <div class="pit-number">${pitIndex < 6 ? pitIndex + 1 : 13 - pitIndex}</div>
                <div class="stones-container" id="pit-${pitIndex}">
                    ${this.createStonesHTML(this.board[pitIndex])}
                </div>
                <div class="stone-count">${this.board[pitIndex]}</div>
            </div>
        `).join('');
    }

    createStonesHTML(count) {
        let stonesHTML = '';
        for (let i = 0; i < count; i++) {
            stonesHTML += `<div class="stone" style="--delay: ${i * 0.1}s"></div>`;
        }
        return stonesHTML;
    }

    setupEventListeners() {
        // Add click listeners to player 1 pits only
        this.player1Pits.forEach(pitIndex => {
            const pit = document.querySelector(`[data-pit="${pitIndex}"]`);
            if (pit) {
                pit.addEventListener('click', () => this.handlePitClick(pitIndex));
            }
        });
    }

    setupControls() {
        const hintBtn = document.getElementById('hint-btn');
        const speedBtn = document.getElementById('speed-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        hintBtn?.addEventListener('click', () => this.showHint());
        speedBtn?.addEventListener('click', () => this.toggleAnimationSpeed());
        resetBtn?.addEventListener('click', () => this.reset());
    }

    handlePitClick(pitIndex) {
        if (this.gameState !== 'playing') return;
        if (this.currentPlayer !== 'player1') return;
        if (this.board[pitIndex] === 0) return; // Empty pit
        if (this.isAnimating) return;
        
        this.makeMove(pitIndex);
    }

    makeMove(pitIndex) {
        if (this.board[pitIndex] === 0) return;
        
        this.gameState = 'animating';
        this.isAnimating = true;
        this.lastMove = { player: this.currentPlayer, pit: pitIndex, stones: this.board[pitIndex] };
        
        // Create animation sequence
        this.animationQueue = this.calculateSowingSequence(pitIndex);
        
        // Execute the move logic
        const result = this.executeSowing(pitIndex);
        
        // Start animation
        this.animateSowing(() => {
            this.handleMoveResult(result);
        });
        
        this.playSound('move');
    }

    calculateSowingSequence(startPit) {
        const sequence = [];
        let stones = this.board[startPit];
        let currentPit = startPit;
        
        // Clear starting pit
        sequence.push({ action: 'clear', pit: startPit });
        
        // Sow stones
        for (let i = 0; i < stones; i++) {
            currentPit = this.getNextPit(currentPit);
            sequence.push({ action: 'drop', pit: currentPit, stoneIndex: i });
        }
        
        return sequence;
    }

    executeSowing(startPit) {
        const stones = this.board[startPit];
        let currentPit = startPit;
        let lastPit = -1;
        
        // Clear starting pit
        this.board[startPit] = 0;
        
        // Sow stones one by one
        for (let i = 0; i < stones; i++) {
            currentPit = this.getNextPit(currentPit);
            this.board[currentPit]++;
            lastPit = currentPit;
        }
        
        return {
            lastPit: lastPit,
            landedInStore: this.isPlayerStore(lastPit, this.currentPlayer),
            landedInEmptyOwnPit: this.board[lastPit] === 1 && this.isPlayerPit(lastPit, this.currentPlayer)
        };
    }

    getNextPit(currentPit) {
        let nextPit = (currentPit + 1) % 14;
        
        // Skip opponent's store
        if (this.currentPlayer === 'player1' && nextPit === this.player2Store) {
            nextPit = 0; // Skip to player 1's first pit
        } else if (this.currentPlayer === 'player2' && nextPit === this.player1Store) {
            nextPit = 7; // Skip to player 2's first pit
        }
        
        return nextPit;
    }

    animateSowing(callback) {
        const animationStatus = document.getElementById('animation-status');
        animationStatus.style.display = 'block';
        
        let sequenceIndex = 0;
        
        const executeNextAnimation = () => {
            if (sequenceIndex >= this.animationQueue.length) {
                animationStatus.style.display = 'none';
                this.isAnimating = false;
                this.gameState = 'playing';
                this.updateDisplay();
                callback();
                return;
            }
            
            const action = this.animationQueue[sequenceIndex];
            
            if (action.action === 'clear') {
                this.animateClearPit(action.pit);
            } else if (action.action === 'drop') {
                this.animateDropStone(action.pit, action.stoneIndex);
            }
            
            sequenceIndex++;
            setTimeout(executeNextAnimation, this.animationSpeed);
        };
        
        executeNextAnimation();
    }

    animateClearPit(pitIndex) {
        const container = document.getElementById(`pit-${pitIndex}`);
        if (container) {
            const stones = container.querySelectorAll('.stone');
            stones.forEach((stone, index) => {
                setTimeout(() => {
                    stone.classList.add('sowing');
                    setTimeout(() => stone.remove(), 200);
                }, index * 50);
            });
        }
    }

    animateDropStone(pitIndex, stoneIndex) {
        const container = document.getElementById(`pit-${pitIndex}`);
        if (container) {
            const stone = document.createElement('div');
            stone.className = 'stone dropping';
            stone.style.setProperty('--delay', `${stoneIndex * 0.1}s`);
            container.appendChild(stone);
            
            setTimeout(() => {
                stone.classList.remove('dropping');
            }, 300);
        }
        
        // Update count display
        const countDisplay = container.parentElement.querySelector('.stone-count');
        if (countDisplay) {
            countDisplay.textContent = this.board[pitIndex];
        }
    }

    handleMoveResult(result) {
        let extraTurn = false;
        let captured = false;
        
        // Check if landed in own store (extra turn)
        if (result.landedInStore) {
            extraTurn = true;
            this.updateLastMove(`Landed in store - extra turn!`);
        }
        
        // Check for capture
        if (result.landedInEmptyOwnPit && !result.landedInStore) {
            const oppositePit = this.getOppositePit(result.lastPit);
            if (this.board[oppositePit] > 0) {
                this.handleCapture(result.lastPit, oppositePit);
                captured = true;
            }
        }
        
        // Update last move display
        if (!extraTurn && !captured) {
            this.updateLastMove(`Sowed ${this.lastMove.stones} stones from pit ${this.getPitDisplayNumber(this.lastMove.pit)}`);
        }
        
        // Check for game end
        if (this.checkGameEnd()) {
            this.endGame();
            return;
        }
        
        // Switch players unless extra turn
        if (!extraTurn) {
            this.switchPlayer();
        }
        
        // Handle AI turn
        if (this.gameMode === 'ai' && this.currentPlayer === 'player2' && this.gameState === 'playing') {
            setTimeout(() => this.makeAIMove(), 1500);
        }
        
        this.updateDisplay();
    }

    handleCapture(lastPit, oppositePit) {
        const capturedStones = this.board[oppositePit] + this.board[lastPit];
        
        // Move stones to current player's store
        const playerStore = this.currentPlayer === 'player1' ? this.player1Store : this.player2Store;
        this.board[playerStore] += capturedStones;
        
        // Clear both pits
        this.board[lastPit] = 0;
        this.board[oppositePit] = 0;
        
        this.updateLastMove(`Captured ${capturedStones} stones!`);
        this.playSound('capture');
    }

    getOppositePit(pitIndex) {
        // Map pits to their opposites
        if (pitIndex >= 0 && pitIndex <= 5) {
            return 12 - pitIndex; // Player 1 pit to Player 2 pit
        } else if (pitIndex >= 7 && pitIndex <= 12) {
            return 12 - (pitIndex - 7); // Player 2 pit to Player 1 pit
        }
        return -1; // Not a regular pit
    }

    getPitDisplayNumber(pitIndex) {
        if (pitIndex <= 5) {
            return pitIndex + 1;
        } else if (pitIndex >= 7 && pitIndex <= 12) {
            return 13 - pitIndex;
        }
        return pitIndex;
    }

    isPlayerPit(pitIndex, player) {
        if (player === 'player1') {
            return this.player1Pits.includes(pitIndex);
        } else {
            return this.player2Pits.includes(pitIndex);
        }
    }

    isPlayerStore(pitIndex, player) {
        if (player === 'player1') {
            return pitIndex === this.player1Store;
        } else {
            return pitIndex === this.player2Store;
        }
    }

    makeAIMove() {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'player2') return;
        
        const bestMove = this.getBestAIMove();
        if (bestMove !== -1) {
            this.makeMove(bestMove);
        }
    }

    getBestAIMove() {
        const validMoves = this.player2Pits.filter(pit => this.board[pit] > 0);
        if (validMoves.length === 0) return -1;
        
        let bestMove = validMoves[0];
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    evaluateMove(pitIndex) {
        let score = 0;
        const stones = this.board[pitIndex];
        let currentPit = pitIndex;
        
        // Simulate the move
        for (let i = 0; i < stones; i++) {
            currentPit = this.getNextPit(currentPit);
        }
        
        // Bonus for landing in own store (extra turn)
        if (currentPit === this.player2Store) {
            score += 10;
        }
        
        // Bonus for potential captures
        if (this.isPlayerPit(currentPit, 'player2') && this.board[currentPit] === 0) {
            const oppositePit = this.getOppositePit(currentPit);
            if (this.board[oppositePit] > 0) {
                score += this.board[oppositePit] * 2;
            }
        }
        
        // Prefer moves that distribute stones well
        score += stones;
        
        return score;
    }

    checkGameEnd() {
        const player1Empty = this.player1Pits.every(pit => this.board[pit] === 0);
        const player2Empty = this.player2Pits.every(pit => this.board[pit] === 0);
        
        return player1Empty || player2Empty;
    }

    endGame() {
        this.gameState = 'finished';
        
        // Move remaining stones to respective stores
        this.player1Pits.forEach(pit => {
            this.board[this.player1Store] += this.board[pit];
            this.board[pit] = 0;
        });
        
        this.player2Pits.forEach(pit => {
            this.board[this.player2Store] += this.board[pit];
            this.board[pit] = 0;
        });
        
        // Determine winner
        const player1Score = this.board[this.player1Store];
        const player2Score = this.board[this.player2Store];
        
        if (player1Score > player2Score) {
            this.winner = 'player1';
        } else if (player2Score > player1Score) {
            this.winner = 'player2';
        } else {
            this.winner = 'tie';
        }
        
        this.updateDisplay();
        this.playSound('win');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'player1' ? 'player2' : 'player1';
        this.updateDisplay();
    }

    showHint() {
        if (this.currentPlayer !== 'player1' || this.gameState !== 'playing') return;
        
        const bestMove = this.getBestPlayerMove();
        if (bestMove !== -1) {
            const pit = document.querySelector(`[data-pit="${bestMove}"]`);
            if (pit) {
                pit.classList.add('hint-pit');
                setTimeout(() => {
                    pit.classList.remove('hint-pit');
                }, 3000);
            }
        }
    }

    getBestPlayerMove() {
        const validMoves = this.player1Pits.filter(pit => this.board[pit] > 0);
        if (validMoves.length === 0) return -1;
        
        // Simple heuristic for human player hints
        let bestMove = validMoves[0];
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            let score = 0;
            const stones = this.board[move];
            let currentPit = move;
            
            // Simulate move
            for (let i = 0; i < stones; i++) {
                currentPit = this.getNextPit(currentPit);
            }
            
            // Extra turn is very valuable
            if (currentPit === this.player1Store) {
                score += 15;
            }
            
            // Capture opportunities
            if (this.isPlayerPit(currentPit, 'player1') && this.board[currentPit] === 0) {
                const oppositePit = this.getOppositePit(currentPit);
                if (this.board[oppositePit] > 0) {
                    score += this.board[oppositePit] * 3;
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    toggleAnimationSpeed() {
        const speedBtn = document.getElementById('speed-btn');
        
        if (this.animationSpeed === 300) {
            this.animationSpeed = 100;
            speedBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Animation: Fast';
        } else if (this.animationSpeed === 100) {
            this.animationSpeed = 50;
            speedBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Animation: Very Fast';
        } else {
            this.animationSpeed = 300;
            speedBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Animation: Normal';
        }
    }

    updateDisplay() {
        this.updateStoneDisplays();
        this.updateScoreDisplays();
        this.updateTurnIndicator();
        this.updatePitInteractivity();
    }

    updateStoneDisplays() {
        for (let i = 0; i < 14; i++) {
            const container = document.getElementById(`pit-${i}`);
            if (container && !this.isAnimating) {
                container.innerHTML = this.createStonesHTML(this.board[i]);
            }
            
            // Update count displays
            const pit = document.querySelector(`[data-pit="${i}"]`);
            if (pit) {
                const countDisplay = pit.querySelector('.stone-count');
                if (countDisplay) {
                    countDisplay.textContent = this.board[i];
                }
            }
        }
    }

    updateScoreDisplays() {
        const player1Score = this.board[this.player1Store];
        const player2Score = this.board[this.player2Store];
        
        document.getElementById('player1-score').textContent = player1Score;
        document.getElementById('player2-score').textContent = player2Score;
        
        // Update visual score representations
        this.updateScoreVisual('player1-visual', player1Score);
        this.updateScoreVisual('player2-visual', player2Score);
    }

    updateScoreVisual(elementId, score) {
        const visual = document.getElementById(elementId);
        if (visual) {
            visual.innerHTML = '';
            const maxStones = 15; // Limit visual representation
            const stonesToShow = Math.min(score, maxStones);
            
            for (let i = 0; i < stonesToShow; i++) {
                const stone = document.createElement('div');
                stone.className = 'score-stone';
                visual.appendChild(stone);
            }
            
            if (score > maxStones) {
                const more = document.createElement('div');
                more.className = 'score-more';
                more.textContent = `+${score - maxStones}`;
                visual.appendChild(more);
            }
        }
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const status = document.getElementById('game-status');
        
        if (this.gameState === 'finished') {
            if (this.winner === 'tie') {
                indicator.textContent = "It's a tie!";
                status.textContent = "Game ended in a tie";
            } else {
                const winnerName = this.winner === 'player1' ? 'Player 1' : 'Player 2';
                indicator.textContent = `${winnerName} Wins!`;
                status.textContent = `${winnerName} has won the game`;
            }
        } else if (this.isAnimating) {
            indicator.textContent = "Sowing stones...";
            status.textContent = "Animation in progress";
        } else {
            const playerName = this.currentPlayer === 'player1' ? 'Player 1' : 'Player 2';
            indicator.textContent = `${playerName}'s Turn`;
            
            if (this.currentPlayer === 'player1') {
                status.textContent = "Choose a pit to sow stones";
            } else {
                status.textContent = "AI is thinking...";
            }
        }
    }

    updatePitInteractivity() {
        // Update active player styling
        document.querySelectorAll('.pit').forEach(pit => {
            pit.classList.remove('active-player', 'clickable');
        });
        
        if (this.gameState === 'playing' && !this.isAnimating) {
            const currentPlayerPits = this.currentPlayer === 'player1' ? this.player1Pits : this.player2Pits;
            
            currentPlayerPits.forEach(pitIndex => {
                const pit = document.querySelector(`[data-pit="${pitIndex}"]`);
                if (pit) {
                    pit.classList.add('active-player');
                    
                    // Only make player 1 pits clickable
                    if (this.currentPlayer === 'player1' && this.board[pitIndex] > 0) {
                        pit.classList.add('clickable');
                    }
                }
            });
        }
    }

    updateLastMove(message) {
        const display = document.getElementById('last-move-display');
        if (display) {
            display.textContent = message;
        }
    }

    reset() {
        this.currentPlayer = 'player1';
        this.gameState = 'playing';
        this.board = this.createInitialBoard();
        this.scores = { player1: 0, player2: 0 };
        this.winner = null;
        this.lastMove = null;
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Recreate board to reset all displays
        this.createBoard();
        this.updateDisplay();
        this.updateLastMove('Game started');
    }
}