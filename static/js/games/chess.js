/**
 * Chess Game Implementation for Mini Games: Strategy & Board
 * Features: Move validation, check/checkmate detection, AI opponent, hints, animated moves
 */

class ChessGame extends BaseGame {
    constructor(container) {
        super(container);
        this.boardSize = 8;
        this.selectedSquare = null;
        this.validMoves = [];
        this.pieces = {};
        this.gameHistory = [];
        this.isCheckmate = false;
        this.isCheck = false;
        this.aiEnabled = true;
        this.aiDifficulty = 2; // 1-3 difficulty levels
        this.whiteToMove = true;
        this.aiThinking = false;
        
        // Chess piece symbols
        this.pieceSymbols = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        
        // Initial board position (FEN notation)
        this.initialPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        this.currentPosition = this.initialPosition;
    }

    async init() {
        try {
            // Create chess board
            await this.createChessBoard();
            
            // Set up initial position
            this.setupInitialPosition();
            
            // Create game controls
            this.createChessControls();
            
            // Initialize backend connection
            await this.initializeBackend();
            
            this.gameState = 'playing';
            this.showGameStatus('White to move', 'turn');
            
            // Play game start sound
            if (window.audioManager) {
                audioManager.playGameStart();
            }
            
        } catch (error) {
            console.error('Error initializing chess game:', error);
            this.showGameStatus('Error initializing game', 'error');
        }
    }

    createChessBoard() {
        this.container.innerHTML = '';
        
        // Game info panel
        const infoPanel = this.createGameInfo('Chess');
        this.container.appendChild(infoPanel);
        
        // Chess board container
        const boardContainer = document.createElement('div');
        boardContainer.className = 'chess-board-container';
        
        // Create 8x8 chess board
        const { board, grid } = this.createGameBoard(8, 8, 'chess-square');
        board.className = 'chess-board';
        grid.className = 'chess-grid';
        
        // Color the squares
        this.colorChessSquares(grid);
        
        // Add click handlers
        grid.addEventListener('click', (e) => this.handleSquareClick(e));
        
        boardContainer.appendChild(board);
        this.container.appendChild(boardContainer);
        
        // Store board reference
        this.boardElement = grid;
        
        // Captured pieces panels
        this.createCapturedPiecesPanel();
        
        return Promise.resolve();
    }

    colorChessSquares(grid) {
        const squares = grid.querySelectorAll('.chess-square');
        squares.forEach((square, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const isLight = (row + col) % 2 === 0;
            square.classList.add(isLight ? 'light-square' : 'dark-square');
            
            // Add algebraic notation
            const file = String.fromCharCode(97 + col); // a-h
            const rank = 8 - row; // 8-1
            square.dataset.square = file + rank;
        });
    }

    createCapturedPiecesPanel() {
        const capturedPanel = document.createElement('div');
        capturedPanel.className = 'captured-pieces-panel';
        capturedPanel.innerHTML = `
            <div class="captured-white">
                <h4>Captured White Pieces</h4>
                <div class="captured-pieces" id="captured-white"></div>
            </div>
            <div class="captured-black">
                <h4>Captured Black Pieces</h4>
                <div class="captured-pieces" id="captured-black"></div>
            </div>
        `;
        this.container.appendChild(capturedPanel);
    }

    createChessControls() {
        const controls = document.createElement('div');
        controls.className = 'chess-controls';
        controls.innerHTML = `
            <div class="chess-buttons">
                <button class="chess-btn" onclick="chessGame.restart()">
                    <i class="fas fa-redo"></i> New Game
                </button>
                <button class="chess-btn" onclick="chessGame.showHint()">
                    <i class="fas fa-lightbulb"></i> Hint
                </button>
                <button class="chess-btn" onclick="chessGame.undoLastMove()">
                    <i class="fas fa-undo"></i> Undo Move
                </button>
                <button class="chess-btn" onclick="chessGame.toggleAI()" id="ai-toggle">
                    <i class="fas fa-robot"></i> AI: ON
                </button>
            </div>
            <div class="chess-status">
                <div class="move-history" id="move-history">
                    <h4>Move History</h4>
                    <div class="moves-list" id="moves-list"></div>
                </div>
            </div>
        `;
        this.container.appendChild(controls);
    }

