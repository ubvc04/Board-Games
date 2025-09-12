/**
 * Checkers (Draughts) Game Implementation for Mini Games: Strategy & Board
 * Features: Turn-based gameplay, jump captures, king promotion, animated moves
 */

class CheckersGame extends BaseGame {
    constructor(container) {
        super(container);
        this.boardSize = 8;
        this.selectedPiece = null;
        this.validMoves = [];
        this.board = [];
        this.isRedTurn = true; // Red starts first
        this.mustCapture = false;
        this.captureSequence = [];
        this.redScore = 0;
        this.blackScore = 0;
        
        // Initialize empty board
        this.initializeBoard();
    }

    async init() {
        try {
            // Create checkers board
            await this.createCheckersBoard();
            
            // Set up initial pieces
            this.setupInitialPieces();
            
            // Create game controls
            this.createCheckersControls();
            
            this.gameState = 'playing';
            this.showGameStatus('Red player starts', 'turn');
            
            // Play game start sound
            if (window.audioManager) {
                audioManager.playGameStart();
            }
            
        } catch (error) {
            console.error('Error initializing checkers game:', error);
            this.showGameStatus('Error initializing game', 'error');
        }
    }

    initializeBoard() {
        // Create 8x8 board array
        this.board = [];
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = null;
            }
        }
    }

    createCheckersBoard() {
        this.container.innerHTML = '';
        
        // Game info panel
        const infoPanel = this.createGameInfo('Checkers');
        this.container.appendChild(infoPanel);
        
        // Checkers board container
        const boardContainer = document.createElement('div');
        boardContainer.className = 'checkers-board-container';
        
        // Create 8x8 checkers board
        const { board, grid } = this.createGameBoard(8, 8, 'checkers-square');
        board.className = 'checkers-board';
        grid.className = 'checkers-grid';
        
        // Color the squares (only dark squares are playable)
        this.colorCheckersSquares(grid);
        
        // Add click handlers
        grid.addEventListener('click', (e) => this.handleSquareClick(e));
        
        boardContainer.appendChild(board);
        this.container.appendChild(boardContainer);
        
        // Store board reference
        this.boardElement = grid;
        
        return Promise.resolve();
    }

    colorCheckersSquares(grid) {
        const squares = grid.querySelectorAll('.checkers-square');
        squares.forEach((square, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const isDark = (row + col) % 2 === 1;
            
            square.classList.add(isDark ? 'dark-square' : 'light-square');
            square.dataset.row = row;
            square.dataset.col = col;
            
            // Only dark squares are playable in checkers
            if (!isDark) {
                square.classList.add('unplayable');
            }
        });
    }

    createCheckersControls() {
        const controls = document.createElement('div');
        controls.className = 'checkers-controls';
        controls.innerHTML = `
            <div class="score-panel">
                <div class="player-score red-player">
                    <h3>Red Player</h3>
                    <div class="score">Captured: <span id="red-score">0</span></div>
                    <div class="pieces-count">Pieces: <span id="red-pieces">12</span></div>
                </div>
                <div class="player-score black-player">
                    <h3>Black Player</h3>
                    <div class="score">Captured: <span id="black-score">0</span></div>
                    <div class="pieces-count">Pieces: <span id="black-pieces">12</span></div>
                </div>
            </div>
            <div class="checkers-buttons">
                <button class="checkers-btn" onclick="checkersGame.restart()">
                    <i class="fas fa-redo"></i> New Game
                </button>
                <button class="checkers-btn" onclick="checkersGame.showPossibleMoves()">
                    <i class="fas fa-lightbulb"></i> Show Moves
                </button>
                <button class="checkers-btn" onclick="checkersGame.undoMove()">
                    <i class="fas fa-undo"></i> Undo Move
                </button>
            </div>
        `;
        this.container.appendChild(controls);
    }

    setupInitialPieces() {
        // Clear board
        this.initializeBoard();
        
        // Place black pieces (top 3 rows, dark squares only)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    this.board[row][col] = { color: 'black', isKing: false };
                    this.placePieceOnBoard(row, col, 'black', false);
                }
            }
        }
        
        // Place red pieces (bottom 3 rows, dark squares only)
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    this.board[row][col] = { color: 'red', isKing: false };
                    this.placePieceOnBoard(row, col, 'red', false);
                }
            }
        }
        
        this.updateScoreDisplay();
    }

    placePieceOnBoard(row, col, color, isKing) {
        const square = this.getSquareElement(row, col);
        if (square) {
            square.innerHTML = '';
            const piece = document.createElement('div');
            piece.className = `checkers-piece ${color} ${isKing ? 'king' : ''}`;
            piece.innerHTML = isKing ? '♔' : '●';
            piece.dataset.row = row;
            piece.dataset.col = col;
            piece.dataset.color = color;
            piece.dataset.isKing = isKing;
            square.appendChild(piece);
        }
    }

    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    handleSquareClick(event) {
        if (this.gameState !== 'playing') return;
        
        const square = event.target.closest('.checkers-square');
        if (!square || square.classList.contains('unplayable')) return;
        
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        const piece = square.querySelector('.checkers-piece');
        
        if (this.selectedPiece) {
            // Try to make a move
            this.attemptMove(this.selectedPiece, { row, col });
        } else if (piece) {
            // Select a piece
            this.selectPiece(row, col, piece);
        }
    }

    selectPiece(row, col, pieceElement) {
        const currentPlayer = this.isRedTurn ? 'red' : 'black';
        const pieceColor = pieceElement.dataset.color;
        
        // Only allow selecting pieces of the current player
        if (pieceColor !== currentPlayer) {
            return;
        }
        
        // Check if this piece has mandatory captures
        if (this.mustCapture) {
            const hasCapture = this.hasCaptureMoves(row, col);
            if (!hasCapture) {
                this.showGameStatus('You must capture with a piece that can capture', 'error');
                return;
            }
        }
        
        // Clear previous selection
        this.clearSelection();
        
        // Select the piece
        this.selectedPiece = { row, col, element: pieceElement };
        pieceElement.parentElement.classList.add('selected');
        
        // Calculate and highlight valid moves
        this.calculateValidMoves(row, col);
        this.highlightValidMoves();
        
        // Play selection sound
        if (window.audioManager) {
            audioManager.playClick();
        }
    }

    clearSelection() {
        if (this.selectedPiece) {
            this.selectedPiece.element.parentElement.classList.remove('selected');
        }
        this.selectedPiece = null;
        
        // Clear valid move highlights
        this.boardElement.querySelectorAll('.valid-move, .capture-move').forEach(square => {
            square.classList.remove('valid-move', 'capture-move');
        });
        this.validMoves = [];
    }

    calculateValidMoves(row, col) {
        this.validMoves = [];
        const piece = this.board[row][col];
        if (!piece) return;
        
        const directions = this.getMoveDirections(piece);
        
        // Check for captures first
        const captures = this.getCaptureMoves(row, col, directions);
        if (captures.length > 0) {
            this.validMoves = captures;
            return;
        }
        
        // If no captures and must capture, no valid moves
        if (this.mustCapture) {
            return;
        }
        
        // Check for regular moves
        const regularMoves = this.getRegularMoves(row, col, directions);
        this.validMoves = regularMoves;
    }

    getMoveDirections(piece) {
        if (piece.isKing) {
            // Kings can move in all diagonal directions
            return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        } else if (piece.color === 'red') {
            // Red pieces move up (negative row direction)
            return [[-1, -1], [-1, 1]];
        } else {
            // Black pieces move down (positive row direction)
            return [[1, -1], [1, 1]];
        }
    }

    getRegularMoves(row, col, directions) {
        const moves = [];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, type: 'regular' });
            }
        }
        
        return moves;
    }

    getCaptureMoves(row, col, directions) {
        const captures = [];
        
        for (const [dRow, dCol] of directions) {
            const jumpRow = row + dRow;
            const jumpCol = col + dCol;
            const landRow = row + (dRow * 2);
            const landCol = col + (dCol * 2);
            
            if (this.isValidPosition(landRow, landCol) && 
                this.board[jumpRow] && this.board[jumpRow][jumpCol] &&
                this.board[jumpRow][jumpCol].color !== this.board[row][col].color &&
                !this.board[landRow][landCol]) {
                
                captures.push({
                    row: landRow,
                    col: landCol,
                    type: 'capture',
                    capturedRow: jumpRow,
                    capturedCol: jumpCol
                });
            }
        }
        
        return captures;
    }

    hasCaptureMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return false;
        
        const directions = this.getMoveDirections(piece);
        const captures = this.getCaptureMoves(row, col, directions);
        return captures.length > 0;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8 && (row + col) % 2 === 1;
    }

    highlightValidMoves() {
        this.validMoves.forEach(move => {
            const square = this.getSquareElement(move.row, move.col);
            if (square) {
                square.classList.add(move.type === 'capture' ? 'capture-move' : 'valid-move');
            }
        });
    }

    async attemptMove(selectedPiece, target) {
        const validMove = this.validMoves.find(move => 
            move.row === target.row && move.col === target.col);
        
        if (!validMove) {
            this.clearSelection();
            if (window.audioManager) {
                audioManager.playError();
            }
            return;
        }
        
        // Execute the move
        await this.executeMove(selectedPiece, validMove);
        
        // Check for additional captures
        if (validMove.type === 'capture') {
            const additionalCaptures = this.getCaptureMoves(target.row, target.col, 
                this.getMoveDirections(this.board[target.row][target.col]));
            
            if (additionalCaptures.length > 0) {
                // Continue capturing with the same piece
                this.selectedPiece = {
                    row: target.row,
                    col: target.col,
                    element: this.getSquareElement(target.row, target.col).querySelector('.checkers-piece')
                };
                this.selectedPiece.element.parentElement.classList.add('selected');
                this.validMoves = additionalCaptures;
                this.highlightValidMoves();
                this.showGameStatus('Continue capturing!', 'turn');
                return;
            }
        }
        
        // End turn
        this.endTurn();
    }

    async executeMove(selectedPiece, move) {
        const fromRow = selectedPiece.row;
        const fromCol = selectedPiece.col;
        const toRow = move.row;
        const toCol = move.col;
        
        const piece = this.board[fromRow][fromCol];
        const fromSquare = this.getSquareElement(fromRow, fromCol);
        const toSquare = this.getSquareElement(toRow, toCol);
        
        // Handle capture
        if (move.type === 'capture') {
            const capturedPiece = this.board[move.capturedRow][move.capturedCol];
            this.board[move.capturedRow][move.capturedCol] = null;
            
            const capturedSquare = this.getSquareElement(move.capturedRow, move.capturedCol);
            capturedSquare.innerHTML = '';
            
            // Update score
            if (capturedPiece.color === 'red') {
                this.blackScore++;
            } else {
                this.redScore++;
            }
            
            if (window.audioManager) {
                audioManager.playCapture();
            }
        } else {
            if (window.audioManager) {
                audioManager.playMove();
            }
        }
        
        // Move piece in board array
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check for king promotion
        if (!piece.isKing) {
            if ((piece.color === 'red' && toRow === 0) || 
                (piece.color === 'black' && toRow === 7)) {
                piece.isKing = true;
            }
        }
        
        // Animate the move
        await this.animateCheckersMove(fromSquare, toSquare, selectedPiece.element);
        
        // Update the board display
        fromSquare.innerHTML = '';
        this.placePieceOnBoard(toRow, toCol, piece.color, piece.isKing);
        
        // Clear selection
        this.clearSelection();
        
        // Update display
        this.updateScoreDisplay();
        
        // Check for game end
        this.checkGameEnd();
    }

    animateCheckersMove(fromSquare, toSquare, piece) {
        return new Promise((resolve) => {
            this.animateMove(fromSquare, toSquare, piece, resolve);
        });
    }

    endTurn() {
        this.isRedTurn = !this.isRedTurn;
        this.currentPlayer = this.isRedTurn ? 1 : 2;
        
        // Check if current player has mandatory captures
        this.mustCapture = this.checkMandatoryCaptures();
        
        this.updatePlayerTurn();
        
        const currentPlayerName = this.isRedTurn ? 'Red' : 'Black';
        const statusMessage = this.mustCapture ? 
            `${currentPlayerName} must capture!` : 
            `${currentPlayerName} player's turn`;
        
        this.showGameStatus(statusMessage, 'turn');
    }

    checkMandatoryCaptures() {
        const currentColor = this.isRedTurn ? 'red' : 'black';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === currentColor) {
                    if (this.hasCaptureMoves(row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    updatePlayerTurn() {
        const turnElement = this.container.querySelector('.player-turn');
        if (turnElement) {
            turnElement.textContent = `Current Turn: ${this.isRedTurn ? 'Red' : 'Black'} Player`;
        }
    }

    updateScoreDisplay() {
        const redScoreElement = document.getElementById('red-score');
        const blackScoreElement = document.getElementById('black-score');
        const redPiecesElement = document.getElementById('red-pieces');
        const blackPiecesElement = document.getElementById('black-pieces');
        
        if (redScoreElement) redScoreElement.textContent = this.redScore;
        if (blackScoreElement) blackScoreElement.textContent = this.blackScore;
        
        // Count remaining pieces
        let redPieces = 0;
        let blackPieces = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.color === 'red') redPieces++;
                    else blackPieces++;
                }
            }
        }
        
        if (redPiecesElement) redPiecesElement.textContent = redPieces;
        if (blackPiecesElement) blackPiecesElement.textContent = blackPieces;
    }

    checkGameEnd() {
        const currentColor = this.isRedTurn ? 'red' : 'black';
        const hasValidMoves = this.playerHasValidMoves(currentColor);
        
        if (!hasValidMoves) {
            this.gameState = 'finished';
            const winner = this.isRedTurn ? 'Black' : 'Red';
            this.showGameStatus(`${winner} wins! No valid moves remaining.`, 'win');
            
            if (window.audioManager) {
                audioManager.playWin();
            }
        }
    }

    playerHasValidMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    this.calculateValidMoves(row, col);
                    if (this.validMoves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    showPossibleMoves() {
        if (this.gameState !== 'playing') return;
        
        const currentColor = this.isRedTurn ? 'red' : 'black';
        let moveCount = 0;
        
        // Clear previous highlights
        this.boardElement.querySelectorAll('.possible-move').forEach(square => {
            square.classList.remove('possible-move');
        });
        
        // Highlight all pieces that can move
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === currentColor) {
                    this.calculateValidMoves(row, col);
                    if (this.validMoves.length > 0) {
                        const square = this.getSquareElement(row, col);
                        square.classList.add('possible-move');
                        moveCount++;
                    }
                }
            }
        }
        
        this.showGameStatus(`${moveCount} pieces can move`, 'info');
        
        // Remove highlights after 3 seconds
        setTimeout(() => {
            this.boardElement.querySelectorAll('.possible-move').forEach(square => {
                square.classList.remove('possible-move');
            });
        }, 3000);
    }

    undoMove() {
        // Placeholder for undo functionality
        this.showGameStatus('Undo not yet implemented', 'info');
    }

    restart() {
        this.initializeBoard();
        this.setupInitialPieces();
        this.isRedTurn = true;
        this.currentPlayer = 1;
        this.gameState = 'playing';
        this.mustCapture = false;
        this.redScore = 0;
        this.blackScore = 0;
        
        this.clearSelection();
        this.updateScoreDisplay();
        this.updatePlayerTurn();
        
        this.showGameStatus('New game started - Red player begins', 'turn');
        
        if (window.audioManager) {
            audioManager.playGameStart();
        }
    }

    cleanup() {
        this.clearSelection();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Add checkers-specific CSS
const checkersStyles = document.createElement('style');
checkersStyles.textContent = `
    .checkers-board-container {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }
    
    .checkers-board {
        max-width: 600px;
        background: #8b4513;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: var(--shadow);
    }
    
    .checkers-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        gap: 1px;
        aspect-ratio: 1;
    }
    
    .checkers-square {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        position: relative;
        aspect-ratio: 1;
    }
    
    .checkers-square.light-square {
        background: #f0d9b5;
    }
    
    .checkers-square.dark-square {
        background: #b58863;
    }
    
    .checkers-square.unplayable {
        cursor: not-allowed;
        opacity: 0.5;
    }
    
    .checkers-square:not(.unplayable):hover {
        opacity: 0.8;
    }
    
    .checkers-square.selected {
        box-shadow: inset 0 0 0 3px #ffd700;
    }
    
    .checkers-square.valid-move {
        box-shadow: inset 0 0 0 2px #00ff00;
    }
    
    .checkers-square.valid-move::after {
        content: '';
        position: absolute;
        width: 30%;
        height: 30%;
        background: #00ff00;
        border-radius: 50%;
        opacity: 0.5;
    }
    
    .checkers-square.capture-move {
        box-shadow: inset 0 0 0 3px #ff0000;
    }
    
    .checkers-square.capture-move::after {
        content: '';
        position: absolute;
        width: 40%;
        height: 40%;
        background: #ff0000;
        border-radius: 50%;
        opacity: 0.7;
    }
    
    .checkers-square.possible-move {
        animation: pulse 2s infinite;
        box-shadow: inset 0 0 0 2px #ffff00;
    }
    
    .checkers-piece {
        width: 80%;
        height: 80%;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        cursor: pointer;
        transition: transform 0.2s;
        border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .checkers-piece.red {
        background: radial-gradient(circle, #ff4444, #cc0000);
    }
    
    .checkers-piece.black {
        background: radial-gradient(circle, #444444, #000000);
    }
    
    .checkers-piece.king {
        font-size: 2rem;
        box-shadow: 0 0 0 3px #ffd700;
    }
    
    .checkers-piece:hover {
        transform: scale(1.1);
    }
    
    .score-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 1rem 0;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .player-score {
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
    }
    
    .red-player {
        border: 2px solid #ff4444;
    }
    
    .black-player {
        border: 2px solid #444444;
    }
    
    .player-score h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-light);
    }
    
    .player-score .score,
    .player-score .pieces-count {
        margin: 0.25rem 0;
        color: var(--text-light);
        font-weight: 500;
    }
    
    .checkers-controls {
        max-width: 600px;
        margin: 1rem auto;
    }
    
    .checkers-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 1rem;
    }
    
    .checkers-btn {
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
    
    .checkers-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
        .checkers-board {
            padding: 0.5rem;
        }
        
        .checkers-piece {
            font-size: 1.2rem;
        }
        
        .checkers-piece.king {
            font-size: 1.5rem;
        }
        
        .score-panel {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        
        .checkers-buttons {
            justify-content: center;
        }
    }
`;
document.head.appendChild(checkersStyles);

// Global reference for HTML onclick handlers
let checkersGame;