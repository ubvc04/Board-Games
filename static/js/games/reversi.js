class ReversiGame extends BaseGame {
    constructor() {
        super();
        this.boardSize = 8;
        this.currentPlayer = 'black'; // 'black' starts first in Reversi
        this.gameState = 'playing'; // 'playing', 'finished'
        this.board = this.createEmptyBoard();
        this.playerColors = { human: 'black', ai: 'white' };
        this.scores = { black: 2, white: 2 };
        this.validMoves = [];
        this.winner = null;
        this.gameMode = 'ai'; // 'ai' or 'human' (for 2-player)
        this.passCount = 0; // Count consecutive passes
        
        // AI difficulty
        this.aiDepth = 4;
    }

    init() {
        this.setupInitialBoard();
        this.createBoard();
        this.setupControls();
        this.calculateValidMoves();
        this.updateGameInfo();
    }

    createEmptyBoard() {
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
    }

    setupInitialBoard() {
        // Standard Reversi starting position
        const center = this.boardSize / 2;
        this.board[center - 1][center - 1] = 'white';
        this.board[center - 1][center] = 'black';
        this.board[center][center - 1] = 'black';
        this.board[center][center] = 'white';
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="reversi-container">
                <div class="game-area">
                    <div class="reversi-board" id="reversi-board">
                        ${this.createGridHTML()}
                    </div>
                </div>
                
                <div class="game-panel">
                    <div class="game-header">
                        <h2>Reversi (Othello)</h2>
                        <div class="game-status" id="game-status">
                            Black's Turn
                        </div>
                    </div>
                    
                    <div class="score-board">
                        <div class="score-item black-score">
                            <div class="score-piece black"></div>
                            <div class="score-info">
                                <div class="score-label">Black</div>
                                <div class="score-value" id="black-score">2</div>
                            </div>
                        </div>
                        
                        <div class="score-item white-score">
                            <div class="score-piece white"></div>
                            <div class="score-info">
                                <div class="score-label">White</div>
                                <div class="score-value" id="white-score">2</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-controls">
                        <button id="hint-btn" class="control-btn">
                            <i class="fas fa-lightbulb"></i> Show Hint
                        </button>
                        <button id="pass-btn" class="control-btn">
                            <i class="fas fa-forward"></i> Pass Turn
                        </button>
                        <button id="undo-btn" class="control-btn">
                            <i class="fas fa-undo"></i> Undo Move
                        </button>
                    </div>
                    
                    <div class="move-info">
                        <div class="valid-moves-count">
                            Valid moves: <span id="valid-moves-count">4</span>
                        </div>
                        <div class="last-move" id="last-move">
                            Game started
                        </div>
                    </div>
                    
                    <div class="game-rules">
                        <h4>How to Play:</h4>
                        <ul>
                            <li>Place pieces to trap opponent pieces</li>
                            <li>Trapped pieces flip to your color</li>
                            <li>Must flip at least one piece per move</li>
                            <li>Most pieces at end wins</li>
                        </ul>
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
                gridHTML += `
                    <div class="reversi-cell" 
                         data-row="${row}" 
                         data-col="${col}">
                        <div class="piece-container"></div>
                    </div>
                `;
            }
        }
        return gridHTML;
    }

    setupEventListeners() {
        document.querySelectorAll('.reversi-cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
            cell.addEventListener('mouseenter', (e) => this.showMovePreview(e));
            cell.addEventListener('mouseleave', (e) => this.hideMovePreview(e));
        });
    }

    setupControls() {
        const hintBtn = document.getElementById('hint-btn');
        const passBtn = document.getElementById('pass-btn');
        const undoBtn = document.getElementById('undo-btn');
        
        hintBtn?.addEventListener('click', () => this.showHint());
        passBtn?.addEventListener('click', () => this.passMove());
        undoBtn?.addEventListener('click', () => this.undoMove());
    }

    handleCellClick(event) {
        if (this.gameState !== 'playing') return;
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') return;
        
        const cell = event.target.closest('.reversi-cell');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
        }
    }

    showMovePreview(event) {
        if (this.gameState !== 'playing') return;
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') return;
        
        const cell = event.target.closest('.reversi-cell');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.isValidMove(row, col)) {
            cell.classList.add('valid-move-preview');
            
            // Show which pieces would be flipped
            const flippedPieces = this.getFlippedPieces(row, col, this.currentPlayer);
            flippedPieces.forEach(pos => {
                const previewCell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                if (previewCell) {
                    previewCell.classList.add('flip-preview');
                }
            });
        }
    }

    hideMovePreview(event) {
        const cell = event.target.closest('.reversi-cell');
        cell.classList.remove('valid-move-preview');
        
        // Remove all flip previews
        document.querySelectorAll('.flip-preview').forEach(cell => {
            cell.classList.remove('flip-preview');
        });
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return;
        
        // Place the piece
        this.board[row][col] = this.currentPlayer;
        
        // Flip opponent pieces
        const flippedPieces = this.getFlippedPieces(row, col, this.currentPlayer);
        flippedPieces.forEach(pos => {
            this.board[pos.row][pos.col] = this.currentPlayer;
        });
        
        // Update display with animations
        this.animateMove(row, col, flippedPieces);
        
        // Update scores
        this.updateScores();
        
        // Check for game end
        if (this.checkGameEnd()) return;
        
        // Switch players
        this.switchPlayer();
        
        // Handle AI turn if needed
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') {
            setTimeout(() => this.makeAIMove(), 1000);
        }
        
        this.playSound('move');
    }

    animateMove(row, col, flippedPieces) {
        // Animate piece placement
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const container = cell.querySelector('.piece-container');
        
        container.innerHTML = `<div class="reversi-piece ${this.currentPlayer} placing"></div>`;
        
        // Animate piece flips
        setTimeout(() => {
            flippedPieces.forEach((pos, index) => {
                setTimeout(() => {
                    const flipCell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                    const flipContainer = flipCell.querySelector('.piece-container');
                    const piece = flipContainer.querySelector('.reversi-piece');
                    
                    if (piece) {
                        piece.classList.add('flipping');
                        setTimeout(() => {
                            piece.className = `reversi-piece ${this.currentPlayer}`;
                        }, 150);
                    }
                }, index * 100);
            });
        }, 300);
        
        setTimeout(() => {
            this.updateBoardDisplay();
        }, 800);
    }

    updateBoardDisplay() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const container = cell.querySelector('.piece-container');
                
                if (this.board[row][col]) {
                    container.innerHTML = `<div class="reversi-piece ${this.board[row][col]}"></div>`;
                } else {
                    container.innerHTML = '';
                }
                
                // Highlight valid moves
                cell.classList.remove('valid-move');
                if (this.isValidMove(row, col)) {
                    cell.classList.add('valid-move');
                }
            }
        }
    }

    isValidMove(row, col) {
        if (this.board[row][col] !== null) return false;
        return this.getFlippedPieces(row, col, this.currentPlayer).length > 0;
    }

    getFlippedPieces(row, col, player) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        const flippedPieces = [];
        
        directions.forEach(([dRow, dCol]) => {
            const piecesInDirection = [];
            let currentRow = row + dRow;
            let currentCol = col + dCol;
            
            // Check pieces in this direction
            while (currentRow >= 0 && currentRow < this.boardSize &&
                   currentCol >= 0 && currentCol < this.boardSize) {
                
                const currentPiece = this.board[currentRow][currentCol];
                
                if (currentPiece === null) {
                    break; // Empty space, no valid flip
                } else if (currentPiece === player) {
                    // Found our piece, add all pieces in between to flip list
                    flippedPieces.push(...piecesInDirection);
                    break;
                } else {
                    // Opponent piece, add to potential flip list
                    piecesInDirection.push({ row: currentRow, col: currentCol });
                }
                
                currentRow += dRow;
                currentCol += dCol;
            }
        });
        
        return flippedPieces;
    }

    calculateValidMoves() {
        this.validMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    this.validMoves.push({ row, col });
                }
            }
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.passCount = 0;
        this.calculateValidMoves();
        this.updateGameInfo();
        
        // Check if current player has no valid moves
        if (this.validMoves.length === 0) {
            this.passMove();
        }
    }

    passMove() {
        this.passCount++;
        
        if (this.passCount >= 2) {
            // Both players passed, game ends
            this.endGame();
            return;
        }
        
        const status = document.getElementById('game-status');
        status.textContent = `${this.currentPlayer} passed. ${this.getOpponent()}'s turn.`;
        
        this.switchPlayer();
        
        if (this.gameMode === 'ai' && this.currentPlayer === 'white') {
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }

    makeAIMove() {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'white') return;
        
        const bestMove = this.getBestMove();
        if (bestMove) {
            this.makeMove(bestMove.row, bestMove.col);
        } else {
            this.passMove();
        }
    }

    getBestMove() {
        if (this.validMoves.length === 0) return null;
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of this.validMoves) {
            const score = this.minimax(move, this.aiDepth, false, -Infinity, Infinity);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    minimax(move, depth, isMaximizing, alpha, beta) {
        // Simple evaluation based on piece count and position value
        const boardCopy = this.board.map(row => [...row]);
        const flippedPieces = this.getFlippedPieces(move.row, move.col, 'white');
        
        // Simulate move
        boardCopy[move.row][move.col] = 'white';
        flippedPieces.forEach(pos => {
            boardCopy[pos.row][pos.col] = 'white';
        });
        
        if (depth === 0) {
            return this.evaluateBoard(boardCopy);
        }
        
        // Simplified minimax for performance
        const cornerBonus = this.isCorner(move.row, move.col) ? 50 : 0;
        const edgeBonus = this.isEdge(move.row, move.col) ? 10 : 0;
        const mobilityBonus = flippedPieces.length * 2;
        
        return cornerBonus + edgeBonus + mobilityBonus;
    }

    evaluateBoard(board) {
        let whiteCount = 0;
        let blackCount = 0;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board[row][col] === 'white') whiteCount++;
                else if (board[row][col] === 'black') blackCount++;
            }
        }
        
        return whiteCount - blackCount;
    }

    isCorner(row, col) {
        return (row === 0 || row === this.boardSize - 1) &&
               (col === 0 || col === this.boardSize - 1);
    }

    isEdge(row, col) {
        return row === 0 || row === this.boardSize - 1 ||
               col === 0 || col === this.boardSize - 1;
    }

    showHint() {
        // Remove previous hints
        document.querySelectorAll('.hint-move').forEach(cell => {
            cell.classList.remove('hint-move');
        });
        
        if (this.validMoves.length > 0) {
            // Show best move
            const bestMove = this.gameMode === 'ai' && this.currentPlayer === 'black' ? 
                this.getBestMoveForHuman() : this.validMoves[0];
            
            const hintCell = document.querySelector(`[data-row="${bestMove.row}"][data-col="${bestMove.col}"]`);
            if (hintCell) {
                hintCell.classList.add('hint-move');
                setTimeout(() => {
                    hintCell.classList.remove('hint-move');
                }, 3000);
            }
        }
    }

    getBestMoveForHuman() {
        // Simple heuristic for human hints
        let bestMove = this.validMoves[0];
        let bestScore = 0;
        
        for (const move of this.validMoves) {
            let score = this.getFlippedPieces(move.row, move.col, 'black').length;
            
            // Bonus for corners and edges
            if (this.isCorner(move.row, move.col)) score += 10;
            else if (this.isEdge(move.row, move.col)) score += 2;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    undoMove() {
        // Simple implementation - would need move history for full undo
        this.playSound('move');
    }

    updateScores() {
        this.scores.black = 0;
        this.scores.white = 0;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 'black') this.scores.black++;
                else if (this.board[row][col] === 'white') this.scores.white++;
            }
        }
        
        document.getElementById('black-score').textContent = this.scores.black;
        document.getElementById('white-score').textContent = this.scores.white;
    }

    updateGameInfo() {
        const status = document.getElementById('game-status');
        const validMovesCount = document.getElementById('valid-moves-count');
        
        if (this.gameState === 'playing') {
            const playerName = this.currentPlayer === 'black' ? 'Black' : 'White';
            status.textContent = `${playerName}'s Turn`;
        }
        
        validMovesCount.textContent = this.validMoves.length;
    }

    checkGameEnd() {
        // Game ends when board is full or no valid moves for both players
        const emptyCells = this.board.flat().filter(cell => cell === null).length;
        
        if (emptyCells === 0 || this.passCount >= 2) {
            this.endGame();
            return true;
        }
        
        return false;
    }

    endGame() {
        this.gameState = 'finished';
        
        if (this.scores.black > this.scores.white) {
            this.winner = 'black';
        } else if (this.scores.white > this.scores.black) {
            this.winner = 'white';
        } else {
            this.winner = 'tie';
        }
        
        const status = document.getElementById('game-status');
        
        if (this.winner === 'tie') {
            status.textContent = "It's a tie!";
        } else {
            const winnerName = this.winner === 'black' ? 'Black' : 'White';
            status.textContent = `${winnerName} wins!`;
        }
        
        this.playSound('win');
    }

    getOpponent() {
        return this.currentPlayer === 'black' ? 'white' : 'black';
    }

    reset() {
        this.currentPlayer = 'black';
        this.gameState = 'playing';
        this.board = this.createEmptyBoard();
        this.scores = { black: 2, white: 2 };
        this.validMoves = [];
        this.winner = null;
        this.passCount = 0;
        
        this.setupInitialBoard();
        this.calculateValidMoves();
        this.updateBoardDisplay();
        this.updateScores();
        this.updateGameInfo();
    }
}