    setupInitialPosition() {
        // Parse FEN and set up pieces
        this.parseFENPosition(this.initialPosition);
    }

    parseFENPosition(fen) {
        const parts = fen.split(' ');
        const position = parts[0];
        
        // Clear current pieces
        this.pieces = {};
        this.clearBoard();
        
        // Parse piece positions
        const ranks = position.split('/');
        ranks.forEach((rank, rankIndex) => {
            let fileIndex = 0;
            for (let char of rank) {
                if (isNaN(char)) {
                    // It's a piece
                    const square = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
                    this.pieces[square] = char;
                    this.placePieceOnSquare(square, char);
                    fileIndex++;
                } else {
                    // It's a number of empty squares
                    fileIndex += parseInt(char);
                }
            }
        });
        
        // Update turn indicator
        this.whiteToMove = parts[1] === 'w';
        this.updateTurnIndicator();
    }

    clearBoard() {
        const squares = this.boardElement.querySelectorAll('.chess-square');
        squares.forEach(square => {
            square.innerHTML = '';
            square.classList.remove('selected', 'valid-move', 'check', 'last-move');
        });
    }

    placePieceOnSquare(square, piece) {
        const squareElement = this.boardElement.querySelector(`[data-square="${square}"]`);
        if (squareElement) {
            const pieceElement = document.createElement('div');
            pieceElement.className = `chess-piece ${this.isWhitePiece(piece) ? 'white' : 'black'}`;
            pieceElement.innerHTML = this.pieceSymbols[piece];
            pieceElement.dataset.piece = piece;
            squareElement.appendChild(pieceElement);
        }
    }

    isWhitePiece(piece) {
        return piece === piece.toUpperCase();
    }

    handleSquareClick(event) {
        if (this.aiThinking || this.gameState !== 'playing') return;
        
        const square = event.target.closest('.chess-square');
        if (!square) return;
        
        const squareNotation = square.dataset.square;
        
        if (this.selectedSquare) {
            // Try to make a move
            this.attemptMove(this.selectedSquare, squareNotation);
        } else {
            // Select a piece
            this.selectSquare(squareNotation);
        }
    }

    selectSquare(square) {
        const piece = this.pieces[square];
        
        // Only allow selecting pieces of the current player
        if (!piece || this.isWhitePiece(piece) !== this.whiteToMove) {
            return;
        }
        
        // Clear previous selection
        this.clearSelection();
        
        // Select the square
        this.selectedSquare = square;
        const squareElement = this.boardElement.querySelector(`[data-square="${square}"]`);
        squareElement.classList.add('selected');
        
        // Get and highlight valid moves
        this.getValidMovesForSquare(square);
        
        // Play selection sound
        if (window.audioManager) {
            audioManager.playClick();
        }
    }

    clearSelection() {
        if (this.selectedSquare) {
            const selectedElement = this.boardElement.querySelector(`[data-square="${this.selectedSquare}"]`);
            if (selectedElement) {
                selectedElement.classList.remove('selected');
            }
        }
        this.selectedSquare = null;
        
        // Clear valid move highlights
        const validMoveSquares = this.boardElement.querySelectorAll('.valid-move');
        validMoveSquares.forEach(square => square.classList.remove('valid-move'));
        this.validMoves = [];
    }

    async getValidMovesForSquare(square) {
        try {
            // Send request to backend for valid moves
            const response = await fetch('/api/chess/valid-moves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: this.currentPosition,
                    square: square
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get valid moves');
            }
            
            const data = await response.json();
            this.validMoves = data.moves || [];
            
            // Highlight valid moves
            this.highlightValidMoves();
            
        } catch (error) {
            console.error('Error getting valid moves:', error);
            // Fallback to basic move calculation
            this.calculateBasicMoves(square);
        }
    }

