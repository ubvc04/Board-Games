/**
 * Main JavaScript file for Mini Games: Strategy & Board
 * Handles navigation, game loading, and core functionality
 */

class GameManager {
    constructor() {
        this.currentGame = null;
        this.soundEnabled = true;
        this.games = {};
        this.init();
    }

    init() {
        // Initialize the application
        this.setupEventListeners();
        this.loadSavedSettings();
        this.preloadAudio();
        console.log('Game Manager initialized');
    }

    setupEventListeners() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.showDashboard();
            }
        });

        // Add resize handler for responsive design
        window.addEventListener('resize', () => {
            if (this.currentGame && this.currentGame.handleResize) {
                this.currentGame.handleResize();
            }
        });
    }

    loadSavedSettings() {
        // Load saved settings from localStorage
        const savedSound = localStorage.getItem('soundEnabled');
        if (savedSound !== null) {
            this.soundEnabled = JSON.parse(savedSound);
            this.updateSoundIcon();
        }
    }

    preloadAudio() {
        // Preload audio files for better performance
        const audioFiles = ['move-sound', 'capture-sound', 'dice-sound', 'win-sound'];
        audioFiles.forEach(id => {
            const audio = document.getElementById(id);
            if (audio) {
                audio.volume = 0.3; // Set default volume
            }
        });
    }

    showDashboard() {
        // Show the main dashboard and hide game container
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('loading').classList.add('hidden');
        
        // Clean up current game
        if (this.currentGame && this.currentGame.cleanup) {
            this.currentGame.cleanup();
        }
        this.currentGame = null;
        
        // Update URL
        window.history.pushState({}, '', '/');
        
        // Animate dashboard cards
        this.animateDashboard();
    }

    animateDashboard() {
        // Add staggered animation to game cards
        const cards = document.querySelectorAll('.game-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }

    async loadGame(gameName) {
        // Show loading screen
        this.showLoading();
        
        try {
            // Hide dashboard
            document.getElementById('dashboard').classList.add('hidden');
            
            // Load game script if not already loaded
            if (!this.games[gameName]) {
                await this.loadGameScript(gameName);
            }
            
            // Initialize and show game
            await this.initializeGame(gameName);
            
            // Update URL
            window.history.pushState({game: gameName}, '', `/${gameName}`);
            
        } catch (error) {
            console.error(`Error loading game ${gameName}:`, error);
            this.showError(`Failed to load ${gameName}. Please try again.`);
            this.showDashboard();
        } finally {
            this.hideLoading();
        }
    }

    async loadGameScript(gameName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `static/js/games/${gameName}.js`;
            script.onload = () => {
                console.log(`${gameName} script loaded successfully`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load ${gameName} script`));
            };
            document.head.appendChild(script);
        });
    }

    async initializeGame(gameName) {
        // Clear game area
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = '';
        
        // Update game title
        document.getElementById('game-title').textContent = this.getGameTitle(gameName);
        
        // Initialize specific game
        switch (gameName) {
            case 'chess':
                this.currentGame = new ChessGame(gameArea);
                break;
            case 'checkers':
                this.currentGame = new CheckersGame(gameArea);
                break;
            case 'connect4':
                this.currentGame = new Connect4Game(gameArea);
                break;
            case 'ludo':
                this.currentGame = new LudoGame(gameArea);
                break;
            case 'monopoly':
                this.currentGame = new MonopolyGame(gameArea);
                break;
            case 'battleship':
                this.currentGame = new BattleshipGame(gameArea);
                break;
            case 'reversi':
                this.currentGame = new ReversiGame(gameArea);
                break;
            case 'go':
                this.currentGame = new GoGame(gameArea);
                break;
            case 'carrom':
                this.currentGame = new CarromGame(gameArea);
                break;
            case 'mancala':
                this.currentGame = new MancalaGame(gameArea);
                break;
            default:
                throw new Error(`Unknown game: ${gameName}`);
        }
        
        // Initialize the game
        if (this.currentGame.init) {
            await this.currentGame.init();
        }
        
        // Show game container
        document.getElementById('game-container').classList.remove('hidden');
        
        // Store game reference
        this.games[gameName] = this.currentGame;
    }

    getGameTitle(gameName) {
        const titles = {
            chess: 'Chess',
            checkers: 'Checkers (Draughts)',
            connect4: 'Connect Four',
            ludo: 'Ludo',
            monopoly: 'Monopoly Mini',
            battleship: 'Battleship',
            reversi: 'Reversi (Othello)',
            go: 'Go',
            carrom: 'Carrom',
            mancala: 'Mancala'
        };
        return titles[gameName] || gameName;
    }

    restartGame() {
        if (this.currentGame && this.currentGame.restart) {
            this.currentGame.restart();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundIcon();
        localStorage.setItem('soundEnabled', JSON.stringify(this.soundEnabled));
        
        // Play a test sound if enabling
        if (this.soundEnabled) {
            this.playSound('move-sound');
        }
    }

    updateSoundIcon() {
        const icon = document.getElementById('sound-icon');
        if (icon) {
            icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }

    playSound(soundId) {
        if (!this.soundEnabled) return;
        
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log('Audio play failed:', e);
            });
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        // Create and show error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 3000);
    }

    // Utility methods for games
    createBoard(rows, cols, className = 'board-grid') {
        const board = document.createElement('div');
        board.className = className;
        board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.dataset.row = Math.floor(i / cols);
            cell.dataset.col = i % cols;
            board.appendChild(cell);
        }
        
        return board;
    }

    createGameInfo(playerTurn = 'Player 1', scores = {}) {
        const info = document.createElement('div');
        info.className = 'game-info';
        
        const turnDisplay = document.createElement('div');
        turnDisplay.className = 'player-turn';
        turnDisplay.textContent = `Current Turn: ${playerTurn}`;
        
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score';
        scoreDisplay.innerHTML = Object.entries(scores)
            .map(([player, score]) => `${player}: ${score}`)
            .join(' | ') || 'Score: 0-0';
        
        info.appendChild(turnDisplay);
        info.appendChild(scoreDisplay);
        
        return info;
    }

    createGameStatus(message = 'Game in progress', type = 'turn') {
        const status = document.createElement('div');
        status.className = `game-status ${type}`;
        status.textContent = message;
        return status;
    }

    animateElement(element, animationClass, duration = 300) {
        element.classList.add('animated', animationClass);
        setTimeout(() => {
            element.classList.remove('animated', animationClass);
        }, duration);
    }

    // AI utility methods
    minimax(board, depth, isMaximizing, game) {
        // Basic minimax algorithm for AI games
        if (depth === 0 || game.isGameOver()) {
            return game.evaluateBoard();
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            const moves = game.getPossibleMoves();
            
            for (const move of moves) {
                game.makeMove(move);
                const evaluation = this.minimax(board, depth - 1, false, game);
                game.undoMove(move);
                maxEval = Math.max(maxEval, evaluation);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const moves = game.getPossibleMoves();
            
            for (const move of moves) {
                game.makeMove(move);
                const evaluation = this.minimax(board, depth - 1, true, game);
                game.undoMove(move);
                minEval = Math.min(minEval, evaluation);
            }
            return minEval;
        }
    }
}

// Global functions for HTML onclick handlers
function loadGame(gameName) {
    gameManager.loadGame(gameName);
}

function showDashboard() {
    gameManager.showDashboard();
}

function restartGame() {
    gameManager.restartGame();
}

function toggleSound() {
    gameManager.toggleSound();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .error-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);

// Initialize game manager when DOM is loaded
let gameManager;
document.addEventListener('DOMContentLoaded', () => {
    gameManager = new GameManager();
    
    // Handle browser navigation
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.game) {
            gameManager.loadGame(e.state.game);
        } else {
            gameManager.showDashboard();
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}