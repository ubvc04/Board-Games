class GoGame extends BaseGame {
    constructor() {
        super();
        this.boardSize = 9; // 9x9 board for easier gameplay
        this.currentPlayer = 'black'; // Black starts first in Go
        this.gameState = 'playing'; // 'playing', 'finished'
        this.board = this.createEmptyBoard();
        this.capturedStones = { black: 0, white: 0 };
        this.territory = { black: 0, white: 0 };
        this.komi = 6.5; // Standard compensation for white
        this.passCount = 0;
        this.gameHistory = [];
        this.winner = null;
        this.lastMove = null;
        this.gameMode = 'ai'; // 'ai' or 'human'
        
        // Simple capture groups tracking
        this.groups = [];
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.updateGameInfo();
        this.updateCaptureInfo();
    }

    createEmptyBoard() {
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="go-container">
                <div class="game-area">
                    <div class="go-board-wrapper">
                        <div class="go-board" id="go-board">
                            ${this.createGridHTML()}
                        </div>
                    </div>
                </div>
                
                <div class="game-panel">
                    <div class="game-header">
                        <h2>Go (9×9)</h2>
                        <div class="game-status" id="game-status">
                            Black's Turn
                        </div>
                    </div>
                    
                    <div class="player-info">
                        <div class="player-section black-player">
                            <div class="player-indicator">
                                <div class="go-stone black"></div>
                                <span class="player-name">Black</span>
                            </div>
                            <div class="capture-info">
                                Captured: <span id="black-captured">0</span>
                            </div>
                        </div>
                        
                        <div class="player-section white-player">
                            <div class="player-indicator">
                                <div class="go-stone white"></div>
                                <span class="player-name">White</span>
                            </div>
                            <div class="capture-info">
                                Captured: <span id="white-captured">0</span>
                                <div class="komi-info">Komi: +6.5</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-controls">
                        <button id="pass-btn" class="control-btn">
                            <i class="fas fa-forward"></i> Pass
                        </button>
                        <button id="resign-btn" class="control-btn secondary">
                            <i class="fas fa-flag"></i> Resign
                        </button>
                        <button id="score-btn" class="control-btn">
                            <i class="fas fa-calculator"></i> Score Game
                        </button>
                    </div>
                    
                    <div class="move-info">
                        <div class="last-move-info">
                            <strong>Last Move:</strong>
                            <span id="last-move-display">Game started</span>
                        </div>
                        <div class="pass-count" id="pass-count" style="display: none;">
                            Consecutive passes: <span>0</span>
                        </div>
                    </div>
                    
                    <div class="game-rules">
                        <h4>Go Rules:</h4>
                        <ul>
                            <li>Place stones to control territory</li>
                            <li>Surround opponent stones to capture</li>
                            <li>No suicide moves allowed</li>
                            <li>Ko rule prevents immediate recapture</li>
                            <li>Two passes end the game</li>
                        </ul>
                    </div>
                    
                    <div class="score-display" id="score-display" style="display: none;">
                        <h4>Final Score:</h4>
                        <div class="final-scores">
                            <div class="score-line">
                                Black: <span id="final-black-score">0</span>
                            </div>
                            <div class="score-line">
                                White: <span id="final-white-score">0</span>
                            </div>
                            <div class="winner-display" id="winner-display"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        this.updateBoardDisplay();
    }

    createGridHTML() {
        let gridHTML = '';
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const isStarPoint = this.isStarPoint(row, col);
                gridHTML += `
                    <div class="go-intersection ${isStarPoint ? 'star-point' : ''}" 
                         data-row="${row}" 
                         data-col="${col}">
                        <div class="intersection-lines"></div>
                        <div class="stone-container"></div>
                    </div>
                `;
            }
        }
        return gridHTML;
    }

    isStarPoint(row, col) {
        // Star points for 9x9 board
        const starPoints = [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]];
        return starPoints.some(([r, c]) => r === row && c === col);
    }

    setupEventListeners() {
        document.querySelectorAll('.go-intersection').forEach(intersection => {
            intersection.addEventListener('click', (e) => this.handleIntersectionClick(e));
            intersection.addEventListener('mouseenter', (e) => this.showMovePreview(e));
            intersection.addEventListener('mouseleave', (e) => this.hideMovePreview(e));
        });
    }

    setupControls() {
        const passBtn = document.getElementById('pass-btn');
        const resignBtn = document.getElementById('resign-btn');
        const scoreBtn = document.getElementById('score-btn');
        
        passBtn?.addEventListener('click', () => this.passMove());
        resignBtn?.addEventListener('click', () => this.resignGame());
        scoreBtn?.addEventListener('click', () => this.scoreGame());
    }

    handleIntersectionClick(event) {
        if (this.gameState !== 'playing') return;
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') return;
        
        const intersection = event.target.closest('.go-intersection');
        const row = parseInt(intersection.dataset.row);
        const col = parseInt(intersection.dataset.col);
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
        }
    }

    showMovePreview(event) {
        if (this.gameState !== 'playing') return;
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') return;
        
        const intersection = event.target.closest('.go-intersection');
        const row = parseInt(intersection.dataset.row);
        const col = parseInt(intersection.dataset.col);
        
        if (this.isValidMove(row, col)) {
            const container = intersection.querySelector('.stone-container');
            container.innerHTML = `<div class="go-stone ${this.currentPlayer} preview"></div>`;
        }
    }

    hideMovePreview(event) {
        const intersection = event.target.closest('.go-intersection');
        const row = parseInt(intersection.dataset.row);
        const col = parseInt(intersection.dataset.col);
        
        if (this.board[row][col] === null) {
            const container = intersection.querySelector('.stone-container');
            container.innerHTML = '';
        }
    }

    isValidMove(row, col) {
        // Check if intersection is empty
        if (this.board[row][col] !== null) return false;
        
        // Create temporary board state
        const tempBoard = this.board.map(row => [...row]);
        tempBoard[row][col] = this.currentPlayer;
        
        // Check for suicide rule (can't place stone with no liberties unless capturing)
        const hasLiberties = this.hasLiberties(tempBoard, row, col, this.currentPlayer);
        const captures = this.getCapturedGroups(tempBoard, this.getOpponent());
        
        if (!hasLiberties && captures.length === 0) {
            return false; // Suicide move
        }
        
        // Check Ko rule (can't recreate previous board state)
        if (this.violatesKoRule(tempBoard)) {
            return false;
        }
        
        return true;
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return;
        
        // Save current board state for Ko rule
        this.gameHistory.push({
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer
        });
        
        // Place the stone
        this.board[row][col] = this.currentPlayer;
        
        // Check for captures
        const capturedGroups = this.getCapturedGroups(this.board, this.getOpponent());
        let capturedCount = 0;
        
        capturedGroups.forEach(group => {
            group.forEach(pos => {
                this.board[pos.row][pos.col] = null;
                capturedCount++;
            });
        });
        
        // Update captured stones count
        this.capturedStones[this.currentPlayer] += capturedCount;
        
        // Update display with animation
        this.animateMove(row, col, capturedGroups);
        
        // Update last move info
        this.lastMove = { row, col, player: this.currentPlayer, captures: capturedCount };
        this.updateLastMoveDisplay();
        
        // Reset pass count
        this.passCount = 0;
        
        // Switch players
        this.switchPlayer();
        
        // Handle AI turn if needed
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') {
            setTimeout(() => this.makeAIMove(), 1000);
        }
        
        this.playSound('move');
        if (capturedCount > 0) {
            setTimeout(() => this.playSound('capture'), 300);
        }
    }

    animateMove(row, col, capturedGroups) {
        // Animate stone placement
        const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const container = intersection.querySelector('.stone-container');
        container.innerHTML = `<div class="go-stone ${this.currentPlayer} placing"></div>`;
        
        // Animate captured stones
        if (capturedGroups.length > 0) {
            setTimeout(() => {
                capturedGroups.forEach(group => {
                    group.forEach(pos => {
                        const capturedIntersection = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                        const capturedContainer = capturedIntersection.querySelector('.stone-container');
                        const stone = capturedContainer.querySelector('.go-stone');
                        if (stone) {
                            stone.classList.add('captured');
                            setTimeout(() => {
                                capturedContainer.innerHTML = '';
                            }, 500);
                        }
                    });
                });
            }, 400);
        }
        
        setTimeout(() => {
            this.updateBoardDisplay();
        }, 800);
    }

    getCapturedGroups(board, color) {
        const capturedGroups = [];
        const visited = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(false));
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board[row][col] === color && !visited[row][col]) {
                    const group = this.getGroup(board, row, col, color, visited);
                    if (!this.groupHasLiberties(board, group)) {
                        capturedGroups.push(group);
                    }
                }
            }
        }
        
        return capturedGroups;
    }

    getGroup(board, startRow, startCol, color, visited) {
        const group = [];
        const queue = [{ row: startRow, col: startCol }];
        
        while (queue.length > 0) {
            const { row, col } = queue.shift();
            
            if (visited[row][col]) continue;
            if (board[row][col] !== color) continue;
            
            visited[row][col] = true;
            group.push({ row, col });
            
            // Check adjacent intersections
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            directions.forEach(([dRow, dCol]) => {
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                if (this.isValidPosition(newRow, newCol) && !visited[newRow][newCol]) {
                    queue.push({ row: newRow, col: newCol });
                }
            });
        }
        
        return group;
    }

    groupHasLiberties(board, group) {
        for (const pos of group) {
            if (this.hasLiberties(board, pos.row, pos.col, board[pos.row][pos.col])) {
                return true;
            }
        }
        return false;
    }

    hasLiberties(board, row, col, color) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidPosition(newRow, newCol) && board[newRow][newCol] === null) {
                return true;
            }
        }
        
        return false;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    violatesKoRule(tempBoard) {
        // Simple Ko rule implementation - check if board state matches any recent state
        return this.gameHistory.some(state => this.boardsEqual(state.board, tempBoard));
    }

    boardsEqual(board1, board2) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board1[row][col] !== board2[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    passMove() {
        this.passCount++;
        this.lastMove = { type: 'pass', player: this.currentPlayer };
        this.updateLastMoveDisplay();
        
        if (this.passCount >= 2) {
            // Both players passed, game ends
            this.scoreGame();
            return;
        }
        
        this.switchPlayer();
        
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') {
            setTimeout(() => this.makeAIMove(), 1000);
        }
        
        this.updatePassDisplay();
    }

    makeAIMove() {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'white') return;
        
        const move = this.getBestAIMove();
        if (move) {
            this.makeMove(move.row, move.col);
        } else {
            this.passMove();
        }
    }

    getBestAIMove() {
        const validMoves = [];
        
        // Find all valid moves
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    validMoves.push({ row, col });
                }
            }
        }
        
        if (validMoves.length === 0) return null;
        
        // Simple AI heuristic
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            const score = this.evaluateMove(move.row, move.col);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || validMoves[0];
    }

    evaluateMove(row, col) {
        // Simple scoring heuristic
        let score = 0;
        
        // Prefer center positions
        const centerDistance = Math.abs(row - 4) + Math.abs(col - 4);
        score += (8 - centerDistance) * 2;
        
        // Check for captures
        const tempBoard = this.board.map(row => [...row]);
        tempBoard[row][col] = 'white';
        const captures = this.getCapturedGroups(tempBoard, 'black');
        score += captures.reduce((sum, group) => sum + group.length, 0) * 10;
        
        // Check for connections to existing stones
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let connections = 0;
        directions.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === 'white') {
                connections++;
            }
        });
        score += connections * 3;
        
        return score;
    }

    resignGame() {
        this.gameState = 'finished';
        this.winner = this.getOpponent();
        this.updateGameInfo();
        this.showFinalScore();
        this.playSound('win');
    }

    scoreGame() {
        this.gameState = 'finished';
        this.calculateTerritory();
        this.determineWinner();
        this.showFinalScore();
        this.playSound('win');
    }

    calculateTerritory() {
        // Simplified territory calculation
        // In a real Go game, this would be much more complex
        this.territory.black = this.capturedStones.black * 1;
        this.territory.white = this.capturedStones.white * 1 + this.komi;
        
        // Add rough territory estimate based on stone positions
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 'black') {
                    this.territory.black += 1;
                } else if (this.board[row][col] === 'white') {
                    this.territory.white += 1;
                }
            }
        }
    }

    determineWinner() {
        if (this.territory.black > this.territory.white) {
            this.winner = 'black';
        } else if (this.territory.white > this.territory.black) {
            this.winner = 'white';
        } else {
            this.winner = 'tie';
        }
    }

    showFinalScore() {
        const scoreDisplay = document.getElementById('score-display');
        const finalBlackScore = document.getElementById('final-black-score');
        const finalWhiteScore = document.getElementById('final-white-score');
        const winnerDisplay = document.getElementById('winner-display');
        
        scoreDisplay.style.display = 'block';
        finalBlackScore.textContent = this.territory.black.toFixed(1);
        finalWhiteScore.textContent = this.territory.white.toFixed(1);
        
        if (this.winner === 'tie') {
            winnerDisplay.textContent = 'Tie Game!';
            winnerDisplay.className = 'winner-display tie';
        } else {
            const winnerName = this.winner === 'black' ? 'Black' : 'White';
            winnerDisplay.textContent = `${winnerName} Wins!`;
            winnerDisplay.className = `winner-display ${this.winner}`;
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updateGameInfo();
        this.updateCaptureInfo();
    }

    updateBoardDisplay() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const container = intersection.querySelector('.stone-container');
                
                if (this.board[row][col]) {
                    container.innerHTML = `<div class="go-stone ${this.board[row][col]}"></div>`;
                } else {
                    container.innerHTML = '';
                }
            }
        }
    }

    updateGameInfo() {
        const status = document.getElementById('game-status');
        
        if (this.gameState === 'playing') {
            const playerName = this.currentPlayer === 'black' ? 'Black' : 'White';
            status.textContent = `${playerName}'s Turn`;
        } else if (this.gameState === 'finished') {
            status.textContent = 'Game Finished';
        }
    }

    updateCaptureInfo() {
        document.getElementById('black-captured').textContent = this.capturedStones.black;
        document.getElementById('white-captured').textContent = this.capturedStones.white;
    }

    updateLastMoveDisplay() {
        const display = document.getElementById('last-move-display');
        
        if (this.lastMove) {
            if (this.lastMove.type === 'pass') {
                display.textContent = `${this.lastMove.player} passed`;
            } else {
                const moveStr = this.coordinateToString(this.lastMove.row, this.lastMove.col);
                const captureStr = this.lastMove.captures > 0 ? ` (captured ${this.lastMove.captures})` : '';
                display.textContent = `${this.lastMove.player} ${moveStr}${captureStr}`;
            }
        }
    }

    updatePassDisplay() {
        const passDisplay = document.getElementById('pass-count');
        if (this.passCount > 0) {
            passDisplay.style.display = 'block';
            passDisplay.querySelector('span').textContent = this.passCount;
        } else {
            passDisplay.style.display = 'none';
        }
    }

    coordinateToString(row, col) {
        const letters = 'ABCDEFGHJKLMNOPQRS'; // Skip 'I' in Go notation
        return letters[col] + (this.boardSize - row);
    }

    getOpponent() {
        return this.currentPlayer === 'black' ? 'white' : 'black';
    }

    reset() {
        this.currentPlayer = 'black';
        this.gameState = 'playing';
        this.board = this.createEmptyBoard();
        this.capturedStones = { black: 0, white: 0 };
        this.territory = { black: 0, white: 0 };
        this.passCount = 0;
        this.gameHistory = [];
        this.winner = null;
        this.lastMove = null;
        
        this.updateBoardDisplay();
        this.updateGameInfo();
        this.updateCaptureInfo();
        this.updateLastMoveDisplay();
        
        // Hide score display
        document.getElementById('score-display').style.display = 'none';
        document.getElementById('pass-count').style.display = 'none';
    }
}