    highlightValidMoves() {
        this.validMoves.forEach(move => {
            const squareElement = this.boardElement.querySelector(`[data-square="${move}"]`);
            if (squareElement) {
                squareElement.classList.add('valid-move');
            }
        });
    }

    async attemptMove(fromSquare, toSquare) {
        // Check if it's a valid move
        if (!this.validMoves.includes(toSquare)) {
            this.clearSelection();
            if (window.audioManager) {
                audioManager.playError();
            }
            return;
        }
        
        try {
            // Send move to backend
            const response = await fetch('/api/chess/make-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: this.currentPosition,
                    from: fromSquare,
                    to: toSquare
                })
            });
            
            if (!response.ok) {
                throw new Error('Invalid move');
            }
            
            const data = await response.json();
            
            // Execute the move
            await this.executeMove(fromSquare, toSquare, data);
            
            // Check for game end
            if (data.isCheckmate) {
                this.handleCheckmate(data.winner);
            } else if (data.isCheck) {
                this.handleCheck();
            } else if (data.isDraw) {
                this.handleDraw(data.drawReason);
            }
            
            // AI move if enabled
            if (this.aiEnabled && !this.whiteToMove && this.gameState === 'playing') {
                setTimeout(() => this.makeAIMove(), 1000);
            }
            
        } catch (error) {
            console.error('Error making move:', error);
            this.clearSelection();
            if (window.audioManager) {
                audioManager.playError();
            }
        }
    }

    async executeMove(fromSquare, toSquare, moveData) {
        const fromElement = this.boardElement.querySelector(`[data-square="${fromSquare}"]`);
        const toElement = this.boardElement.querySelector(`[data-square="${toSquare}"]`);
        const piece = fromElement.querySelector('.chess-piece');
        
        // Handle captures
        const capturedPiece = toElement.querySelector('.chess-piece');
        if (capturedPiece) {
            this.addToCapturedPieces(capturedPiece.dataset.piece);
            if (window.audioManager) {
                audioManager.playCapture();
            }
        } else {
            if (window.audioManager) {
                audioManager.playMove();
            }
        }
        
        // Animate the move
        await this.animateChessMove(fromElement, toElement, piece);
        
        // Update position
        this.currentPosition = moveData.newPosition;
        this.parseFENPosition(this.currentPosition);
        
        // Update move history
        this.addMoveToHistory(moveData.moveNotation);
        
        // Clear selection
        this.clearSelection();
        
        // Highlight last move
        this.highlightLastMove(fromSquare, toSquare);
    }

    animateChessMove(fromElement, toElement, piece) {
        return new Promise((resolve) => {
            this.animateMove(fromElement, toElement, piece, resolve);
        });
    }

    addToCapturedPieces(piece) {
        const isWhite = this.isWhitePiece(piece);
        const capturedContainer = document.getElementById(isWhite ? 'captured-white' : 'captured-black');
        
        const capturedPiece = document.createElement('span');
        capturedPiece.className = 'captured-piece';
        capturedPiece.innerHTML = this.pieceSymbols[piece];
        capturedContainer.appendChild(capturedPiece);
    }

    addMoveToHistory(moveNotation) {
        this.gameHistory.push(moveNotation);
        const movesList = document.getElementById('moves-list');
        
        const moveNumber = Math.ceil(this.gameHistory.length / 2);
        const isWhiteMove = this.gameHistory.length % 2 === 1;
        
        if (isWhiteMove) {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            moveEntry.innerHTML = `<span class="move-number">${moveNumber}.</span> <span class="white-move">${moveNotation}</span> <span class="black-move"></span>`;
            movesList.appendChild(moveEntry);
        } else {
            const lastEntry = movesList.lastElementChild;
            if (lastEntry) {
                const blackMoveSpan = lastEntry.querySelector('.black-move');
                blackMoveSpan.textContent = moveNotation;
            }
        }
        
        // Scroll to bottom
        movesList.scrollTop = movesList.scrollHeight;
    }

    highlightLastMove(fromSquare, toSquare) {
        // Clear previous last move highlights
        this.boardElement.querySelectorAll('.last-move').forEach(square => 
            square.classList.remove('last-move'));
        
        // Highlight new last move
        const fromElement = this.boardElement.querySelector(`[data-square="${fromSquare}"]`);
        const toElement = this.boardElement.querySelector(`[data-square="${toSquare}"]`);
        if (fromElement) fromElement.classList.add('last-move');
        if (toElement) toElement.classList.add('last-move');
    }

    updateTurnIndicator() {
        const turnElement = this.container.querySelector('.player-turn');
        if (turnElement) {
            turnElement.textContent = `Current Turn: ${this.whiteToMove ? 'White' : 'Black'}`;
        }
    }

    async makeAIMove() {
        if (this.aiThinking || this.gameState !== 'playing') return;
        
        this.aiThinking = true;
        this.showGameStatus('AI is thinking...', 'turn');
        
        try {
            const response = await fetch('/api/chess/ai-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: this.currentPosition,
                    difficulty: this.aiDifficulty
                })
            });
            
            if (!response.ok) {
                throw new Error('AI move failed');
            }
            
            const data = await response.json();
            
            // Execute AI move
            await this.executeMove(data.from, data.to, data);
            
            // Check for game end
            if (data.isCheckmate) {
                this.handleCheckmate(data.winner);
            } else if (data.isCheck) {
                this.handleCheck();
            } else if (data.isDraw) {
                this.handleDraw(data.drawReason);
            }
            
        } catch (error) {
            console.error('Error making AI move:', error);
            this.showGameStatus('AI error occurred', 'error');
        } finally {
            this.aiThinking = false;
        }
    }

    handleCheckmate(winner) {
        this.gameState = 'finished';
        this.showGameStatus(`Checkmate! ${winner} wins!`, 'win');
        if (window.audioManager) {
            audioManager.playCheckmate();
        }
    }

    handleCheck() {
        this.showGameStatus('Check!', 'turn');
        
        // Highlight the king in check
        const kingSquare = this.findKingSquare(!this.whiteToMove);
        if (kingSquare) {
            const kingElement = this.boardElement.querySelector(`[data-square="${kingSquare}"]`);
            kingElement.classList.add('check');
        }
    }

    handleDraw(reason) {
        this.gameState = 'finished';
        this.showGameStatus(`Draw: ${reason}`, 'win');
        if (window.audioManager) {
            audioManager.playWin();
        }
    }

    findKingSquare(isWhite) {
        const kingPiece = isWhite ? 'K' : 'k';
        for (const [square, piece] of Object.entries(this.pieces)) {
            if (piece === kingPiece) {
                return square;
            }
        }
        return null;
    }

    async showHint() {
        if (this.gameState !== 'playing' || this.aiThinking) return;
        
        try {
            const response = await fetch('/api/chess/hint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: this.currentPosition
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get hint');
            }
            
            const data = await response.json();
            
            if (data.hint) {
                this.showGameStatus(`Hint: ${data.hint}`, 'info');
                
                // Briefly highlight the suggested move
                if (data.from && data.to) {
                    this.highlightHintMove(data.from, data.to);
                }
            }
            
        } catch (error) {
            console.error('Error getting hint:', error);
            this.showGameStatus('Hint not available', 'error');
        }
    }

    highlightHintMove(fromSquare, toSquare) {
        const fromElement = this.boardElement.querySelector(`[data-square="${fromSquare}"]`);
        const toElement = this.boardElement.querySelector(`[data-square="${toSquare}"]`);
        
        if (fromElement && toElement) {
            fromElement.classList.add('hint-move');
            toElement.classList.add('hint-move');
            
            setTimeout(() => {
                fromElement.classList.remove('hint-move');
                toElement.classList.remove('hint-move');
            }, 2000);
        }
    }

    undoLastMove() {
        if (this.gameHistory.length === 0 || this.aiThinking) return;
        
        // Implementation for undo would require storing position history
        this.showGameStatus('Undo not yet implemented', 'info');
    }

    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const button = document.getElementById('ai-toggle');
        button.innerHTML = `<i class="fas fa-robot"></i> AI: ${this.aiEnabled ? 'ON' : 'OFF'}`;
    }

    async initializeBackend() {
        try {
            // Test backend connection
            const response = await fetch('/api/chess/status');
            if (!response.ok) {
                throw new Error('Backend not available');
            }
            console.log('Chess backend connected');
        } catch (error) {
            console.warn('Chess backend not available, using limited functionality');
            // Fallback to frontend-only mode
        }
    }

    calculateBasicMoves(square) {
        // Basic move calculation fallback (simplified)
        // This would be expanded for a full implementation
        this.validMoves = [];
        this.showGameStatus('Backend required for full functionality', 'info');
    }

    restart() {
        this.currentPosition = this.initialPosition;
        this.gameHistory = [];
        this.whiteToMove = true;
        this.gameState = 'playing';
        this.aiThinking = false;
        
        // Clear captured pieces
        document.getElementById('captured-white').innerHTML = '';
        document.getElementById('captured-black').innerHTML = '';
        
        // Clear move history
        document.getElementById('moves-list').innerHTML = '';
        
        // Reset board
        this.setupInitialPosition();
        this.clearSelection();
        
        this.showGameStatus('New game started', 'turn');
        
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

// Add chess-specific CSS
const chessStyles = document.createElement('style');
chessStyles.textContent = `
    .chess-board-container {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }
    
    .chess-board {
        max-width: 600px;
        background: #8b4513;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: var(--shadow);
    }
    
    .chess-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        gap: 1px;
        aspect-ratio: 1;
    }
    
    .chess-square {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        position: relative;
        aspect-ratio: 1;
    }
    
    .light-square {
        background: #f0d9b5;
    }
    
    .dark-square {
        background: #b58863;
    }
    
    .chess-square:hover {
        opacity: 0.8;
    }
    
    .chess-square.selected {
        box-shadow: inset 0 0 0 3px #ffd700;
    }
    
    .chess-square.valid-move {
        box-shadow: inset 0 0 0 2px #00ff00;
    }
    
    .chess-square.valid-move::after {
        content: '';
        position: absolute;
        width: 30%;
        height: 30%;
        background: #00ff00;
        border-radius: 50%;
        opacity: 0.5;
    }
    
    .chess-square.last-move {
        background-color: #ffff99 !important;
    }
    
    .chess-square.check {
        background-color: #ff6b6b !important;
    }
    
    .chess-square.hint-move {
        animation: pulse 1s infinite;
        box-shadow: inset 0 0 0 3px #ff6b6b;
    }
    
    .chess-piece {
        font-size: 2rem;
        font-weight: bold;
        user-select: none;
        pointer-events: none;
        transition: transform 0.1s;
    }
    
    .chess-piece:hover {
        transform: scale(1.1);
    }
    
    .captured-pieces-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 1rem 0;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .captured-white, .captured-black {
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 8px;
    }
    
    .captured-white h4, .captured-black h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: var(--text-light);
    }
    
    .captured-pieces {
        min-height: 2rem;
    }
    
    .captured-piece {
        font-size: 1.2rem;
        margin-right: 0.25rem;
    }
    
    .chess-controls {
        max-width: 600px;
        margin: 1rem auto;
    }
    
    .chess-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    
    .chess-btn {
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
    
    .chess-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }
    
    .move-history {
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 8px;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .move-history h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-light);
    }
    
    .moves-list {
        color: var(--text-light);
    }
    
    .move-entry {
        margin-bottom: 0.25rem;
        font-family: monospace;
    }
    
    .move-number {
        font-weight: bold;
    }
    
    .white-move {
        margin-right: 1rem;
    }
    
    @media (max-width: 768px) {
        .chess-board {
            padding: 0.5rem;
        }
        
        .chess-piece {
            font-size: 1.5rem;
        }
        
        .captured-pieces-panel {
            grid-template-columns: 1fr;
        }
        
        .chess-buttons {
            justify-content: center;
        }
    }
`;
document.head.appendChild(chessStyles);

// Global reference for HTML onclick handlers
let chessGame;