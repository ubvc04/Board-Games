class CarromGame extends BaseGame {
    constructor() {
        super();
        this.gameState = 'playing'; // 'playing', 'aiming', 'shooting', 'finished'
        this.currentPlayer = 'player1'; // 'player1', 'player2'
        this.playerColors = { player1: 'white', player2: 'black' };
        this.striker = null;
        this.carromMen = [];
        this.pockets = [];
        this.scores = { player1: 0, player2: 0 };
        this.consecutiveFouls = { player1: 0, player2: 0 };
        this.gameMode = 'ai'; // 'ai' or 'human'
        this.winner = null;
        
        // Physics properties
        this.boardSize = 480;
        this.strikerRadius = 18;
        this.carromManRadius = 14;
        this.pocketRadius = 22;
        this.friction = 0.98;
        this.minVelocity = 0.1;
        
        // Animation
        this.animationId = null;
        this.isAnimating = false;
        
        // Input handling
        this.isAiming = false;
        this.aimStartX = 0;
        this.aimStartY = 0;
        this.aimCurrentX = 0;
        this.aimCurrentY = 0;
        this.maxPower = 25;
        
        this.setupBoard();
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.setupEventListeners();
        this.resetGame();
        this.updateGameInfo();
    }

    setupBoard() {
        // Define pocket positions (corners and center of each side)
        const pocketSize = this.pocketRadius;
        this.pockets = [
            { x: pocketSize, y: pocketSize }, // Top-left
            { x: this.boardSize - pocketSize, y: pocketSize }, // Top-right
            { x: pocketSize, y: this.boardSize - pocketSize }, // Bottom-left
            { x: this.boardSize - pocketSize, y: this.boardSize - pocketSize } // Bottom-right
        ];
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="carrom-container">
                <div class="game-area">
                    <div class="carrom-board-wrapper">
                        <div class="carrom-board" id="carrom-board">
                            <svg class="carrom-svg" width="${this.boardSize}" height="${this.boardSize}">
                                <!-- Board background -->
                                <rect width="${this.boardSize}" height="${this.boardSize}" 
                                      fill="#DEB887" stroke="#8B4513" stroke-width="4" rx="8"/>
                                
                                <!-- Center circle -->
                                <circle cx="${this.boardSize/2}" cy="${this.boardSize/2}" r="40" 
                                        fill="none" stroke="#654321" stroke-width="2"/>
                                        
                                <!-- Pockets -->
                                ${this.pockets.map((pocket, i) => `
                                    <circle cx="${pocket.x}" cy="${pocket.y}" r="${this.pocketRadius}" 
                                            fill="#2C1810" stroke="#1A0F08" stroke-width="2" 
                                            class="pocket" data-pocket="${i}"/>
                                `).join('')}
                                
                                <!-- Aiming line -->
                                <line id="aim-line" x1="0" y1="0" x2="0" y2="0" 
                                      stroke="#FF4444" stroke-width="3" 
                                      stroke-dasharray="5,5" style="display: none;"/>
                                      
                                <!-- Power indicator -->
                                <rect id="power-indicator" x="10" y="10" width="0" height="8" 
                                      fill="#FF4444" style="display: none;"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="game-panel">
                    <div class="game-header">
                        <h2>Carrom</h2>
                        <div class="game-status" id="game-status">
                            Player 1's Turn
                        </div>
                    </div>
                    
                    <div class="score-board">
                        <div class="player-score player1">
                            <div class="player-info">
                                <div class="player-avatar">
                                    <div class="carrom-piece white"></div>
                                </div>
                                <div class="score-details">
                                    <div class="player-name">Player 1</div>
                                    <div class="score-value" id="player1-score">0</div>
                                </div>
                            </div>
                            <div class="pieces-collected" id="player1-pieces">
                                <!-- Collected pieces will be shown here -->
                            </div>
                        </div>
                        
                        <div class="player-score player2">
                            <div class="player-info">
                                <div class="player-avatar">
                                    <div class="carrom-piece black"></div>
                                </div>
                                <div class="score-details">
                                    <div class="player-name">Player 2</div>
                                    <div class="score-value" id="player2-score">0</div>
                                </div>
                            </div>
                            <div class="pieces-collected" id="player2-pieces">
                                <!-- Collected pieces will be shown here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-controls">
                        <div class="instructions">
                            <h4>How to Play:</h4>
                            <p id="current-instruction">Click and drag from striker to aim and shoot</p>
                        </div>
                        
                        <div class="power-control">
                            <label for="power-slider">Shot Power:</label>
                            <input type="range" id="power-slider" min="1" max="100" value="50" class="power-slider">
                            <span id="power-value">50%</span>
                        </div>
                        
                        <div class="control-buttons">
                            <button id="reset-position-btn" class="control-btn secondary">
                                <i class="fas fa-undo"></i> Reset Position
                            </button>
                            <button id="new-game-btn" class="control-btn">
                                <i class="fas fa-refresh"></i> New Game
                            </button>
                        </div>
                    </div>
                    
                    <div class="game-stats">
                        <div class="stat-item">
                            <span class="stat-label">Pieces Left:</span>
                            <span id="pieces-remaining">18</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Queen Status:</span>
                            <span id="queen-status">On Board</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Last Shot:</span>
                            <span id="last-shot">Game started</span>
                        </div>
                    </div>
                    
                    <div class="game-rules">
                        <h4>Rules:</h4>
                        <ul>
                            <li>Pocket your color pieces first</li>
                            <li>Queen must be covered by another piece</li>
                            <li>Striker must stay on board</li>
                            <li>First to pocket all pieces wins</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        this.svg = document.querySelector('.carrom-svg');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const board = document.querySelector('.carrom-board');
        
        // Mouse events
        board.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        board.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        board.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events for mobile
        board.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        board.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        board.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Power slider
        const powerSlider = document.getElementById('power-slider');
        powerSlider?.addEventListener('input', (e) => {
            document.getElementById('power-value').textContent = e.target.value + '%';
        });
    }

    setupControls() {
        const resetBtn = document.getElementById('reset-position-btn');
        const newGameBtn = document.getElementById('new-game-btn');
        
        resetBtn?.addEventListener('click', () => this.resetStrikerPosition());
        newGameBtn?.addEventListener('click', () => this.resetGame());
    }

    resetGame() {
        this.currentPlayer = 'player1';
        this.gameState = 'playing';
        this.scores = { player1: 0, player2: 0 };
        this.consecutiveFouls = { player1: 0, player2: 0 };
        this.winner = null;
        this.isAnimating = false;
        
        this.setupCarromMen();
        this.resetStrikerPosition();
        this.updateGameInfo();
        this.updateScoreDisplay();
        this.updateStatsDisplay();
    }

    setupCarromMen() {
        this.carromMen = [];
        
        // Queen (red) in the center
        this.carromMen.push({
            x: this.boardSize / 2,
            y: this.boardSize / 2,
            vx: 0,
            vy: 0,
            color: 'queen',
            radius: this.carromManRadius,
            pocketed: false,
            covered: false
        });
        
        // Arrange other pieces around the queen
        const center = this.boardSize / 2;
        const spacing = this.carromManRadius * 2.2;
        
        // Inner circle (6 pieces)
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = center + Math.cos(angle) * spacing;
            const y = center + Math.sin(angle) * spacing;
            
            this.carromMen.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                color: i % 2 === 0 ? 'white' : 'black',
                radius: this.carromManRadius,
                pocketed: false
            });
        }
        
        // Outer circle (12 pieces)
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const x = center + Math.cos(angle) * spacing * 1.8;
            const y = center + Math.sin(angle) * spacing * 1.8;
            
            this.carromMen.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                color: i % 2 === 0 ? 'black' : 'white',
                radius: this.carromManRadius,
                pocketed: false
            });
        }
        
        this.renderPieces();
    }

    resetStrikerPosition() {
        // Position striker at bottom center for current player
        const isPlayer1 = this.currentPlayer === 'player1';
        this.striker = {
            x: this.boardSize / 2,
            y: isPlayer1 ? this.boardSize - 40 : 40,
            vx: 0,
            vy: 0,
            radius: this.strikerRadius,
            moving: false
        };
        
        this.renderPieces();
    }

    handleMouseDown(e) {
        if (this.gameState !== 'playing' || this.isAnimating) return;
        if (this.gameMode === 'ai' && this.currentPlayer === 'player2') return;
        
        const rect = this.svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking near striker
        if (this.striker && this.getDistance(x, y, this.striker.x, this.striker.y) < this.striker.radius + 10) {
            this.isAiming = true;
            this.aimStartX = this.striker.x;
            this.aimStartY = this.striker.y;
            this.aimCurrentX = x;
            this.aimCurrentY = y;
            this.showAimLine();
        }
    }

    handleMouseMove(e) {
        if (!this.isAiming) return;
        
        const rect = this.svg.getBoundingClientRect();
        this.aimCurrentX = e.clientX - rect.left;
        this.aimCurrentY = e.clientY - rect.top;
        this.updateAimLine();
    }

    handleMouseUp(e) {
        if (this.isAiming) {
            this.shoot();
            this.hideAimLine();
            this.isAiming = false;
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown(touch);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove(touch);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }

    showAimLine() {
        const aimLine = document.getElementById('aim-line');
        aimLine.style.display = 'block';
    }

    hideAimLine() {
        const aimLine = document.getElementById('aim-line');
        const powerIndicator = document.getElementById('power-indicator');
        aimLine.style.display = 'none';
        powerIndicator.style.display = 'none';
    }

    updateAimLine() {
        const aimLine = document.getElementById('aim-line');
        const powerIndicator = document.getElementById('power-indicator');
        
        const dx = this.aimCurrentX - this.aimStartX;
        const dy = this.aimCurrentY - this.aimStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance / 2, this.maxPower);
        
        // Update aim line
        aimLine.setAttribute('x1', this.aimStartX);
        aimLine.setAttribute('y1', this.aimStartY);
        aimLine.setAttribute('x2', this.aimCurrentX);
        aimLine.setAttribute('y2', this.aimCurrentY);
        
        // Update power indicator
        powerIndicator.style.display = 'block';
        powerIndicator.setAttribute('width', (power / this.maxPower) * 100);
    }

    shoot() {
        const dx = this.aimCurrentX - this.aimStartX;
        const dy = this.aimCurrentY - this.aimStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) return; // Minimum shot distance
        
        const powerSlider = document.getElementById('power-slider');
        const powerMultiplier = powerSlider.value / 100;
        const power = Math.min(distance / 3, this.maxPower) * powerMultiplier;
        
        this.striker.vx = (dx / distance) * power;
        this.striker.vy = (dy / distance) * power;
        this.striker.moving = true;
        
        this.gameState = 'shooting';
        this.isAnimating = true;
        this.startPhysicsAnimation();
        
        this.playSound('move');
    }

    startPhysicsAnimation() {
        this.animationId = requestAnimationFrame(() => this.updatePhysics());
    }

    updatePhysics() {
        let anyMoving = false;
        
        // Update striker
        if (this.striker && this.striker.moving) {
            this.updatePiecePhysics(this.striker);
            if (this.striker.vx !== 0 || this.striker.vy !== 0) {
                anyMoving = true;
            }
        }
        
        // Update carrom men
        this.carromMen.forEach(piece => {
            if (!piece.pocketed) {
                this.updatePiecePhysics(piece);
                if (piece.vx !== 0 || piece.vy !== 0) {
                    anyMoving = true;
                }
            }
        });
        
        // Check collisions
        this.checkCollisions();
        this.checkPockets();
        
        // Render pieces
        this.renderPieces();
        
        if (anyMoving) {
            this.animationId = requestAnimationFrame(() => this.updatePhysics());
        } else {
            this.endShot();
        }
    }

    updatePiecePhysics(piece) {
        // Apply friction
        piece.vx *= this.friction;
        piece.vy *= this.friction;
        
        // Stop if velocity is too low
        if (Math.abs(piece.vx) < this.minVelocity) piece.vx = 0;
        if (Math.abs(piece.vy) < this.minVelocity) piece.vy = 0;
        
        // Update position
        piece.x += piece.vx;
        piece.y += piece.vy;
        
        // Bounce off walls
        if (piece.x - piece.radius < 0) {
            piece.x = piece.radius;
            piece.vx = -piece.vx * 0.8;
        } else if (piece.x + piece.radius > this.boardSize) {
            piece.x = this.boardSize - piece.radius;
            piece.vx = -piece.vx * 0.8;
        }
        
        if (piece.y - piece.radius < 0) {
            piece.y = piece.radius;
            piece.vy = -piece.vy * 0.8;
        } else if (piece.y + piece.radius > this.boardSize) {
            piece.y = this.boardSize - piece.radius;
            piece.vy = -piece.vy * 0.8;
        }
    }

    checkCollisions() {
        const allPieces = [this.striker, ...this.carromMen.filter(p => !p.pocketed)];
        
        for (let i = 0; i < allPieces.length; i++) {
            for (let j = i + 1; j < allPieces.length; j++) {
                const piece1 = allPieces[i];
                const piece2 = allPieces[j];
                
                if (piece1 && piece2) {
                    this.handleCollision(piece1, piece2);
                }
            }
        }
    }

    handleCollision(piece1, piece2) {
        const dx = piece2.x - piece1.x;
        const dy = piece2.y - piece1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = piece1.radius + piece2.radius;
        
        if (distance < minDistance) {
            // Collision occurred
            const angle = Math.atan2(dy, dx);
            
            // Separate pieces
            const overlap = minDistance - distance;
            const separateX = Math.cos(angle) * overlap / 2;
            const separateY = Math.sin(angle) * overlap / 2;
            
            piece1.x -= separateX;
            piece1.y -= separateY;
            piece2.x += separateX;
            piece2.y += separateY;
            
            // Exchange velocities (simplified elastic collision)
            const vx1 = piece1.vx;
            const vy1 = piece1.vy;
            
            piece1.vx = piece2.vx * 0.9;
            piece1.vy = piece2.vy * 0.9;
            piece2.vx = vx1 * 0.9;
            piece2.vy = vy1 * 0.9;
            
            this.playSound('capture');
        }
    }

    checkPockets() {
        this.pockets.forEach((pocket, pocketIndex) => {
            // Check striker
            if (this.striker && this.getDistance(this.striker.x, this.striker.y, pocket.x, pocket.y) < this.pocketRadius) {
                this.handleStrikerPocketed();
            }
            
            // Check carrom men
            this.carromMen.forEach((piece, pieceIndex) => {
                if (!piece.pocketed && this.getDistance(piece.x, piece.y, pocket.x, pocket.y) < this.pocketRadius) {
                    this.handlePiecePocketed(piece, pieceIndex);
                }
            });
        });
    }

    handleStrikerPocketed() {
        // Foul - striker went into pocket
        this.striker = null;
        this.consecutiveFouls[this.currentPlayer]++;
        this.updateLastShot('Foul: Striker pocketed');
        
        // Return a piece if any were collected
        this.handleFoul();
    }

    handlePiecePocketed(piece, pieceIndex) {
        piece.pocketed = true;
        
        if (piece.color === 'queen') {
            this.handleQueenPocketed();
        } else {
            this.handleRegularPiecePocketed(piece);
        }
        
        this.updateScoreDisplay();
        this.updateStatsDisplay();
    }

    handleQueenPocketed() {
        // Queen pocketed - needs to be covered
        this.updateLastShot('Queen pocketed! Must cover with another piece.');
    }

    handleRegularPiecePocketed(piece) {
        const playerColor = this.playerColors[this.currentPlayer];
        
        if (piece.color === playerColor) {
            // Correct piece
            this.scores[this.currentPlayer]++;
            this.updateLastShot(`${piece.color} piece pocketed`);
            
            // Check for win condition
            if (this.checkWinCondition()) {
                this.endGame();
                return;
            }
            
            // Continue turn
            return;
        } else {
            // Wrong piece - foul
            this.scores[this.getOpponent()]++;
            this.updateLastShot(`Foul: Wrong color pocketed`);
            this.handleFoul();
        }
    }

    handleFoul() {
        this.consecutiveFouls[this.currentPlayer]++;
        
        // Switch turns after foul
        this.switchPlayer();
    }

    endShot() {
        this.gameState = 'playing';
        this.isAnimating = false;
        
        if (this.striker) {
            this.striker.moving = false;
        }
        
        // Switch player unless they pocketed their own piece
        const shouldContinue = this.shouldPlayerContinue();
        if (!shouldContinue) {
            this.switchPlayer();
        }
        
        // Handle AI turn
        if (this.gameMode === 'ai' && this.currentPlayer === 'player2') {
            setTimeout(() => this.makeAIMove(), 1500);
        }
        
        this.resetStrikerPosition();
    }

    shouldPlayerContinue() {
        // Player continues if they pocketed their own piece in the last shot
        // This is simplified - in real Carrom there are more complex rules
        return false; // For simplicity, always switch turns
    }

    makeAIMove() {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'player2') return;
        
        // Simple AI - aim at nearest opponent piece
        const targetPiece = this.findBestTarget();
        if (targetPiece) {
            const dx = targetPiece.x - this.striker.x;
            const dy = targetPiece.y - this.striker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Add some randomness
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
            const power = Math.min(15 + Math.random() * 10, this.maxPower);
            
            this.striker.vx = Math.cos(angle) * power;
            this.striker.vy = Math.sin(angle) * power;
            this.striker.moving = true;
            
            this.gameState = 'shooting';
            this.isAnimating = true;
            this.startPhysicsAnimation();
            
            this.playSound('move');
        }
    }

    findBestTarget() {
        const aiColor = this.playerColors.player2;
        const targetPieces = this.carromMen.filter(p => !p.pocketed && p.color === aiColor);
        
        if (targetPieces.length === 0) return null;
        
        // Find closest piece
        let closest = targetPieces[0];
        let minDistance = this.getDistance(this.striker.x, this.striker.y, closest.x, closest.y);
        
        targetPieces.forEach(piece => {
            const distance = this.getDistance(this.striker.x, this.striker.y, piece.x, piece.y);
            if (distance < minDistance) {
                minDistance = distance;
                closest = piece;
            }
        });
        
        return closest;
    }

    checkWinCondition() {
        const player1Color = this.playerColors.player1;
        const player2Color = this.playerColors.player2;
        
        const player1Pieces = this.carromMen.filter(p => !p.pocketed && p.color === player1Color);
        const player2Pieces = this.carromMen.filter(p => !p.pocketed && p.color === player2Color);
        
        return player1Pieces.length === 0 || player2Pieces.length === 0;
    }

    endGame() {
        this.gameState = 'finished';
        
        const player1Color = this.playerColors.player1;
        const player1Pieces = this.carromMen.filter(p => !p.pocketed && p.color === player1Color);
        
        if (player1Pieces.length === 0) {
            this.winner = 'player1';
        } else {
            this.winner = 'player2';
        }
        
        this.updateGameInfo();
        this.playSound('win');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'player1' ? 'player2' : 'player1';
        this.updateGameInfo();
    }

    getOpponent() {
        return this.currentPlayer === 'player1' ? 'player2' : 'player1';
    }

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    renderPieces() {
        // Clear existing pieces
        const existingPieces = this.svg.querySelectorAll('.game-piece');
        existingPieces.forEach(piece => piece.remove());
        
        // Render carrom men
        this.carromMen.forEach((piece, index) => {
            if (!piece.pocketed) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', piece.x);
                circle.setAttribute('cy', piece.y);
                circle.setAttribute('r', piece.radius);
                circle.setAttribute('class', `game-piece carrom-man ${piece.color}`);
                
                if (piece.color === 'white') {
                    circle.setAttribute('fill', '#F5F5F5');
                    circle.setAttribute('stroke', '#CCCCCC');
                } else if (piece.color === 'black') {
                    circle.setAttribute('fill', '#333333');
                    circle.setAttribute('stroke', '#111111');
                } else if (piece.color === 'queen') {
                    circle.setAttribute('fill', '#DC143C');
                    circle.setAttribute('stroke', '#8B0000');
                }
                
                circle.setAttribute('stroke-width', '2');
                this.svg.appendChild(circle);
            }
        });
        
        // Render striker
        if (this.striker) {
            const strikerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            strikerCircle.setAttribute('cx', this.striker.x);
            strikerCircle.setAttribute('cy', this.striker.y);
            strikerCircle.setAttribute('r', this.striker.radius);
            strikerCircle.setAttribute('class', 'game-piece striker');
            strikerCircle.setAttribute('fill', '#FFD700');
            strikerCircle.setAttribute('stroke', '#FFA500');
            strikerCircle.setAttribute('stroke-width', '3');
            this.svg.appendChild(strikerCircle);
        }
    }

    updateGameInfo() {
        const status = document.getElementById('game-status');
        
        if (this.gameState === 'finished') {
            const winnerName = this.winner === 'player1' ? 'Player 1' : 'Player 2';
            status.textContent = `${winnerName} Wins!`;
        } else {
            const playerName = this.currentPlayer === 'player1' ? 'Player 1' : 'Player 2';
            status.textContent = `${playerName}'s Turn`;
        }
    }

    updateScoreDisplay() {
        document.getElementById('player1-score').textContent = this.scores.player1;
        document.getElementById('player2-score').textContent = this.scores.player2;
    }

    updateStatsDisplay() {
        const remainingPieces = this.carromMen.filter(p => !p.pocketed).length;
        document.getElementById('pieces-remaining').textContent = remainingPieces;
        
        const queen = this.carromMen.find(p => p.color === 'queen');
        const queenStatus = queen.pocketed ? (queen.covered ? 'Covered' : 'Pocketed') : 'On Board';
        document.getElementById('queen-status').textContent = queenStatus;
    }

    updateLastShot(message) {
        document.getElementById('last-shot').textContent = message;
    }

    reset() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.resetGame();
    }
}