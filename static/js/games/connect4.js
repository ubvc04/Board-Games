/**
 * Connect Four Game Implementation for Mini Games: Strategy & Board
 * Features: Animated piece dropping, win detection, AI opponent, column-based gameplay
 */

class Connect4Game extends BaseGame {
    constructor(container) {
        super(container);
        this.rows = 6;
        this.cols = 7;
        this.board = [];
        this.currentPlayer = 1; // 1 = Red, 2 = Yellow
        this.gameState = 'playing';
        this.aiEnabled = true;
        this.aiDifficulty = 2; // 1-3
        this.winningCells = [];
        this.moveHistory = [];
        
        this.initializeBoard();
    }

    async init() {
        try {
            // Create Connect Four board
            await this.createConnect4Board();
            
            // Create game controls
            this.createConnect4Controls();
            
            this.gameState = 'playing';
            this.showGameStatus('Red player starts - Click a column to drop your piece!', 'turn');
            
            // Play game start sound
            if (window.audioManager) {
                audioManager.playGameStart();
            }
            
        } catch (error) {
            console.error('Error initializing Connect Four game:', error);
            this.showGameStatus('Error initializing game', 'error');
        }
    }

    initializeBoard() {
        this.board = [];
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = 0; // 0 = empty, 1 = red, 2 = yellow
            }
        }
    }

    createConnect4Board() {
        this.container.innerHTML = '';
        
        // Game info panel
        const infoPanel = this.createGameInfo('Connect Four');
        this.container.appendChild(infoPanel);
        
        // Connect Four board container
        const boardContainer = document.createElement('div');
        boardContainer.className = 'connect4-board-container';
        
        // Create column indicators
        const columnIndicators = document.createElement('div');
        columnIndicators.className = 'column-indicators';
        for (let col = 0; col < this.cols; col++) {
            const indicator = document.createElement('div');
            indicator.className = 'column-indicator';
            indicator.dataset.col = col;
            indicator.innerHTML = `<i class="fas fa-arrow-down"></i>`;
            indicator.addEventListener('click', () => this.dropPiece(col));
            indicator.addEventListener('mouseenter', () => this.highlightColumn(col, true));
            indicator.addEventListener('mouseleave', () => this.highlightColumn(col, false));
            columnIndicators.appendChild(indicator);
        }
        boardContainer.appendChild(columnIndicators);
        
        // Create game board
        const board = document.createElement('div');
        board.className = 'connect4-board';
        
        const grid = document.createElement('div');
        grid.className = 'connect4-grid';
        grid.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        // Create cells
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'connect4-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click handler to column
                cell.addEventListener('click', () => this.dropPiece(col));
                cell.addEventListener('mouseenter', () => this.highlightColumn(col, true));
                cell.addEventListener('mouseleave', () => this.highlightColumn(col, false));
                
                grid.appendChild(cell);
            }
        }
        
        board.appendChild(grid);
        boardContainer.appendChild(board);
        this.container.appendChild(boardContainer);
        
        // Store references
        this.boardElement = grid;
        this.columnIndicators = columnIndicators;
        
        return Promise.resolve();
    }

    createConnect4Controls() {
        const controls = document.createElement('div');
        controls.className = 'connect4-controls';
        controls.innerHTML = `
            <div class="player-info">
                <div class="player-display red-player">
                    <div class="player-piece red"></div>
                    <span>Red Player</span>
                    <div class="player-indicator" id="red-indicator">●</div>
                </div>
                <div class="vs-text">VS</div>
                <div class="player-display yellow-player">
                    <div class="player-piece yellow"></div>
                    <span id="yellow-player-name">AI Player</span>
                    <div class="player-indicator" id="yellow-indicator"></div>
                </div>
            </div>
            <div class="connect4-buttons">
                <button class="connect4-btn" onclick="connect4Game.restart()">
                    <i class="fas fa-redo"></i> New Game
                </button>
                <button class="connect4-btn" onclick="connect4Game.toggleAI()" id="ai-toggle">
                    <i class="fas fa-robot"></i> AI: ON
                </button>
                <button class="connect4-btn" onclick="connect4Game.showHint()">
                    <i class="fas fa-lightbulb"></i> Hint
                </button>
                <button class="connect4-btn" onclick="connect4Game.undoMove()">
                    <i class="fas fa-undo"></i> Undo
                </button>
            </div>
        `;
        this.container.appendChild(controls);
        
        this.updatePlayerIndicator();
    }

    highlightColumn(col, highlight) {
        if (this.gameState !== 'playing') return;
        
        // Highlight column
        const cells = this.boardElement.querySelectorAll(`[data-col="${col}"]`);
        cells.forEach(cell => {
            if (highlight) {
                cell.classList.add('column-hover');
            } else {
                cell.classList.remove('column-hover');
            }
        });
        
        // Highlight indicator
        const indicator = this.columnIndicators.querySelector(`[data-col="${col}"]`);
        if (indicator) {
            if (highlight) {
                indicator.classList.add('indicator-hover');
            } else {
                indicator.classList.remove('indicator-hover');
            }
        }
    }

    async dropPiece(col) {
        if (this.gameState !== 'playing') return;
        
        // Find the lowest empty row in this column
        const row = this.getLowestEmptyRow(col);
        if (row === -1) {
            // Column is full
            this.showGameStatus('Column is full! Try another column.', 'error');
            if (window.audioManager) {
                audioManager.playError();
            }
            return;
        }
        
        // Place the piece
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ row, col, player: this.currentPlayer });
        
        // Animate piece drop
        await this.animatePieceDrop(row, col, this.currentPlayer);
        
        // Check for win
        if (this.checkWin(row, col)) {
            this.gameState = 'finished';
            this.highlightWinningCells();
            const playerName = this.currentPlayer === 1 ? 'Red' : 'Yellow';
            this.showGameStatus(`${playerName} wins!`, 'win');
            
            if (window.audioManager) {
                audioManager.playWin();
            }
            return;
        }
        
        // Check for draw
        if (this.isBoardFull()) {
            this.gameState = 'finished';
            this.showGameStatus('Game is a draw!', 'win');
            
            if (window.audioManager) {
                audioManager.playWin();
            }
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updatePlayerIndicator();
        
        // AI move if enabled and it's AI's turn
        if (this.aiEnabled && this.currentPlayer === 2) {
            this.showGameStatus('AI is thinking...', 'turn');
            setTimeout(() => this.makeAIMove(), 1000);
        } else {
            const playerName = this.currentPlayer === 1 ? 'Red' : 'Yellow';
            this.showGameStatus(`${playerName} player's turn`, 'turn');
        }
    }

    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1; // Column is full
    }

    async animatePieceDrop(targetRow, col, player) {
        const targetCell = this.getCellElement(targetRow, col);
        const playerClass = player === 1 ? 'red' : 'yellow';
        
        // Create animated piece at the top
        const animatedPiece = document.createElement('div');
        animatedPiece.className = `connect4-piece ${playerClass} dropping`;
        
        // Start from the indicator position
        const indicator = this.columnIndicators.querySelector(`[data-col="${col}"]`);
        const indicatorRect = indicator.getBoundingClientRect();
        const targetRect = targetCell.getBoundingClientRect();
        
        animatedPiece.style.position = 'fixed';
        animatedPiece.style.left = indicatorRect.left + 'px';
        animatedPiece.style.top = indicatorRect.bottom + 'px';
        animatedPiece.style.width = targetRect.width * 0.8 + 'px';
        animatedPiece.style.height = targetRect.height * 0.8 + 'px';
        animatedPiece.style.zIndex = '1000';
        animatedPiece.style.pointerEvents = 'none';
        
        document.body.appendChild(animatedPiece);
        
        // Play drop sound
        if (window.audioManager) {
            audioManager.playMove();
        }
        
        // Animate drop
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                animatedPiece.style.transition = 'top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                animatedPiece.style.top = targetRect.top + (targetRect.height * 0.1) + 'px';
            });
            
            setTimeout(() => {
                // Remove animated piece and show static piece
                document.body.removeChild(animatedPiece);
                this.placePieceInCell(targetRow, col, player);
                resolve();
            }, 500);
        });
    }

    placePieceInCell(row, col, player) {
        const cell = this.getCellElement(row, col);
        if (cell) {
            const piece = document.createElement('div');
            piece.className = `connect4-piece ${player === 1 ? 'red' : 'yellow'}`;
            cell.appendChild(piece);
        }
    }

    getCellElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal \
            [1, -1]   // Diagonal /
        ];
        
        for (const [dRow, dCol] of directions) {
            const count = this.countConsecutive(row, col, dRow, dCol, player);
            if (count >= 4) {
                this.winningCells = this.getWinningCells(row, col, dRow, dCol, player);
                return true;
            }
        }
        
        return false;
    }

    countConsecutive(row, col, dRow, dCol, player) {
        let count = 1; // Count the current piece
        
        // Count in positive direction
        let r = row + dRow;
        let c = col + dCol;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            count++;
            r += dRow;
            c += dCol;
        }
        
        // Count in negative direction
        r = row - dRow;
        c = col - dCol;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            count++;
            r -= dRow;
            c -= dCol;
        }
        
        return count;
    }

    getWinningCells(row, col, dRow, dCol, player) {
        const cells = [{ row, col }];
        
        // Collect in positive direction
        let r = row + dRow;
        let c = col + dCol;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            cells.push({ row: r, col: c });
            r += dRow;
            c += dCol;
        }
        
        // Collect in negative direction
        r = row - dRow;
        c = col - dCol;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            cells.push({ row: r, col: c });
            r -= dRow;
            c -= dCol;
        }
        
        return cells;
    }

    highlightWinningCells() {
        this.winningCells.forEach(({ row, col }) => {
            const cell = this.getCellElement(row, col);
            if (cell) {
                cell.classList.add('winning-cell');
            }
        });
    }

    isBoardFull() {
        for (let col = 0; col < this.cols; col++) {
            if (this.board[0][col] === 0) {
                return false;
            }
        }
        return true;
    }

    async makeAIMove() {
        if (this.gameState !== 'playing') return;
        
        const bestCol = this.getBestMove();
        if (bestCol !== -1) {
            await this.dropPiece(bestCol);
        }
    }

    getBestMove() {
        // Simple AI using minimax with alpha-beta pruning
        let bestScore = -Infinity;
        let bestCol = -1;
        
        for (let col = 0; col < this.cols; col++) {
            const row = this.getLowestEmptyRow(col);
            if (row !== -1) {
                // Make move
                this.board[row][col] = 2;
                
                // Evaluate
                const score = this.minimax(this.aiDifficulty, false, -Infinity, Infinity);
                
                // Undo move
                this.board[row][col] = 0;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestCol = col;
                }
            }
        }
        
        return bestCol;
    }

    minimax(depth, isMaximizing, alpha, beta) {
        // Check for terminal states
        const score = this.evaluateBoard();
        if (score !== 0 || depth === 0 || this.isBoardFull()) {
            return score;
        }
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let col = 0; col < this.cols; col++) {
                const row = this.getLowestEmptyRow(col);
                if (row !== -1) {
                    this.board[row][col] = 2; // AI move
                    const evaluation = this.minimax(depth - 1, false, alpha, beta);
                    this.board[row][col] = 0;
                    
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    
                    if (beta <= alpha) break; // Alpha-beta pruning
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let col = 0; col < this.cols; col++) {
                const row = this.getLowestEmptyRow(col);
                if (row !== -1) {
                    this.board[row][col] = 1; // Human move
                    const evaluation = this.minimax(depth - 1, true, alpha, beta);
                    this.board[row][col] = 0;
                    
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    
                    if (beta <= alpha) break; // Alpha-beta pruning
                }
            }
            return minEval;
        }
    }

    evaluateBoard() {
        // Check for wins
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== 0) {
                    if (this.checkWin(row, col)) {
                        return this.board[row][col] === 2 ? 1000 : -1000;
                    }
                }
            }
        }
        
        // Evaluate positions (simplified)
        let score = 0;
        
        // Center column preference
        for (let row = 0; row < this.rows; row++) {
            if (this.board[row][3] === 2) score += 3;
            if (this.board[row][3] === 1) score -= 3;
        }
        
        return score;
    }

    updatePlayerIndicator() {
        const redIndicator = document.getElementById('red-indicator');
        const yellowIndicator = document.getElementById('yellow-indicator');
        
        if (redIndicator && yellowIndicator) {
            if (this.currentPlayer === 1) {
                redIndicator.style.opacity = '1';
                yellowIndicator.style.opacity = '0.3';
            } else {
                redIndicator.style.opacity = '0.3';
                yellowIndicator.style.opacity = '1';
            }
        }
    }

    showHint() {
        if (this.gameState !== 'playing' || this.currentPlayer === 2) return;
        
        const bestCol = this.getBestMove();
        if (bestCol !== -1) {
            // Highlight the suggested column
            this.highlightColumn(bestCol, true);
            this.showGameStatus(`Hint: Try column ${bestCol + 1}`, 'info');
            
            setTimeout(() => {
                this.highlightColumn(bestCol, false);
            }, 3000);
        } else {
            this.showGameStatus('No hint available', 'info');
        }
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        // Undo last move(s) - undo AI move too if present
        const movesToUndo = this.aiEnabled ? Math.min(2, this.moveHistory.length) : 1;
        
        for (let i = 0; i < movesToUndo; i++) {
            const lastMove = this.moveHistory.pop();
            if (lastMove) {
                this.board[lastMove.row][lastMove.col] = 0;
                const cell = this.getCellElement(lastMove.row, lastMove.col);
                if (cell) {
                    cell.innerHTML = '';
                    cell.classList.remove('winning-cell');
                }
            }
        }
        
        this.currentPlayer = 1; // Always back to human player
        this.gameState = 'playing';
        this.winningCells = [];
        
        this.updatePlayerIndicator();
        this.showGameStatus('Move undone - Red player\'s turn', 'turn');
    }

    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const button = document.getElementById('ai-toggle');
        const yellowPlayerName = document.getElementById('yellow-player-name');
        
        if (button) {
            button.innerHTML = `<i class="fas fa-robot"></i> AI: ${this.aiEnabled ? 'ON' : 'OFF'}`;
        }
        
        if (yellowPlayerName) {
            yellowPlayerName.textContent = this.aiEnabled ? 'AI Player' : 'Yellow Player';
        }
        
        // If it's currently AI's turn and we disabled AI, switch to human
        if (!this.aiEnabled && this.currentPlayer === 2 && this.gameState === 'playing') {
            this.showGameStatus('Yellow player\'s turn', 'turn');
        }
    }

    restart() {
        this.initializeBoard();
        this.currentPlayer = 1;
        this.gameState = 'playing';
        this.winningCells = [];
        this.moveHistory = [];
        
        // Clear board display
        const cells = this.boardElement.querySelectorAll('.connect4-cell');
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('winning-cell', 'column-hover');
        });
        
        // Clear column indicators
        const indicators = this.columnIndicators.querySelectorAll('.column-indicator');
        indicators.forEach(indicator => {
            indicator.classList.remove('indicator-hover');
        });
        
        this.updatePlayerIndicator();
        this.showGameStatus('New game started - Red player begins!', 'turn');
        
        if (window.audioManager) {
            audioManager.playGameStart();
        }
    }

    cleanup() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Add Connect Four-specific CSS
