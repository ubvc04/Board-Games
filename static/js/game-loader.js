/**
 * Game Loader utility for Mini Games: Strategy & Board
 * Handles dynamic loading and initialization of individual games
 */

class GameLoader {
    constructor() {
        this.loadedGames = new Set();
        this.gameInstances = new Map();
        this.loadPromises = new Map();
    }

    async loadGame(gameName) {
        // Check if game is already loaded
        if (this.loadedGames.has(gameName)) {
            return this.gameInstances.get(gameName);
        }

        // Check if game is currently being loaded
        if (this.loadPromises.has(gameName)) {
            return this.loadPromises.get(gameName);
        }

        // Start loading the game
        const loadPromise = this._loadGameScript(gameName);
        this.loadPromises.set(gameName, loadPromise);

        try {
            await loadPromise;
            this.loadedGames.add(gameName);
            this.loadPromises.delete(gameName);
            return true;
        } catch (error) {
            this.loadPromises.delete(gameName);
            throw error;
        }
    }

    async _loadGameScript(gameName) {
        return new Promise((resolve, reject) => {
            // Create script element
            const script = document.createElement('script');
            script.src = `static/js/games/${gameName}.js`;
            script.async = true;

            // Handle successful load
            script.onload = () => {
                console.log(`Successfully loaded ${gameName} game script`);
                resolve();
            };

            // Handle load error
            script.onerror = () => {
                console.error(`Failed to load ${gameName} game script`);
                reject(new Error(`Failed to load game: ${gameName}`));
            };

            // Add to document
            document.head.appendChild(script);
        });
    }

    createGameInstance(gameName, container) {
        const gameClasses = {
            chess: () => new ChessGame(container),
            checkers: () => new CheckersGame(container),
            connect4: () => new Connect4Game(container),
            ludo: () => new LudoGame(container),
            monopoly: () => new MonopolyGame(container),
            battleship: () => new BattleshipGame(container),
            reversi: () => new ReversiGame(container),
            go: () => new GoGame(container),
            carrom: () => new CarromGame(container),
            mancala: () => new MancalaGame(container)
        };

        const GameClass = gameClasses[gameName];
        if (!GameClass) {
            throw new Error(`Unknown game class: ${gameName}`);
        }

        try {
            const instance = GameClass();
            this.gameInstances.set(gameName, instance);
            return instance;
        } catch (error) {
            console.error(`Error creating ${gameName} instance:`, error);
            throw new Error(`Failed to create game instance: ${gameName}`);
        }
    }

    getGameInstance(gameName) {
        return this.gameInstances.get(gameName);
    }

    destroyGameInstance(gameName) {
        const instance = this.gameInstances.get(gameName);
        if (instance && instance.cleanup) {
            instance.cleanup();
        }
        this.gameInstances.delete(gameName);
    }

    isGameLoaded(gameName) {
        return this.loadedGames.has(gameName);
    }

    preloadAllGames() {
        const games = ['chess', 'checkers', 'connect4', 'ludo', 'monopoly', 
                      'battleship', 'reversi', 'go', 'carrom', 'mancala'];
        
        return Promise.allSettled(
            games.map(game => this.loadGame(game))
        );
    }

    cleanup() {
        // Cleanup all game instances
        for (const [gameName, instance] of this.gameInstances) {
            if (instance.cleanup) {
                instance.cleanup();
            }
        }
        this.gameInstances.clear();
        this.loadedGames.clear();
        this.loadPromises.clear();
    }
}

/**
 * Base Game Class
 * All games should extend this class for consistent interface
 */
class BaseGame {
    constructor(container) {
        this.container = container;
        this.gameState = 'waiting'; // waiting, playing, paused, finished
        this.currentPlayer = 1;
        this.players = [];
        this.board = null;
        this.moveHistory = [];
        this.gameId = this.generateGameId();
    }

    generateGameId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Abstract methods that should be implemented by each game
    async init() {
        throw new Error('init() method must be implemented by game');
    }

    restart() {
        throw new Error('restart() method must be implemented by game');
    }

    makeMove(move) {
        throw new Error('makeMove() method must be implemented by game');
    }

    isValidMove(move) {
        throw new Error('isValidMove() method must be implemented by game');
    }

    isGameOver() {
        throw new Error('isGameOver() method must be implemented by game');
    }

    getWinner() {
        throw new Error('getWinner() method must be implemented by game');
    }

    // Common utility methods
    createGameBoard(rows, cols, cellClass = 'cell') {
        const board = document.createElement('div');
        board.className = 'game-board';
        
        const grid = document.createElement('div');
        grid.className = 'board-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = cellClass;
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.index = row * cols + col;
                grid.appendChild(cell);
            }
        }
        
        board.appendChild(grid);
        return { board, grid };
    }

    createGameInfo(title) {
        const info = document.createElement('div');
        info.className = 'game-info';
        info.innerHTML = `
            <div class="player-turn">Current Turn: Player ${this.currentPlayer}</div>
            <div class="score">Game: ${title}</div>
        `;
        return info;
    }

    createGameControls() {
        const controls = document.createElement('div');
        controls.className = 'game-controls-panel';
        controls.innerHTML = `
            <button class="game-btn" onclick="this.getRootNode().host?.restart?.()">
                <i class="fas fa-redo"></i> Restart
            </button>
            <button class="game-btn" onclick="this.getRootNode().host?.showHint?.()">
                <i class="fas fa-lightbulb"></i> Hint
            </button>
            <button class="game-btn" onclick="this.getRootNode().host?.undoMove?.()">
                <i class="fas fa-undo"></i> Undo
            </button>
        `;
        return controls;
    }

    updatePlayerTurn() {
        const turnElement = this.container.querySelector('.player-turn');
        if (turnElement) {
            turnElement.textContent = `Current Turn: Player ${this.currentPlayer}`;
        }
    }

    showGameStatus(message, type = 'info') {
        let statusElement = this.container.querySelector('.game-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'game-status';
            this.container.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.className = `game-status ${type}`;
        
        // Auto-hide info messages
        if (type === 'info') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'game-status';
            }, 3000);
        }
    }

    animateMove(fromElement, toElement, piece, callback) {
        if (!fromElement || !toElement) {
            if (callback) callback();
            return;
        }

        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        // Create animated piece
        const animatedPiece = piece.cloneNode(true);
        animatedPiece.style.position = 'fixed';
        animatedPiece.style.left = fromRect.left + 'px';
        animatedPiece.style.top = fromRect.top + 'px';
        animatedPiece.style.width = fromRect.width + 'px';
        animatedPiece.style.height = fromRect.height + 'px';
        animatedPiece.style.zIndex = '1000';
        animatedPiece.style.pointerEvents = 'none';
        animatedPiece.style.transition = 'all 0.3s ease-out';
        
        document.body.appendChild(animatedPiece);
        
        // Hide original piece
        piece.style.opacity = '0';
        
        // Animate to destination
        requestAnimationFrame(() => {
            animatedPiece.style.left = toRect.left + 'px';
            animatedPiece.style.top = toRect.top + 'px';
        });
        
        // Cleanup after animation
        setTimeout(() => {
            document.body.removeChild(animatedPiece);
            piece.style.opacity = '1';
            if (callback) callback();
        }, 300);
    }

    saveGameState() {
        const state = {
            gameId: this.gameId,
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            moveHistory: this.moveHistory,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`game_${this.constructor.name}_${this.gameId}`, JSON.stringify(state));
    }

    loadGameState(gameId) {
        const saved = localStorage.getItem(`game_${this.constructor.name}_${gameId}`);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    // Common event handlers
    handleCellClick(event) {
        const cell = event.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        this.onCellClick(row, col, cell);
    }

    // Override in subclasses
    onCellClick(row, col, cell) {
        console.log(`Cell clicked: ${row}, ${col}`);
    }

    handleResize() {
        // Override in subclasses if needed
    }

    cleanup() {
        // Override in subclasses for cleanup
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Global game loader instance
let gameLoader;

// Initialize game loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    gameLoader = new GameLoader();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoader, BaseGame };
}