const connect4Styles = document.createElement('style');
connect4Styles.textContent = `
    .connect4-board-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 1rem 0;
    }
    
    .column-indicators {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
        margin-bottom: 1rem;
        max-width: 500px;
        width: 100%;
    }
    
    .column-indicator {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 0.5rem;
        text-align: center;
        cursor: pointer;
        transition: var(--transition);
        color: var(--text-light);
    }
    
    .column-indicator:hover,
    .column-indicator.indicator-hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }
    
    .connect4-board {
        background: #0066cc;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: var(--shadow);
        max-width: 500px;
    }
    
    .connect4-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: repeat(6, 1fr);
        gap: 8px;
        aspect-ratio: 7/6;
    }
    
    .connect4-cell {
        background: white;
        border-radius: 50%;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        justify-content: center;
        align-items: center;
        aspect-ratio: 1;
    }
    
    .connect4-cell:hover,
    .connect4-cell.column-hover {
        background: #f0f0f0;
        transform: scale(1.05);
    }
    
    .connect4-cell.winning-cell {
        background: #ffd700 !important;
        animation: pulse 1s infinite;
    }
    
    .connect4-piece {
        width: 85%;
        height: 85%;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .connect4-piece.red {
        background: radial-gradient(circle at 30% 30%, #ff6b6b, #cc0000);
    }
    
    .connect4-piece.yellow {
        background: radial-gradient(circle at 30% 30%, #ffd93d, #ffb800);
    }
    
    .connect4-piece.dropping {
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    
    .player-info {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        margin: 1rem 0;
        max-width: 500px;
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 12px;
    }
    
    .player-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-light);
        font-weight: 600;
    }
    
    .player-piece {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .player-piece.red {
        background: radial-gradient(circle at 30% 30%, #ff6b6b, #cc0000);
    }
    
    .player-piece.yellow {
        background: radial-gradient(circle at 30% 30%, #ffd93d, #ffb800);
    }
    
    .player-indicator {
        font-size: 1.5rem;
        transition: opacity 0.3s;
        color: var(--warning-color);
    }
    
    .vs-text {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--text-light);
    }
    
    .connect4-controls {
        max-width: 500px;
        margin: 1rem auto;
    }
    
    .connect4-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 1rem;
    }
    
    .connect4-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-light);
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .connect4-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
        .connect4-board {
            padding: 0.5rem;
        }
        
        .column-indicators {
            max-width: 90vw;
        }
        
        .connect4-grid {
            gap: 5px;
        }
        
        .player-info {
            flex-direction: column;
            gap: 1rem;
        }
        
        .vs-text {
            order: 1;
        }
        
        .player-display {
            flex-direction: row;
            gap: 1rem;
        }
        
        .connect4-buttons {
            justify-content: center;
        }
    }
`;
document.head.appendChild(connect4Styles);

// Global reference for HTML onclick handlers
let connect4Game;