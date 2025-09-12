class BattleshipGame extends BaseGame {
    constructor() {
        super();
        this.gridSize = 10;
        this.currentPlayer = 'human'; // 'human' or 'ai'
        this.gameState = 'setup'; // 'setup', 'playing', 'finished'
        this.phase = 'placement'; // 'placement', 'battle'
        
        // Ship definitions
        this.ships = [
            { name: 'Carrier', size: 5, count: 1 },
            { name: 'Battleship', size: 4, count: 1 },
            { name: 'Cruiser', size: 3, count: 1 },
            { name: 'Submarine', size: 3, count: 1 },
            { name: 'Destroyer', size: 2, count: 1 }
        ];
        
        // Game boards
        this.playerBoard = this.createEmptyBoard();
        this.aiBoard = this.createEmptyBoard();
        this.playerShots = this.createEmptyBoard();
        this.aiShots = this.createEmptyBoard();
        
        // Ship placement
        this.playerShips = [];
        this.aiShips = [];
        this.currentShipIndex = 0;
        this.shipOrientation = 'horizontal'; // 'horizontal' or 'vertical'
        
        // Game state
        this.winner = null;
        this.playerScore = 0;
        this.aiScore = 0;
        
        // AI targeting
        this.aiTargetQueue = [];
        this.aiLastHit = null;
        this.aiHitDirection = null;
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.placeAIShips();
        this.updateGameStatus();
    }

    createEmptyBoard() {
        return Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="battleship-container">
                <div class="game-boards">
                    <div class="board-section">
                        <h3>Your Fleet</h3>
                        <div class="battleship-board" id="player-board">
                            ${this.createGridHTML('player')}
                        </div>
                    </div>
                    
                    <div class="board-section">
                        <h3>Enemy Waters</h3>
                        <div class="battleship-board" id="ai-board">
                            ${this.createGridHTML('ai')}
                        </div>
                    </div>
                </div>
                
                <div class="game-panel">
                    <div class="game-info">
                        <div class="phase-indicator">
                            <h2 id="game-phase">Ship Placement</h2>
                            <div id="game-status">Place your ships on the board</div>
                        </div>
                        
                        <div class="score-display">
                            <div class="score-item">
                                <span class="score-label">Your Hits:</span>
                                <span id="player-score">0</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Enemy Hits:</span>
                                <span id="ai-score">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ship-placement" id="ship-placement">
                        <div class="current-ship">
                            <h4>Current Ship:</h4>
                            <div id="current-ship-info">
                                <span id="ship-name">Carrier</span>
                                <span id="ship-size">(5 spaces)</span>
                            </div>
                        </div>
                        
                        <div class="placement-controls">
                            <button id="rotate-btn" class="control-btn">
                                <i class="fas fa-redo"></i> Rotate
                            </button>
                            <button id="random-btn" class="control-btn">
                                <i class="fas fa-random"></i> Random
                            </button>
                            <button id="clear-btn" class="control-btn">
                                <i class="fas fa-trash"></i> Clear
                            </button>
                        </div>
                        
                        <div class="ships-remaining">
                            <h4>Ships to Place:</h4>
                            <div id="ships-list">
                                ${this.createShipsListHTML()}
                            </div>
                        </div>
                        
                        <button id="start-battle-btn" class="action-btn" style="display: none;">
                            Start Battle!
                        </button>
                    </div>
                    
                    <div class="battle-info" id="battle-info" style="display: none;">
                        <div class="turn-indicator">
                            <span id="turn-player">Your Turn</span>
                        </div>
                        
                        <div class="targeting-help">
                            <p>Click on the enemy board to fire!</p>
                        </div>
                        
                        <div class="ships-status">
                            <div class="fleet-status">
                                <h4>Your Fleet:</h4>
                                <div id="player-fleet-status"></div>
                            </div>
                            <div class="fleet-status">
                                <h4>Enemy Fleet:</h4>
                                <div id="ai-fleet-status"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    createGridHTML(boardType) {
        let gridHTML = '';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                gridHTML += `
                    <div class="grid-cell ${boardType}-cell" 
                         data-row="${row}" 
                         data-col="${col}"
                         data-board="${boardType}">
                    </div>
                `;
            }
        }
        return gridHTML;
    }

    createShipsListHTML() {
        return this.ships.map((ship, index) => `
            <div class="ship-item ${index === 0 ? 'active' : ''}" data-ship-index="${index}">
                <span class="ship-name">${ship.name}</span>
                <span class="ship-length">${ship.size}</span>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Ship placement listeners
        document.querySelectorAll('.player-cell').forEach(cell => {
            cell.addEventListener('mouseenter', (e) => this.showShipPreview(e));
            cell.addEventListener('mouseleave', () => this.hideShipPreview());
            cell.addEventListener('click', (e) => this.placeShip(e));
        });
        
        // AI board listeners (for battle phase)
        document.querySelectorAll('.ai-cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handlePlayerShot(e));
        });
    }

    setupControls() {
        const rotateBtn = document.getElementById('rotate-btn');
        const randomBtn = document.getElementById('random-btn');
        const clearBtn = document.getElementById('clear-btn');
        const startBtn = document.getElementById('start-battle-btn');
        
        rotateBtn?.addEventListener('click', () => this.rotateShip());
        randomBtn?.addEventListener('click', () => this.randomPlacement());
        clearBtn?.addEventListener('click', () => this.clearBoard());
        startBtn?.addEventListener('click', () => this.startBattle());
    }

    showShipPreview(event) {
        if (this.phase !== 'placement' || this.currentShipIndex >= this.ships.length) return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const ship = this.ships[this.currentShipIndex];
        
        this.hideShipPreview();
        
        if (this.canPlaceShip(row, col, ship.size, this.shipOrientation)) {
            const positions = this.getShipPositions(row, col, ship.size, this.shipOrientation);
            positions.forEach(pos => {
                const previewCell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"][data-board="player"]`);
                if (previewCell) {
                    previewCell.classList.add('ship-preview');
                }
            });
        } else {
            cell.classList.add('invalid-placement');
        }
    }

    hideShipPreview() {
        document.querySelectorAll('.ship-preview, .invalid-placement').forEach(cell => {
            cell.classList.remove('ship-preview', 'invalid-placement');
        });
    }

    placeShip(event) {
        if (this.phase !== 'placement' || this.currentShipIndex >= this.ships.length) return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const ship = this.ships[this.currentShipIndex];
        
        if (this.canPlaceShip(row, col, ship.size, this.shipOrientation)) {
            const positions = this.getShipPositions(row, col, ship.size, this.shipOrientation);
            
            // Place ship on board
            positions.forEach(pos => {
                this.playerBoard[pos.row][pos.col] = 1;
                const shipCell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"][data-board="player"]`);
                if (shipCell) {
                    shipCell.classList.add('ship-placed');
                }
            });
            
            // Store ship data
            this.playerShips.push({
                name: ship.name,
                size: ship.size,
                positions: positions,
                hits: 0,
                sunk: false
            });
            
            this.currentShipIndex++;
            this.updateShipPlacement();
            this.playSound('move');
        }
    }

    canPlaceShip(row, col, size, orientation) {
        const positions = this.getShipPositions(row, col, size, orientation);
        
        return positions.every(pos => {
            return pos.row >= 0 && pos.row < this.gridSize &&
                   pos.col >= 0 && pos.col < this.gridSize &&
                   this.playerBoard[pos.row][pos.col] === 0;
        });
    }

    getShipPositions(row, col, size, orientation) {
        const positions = [];
        for (let i = 0; i < size; i++) {
            if (orientation === 'horizontal') {
                positions.push({ row: row, col: col + i });
            } else {
                positions.push({ row: row + i, col: col });
            }
        }
        return positions;
    }

    rotateShip() {
        this.shipOrientation = this.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        this.hideShipPreview();
    }

    randomPlacement() {
        this.clearBoard();
        this.currentShipIndex = 0;
        
        this.ships.forEach(ship => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * this.gridSize);
                const col = Math.floor(Math.random() * this.gridSize);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                if (this.canPlaceShip(row, col, ship.size, orientation)) {
                    const positions = this.getShipPositions(row, col, ship.size, orientation);
                    
                    positions.forEach(pos => {
                        this.playerBoard[pos.row][pos.col] = 1;
                        const shipCell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"][data-board="player"]`);
                        if (shipCell) {
                            shipCell.classList.add('ship-placed');
                        }
                    });
                    
                    this.playerShips.push({
                        name: ship.name,
                        size: ship.size,
                        positions: positions,
                        hits: 0,
                        sunk: false
                    });
                    
                    this.currentShipIndex++;
                    placed = true;
                }
                attempts++;
            }
        });
        
        this.updateShipPlacement();
    }

    clearBoard() {
        this.playerBoard = this.createEmptyBoard();
        this.playerShips = [];
        this.currentShipIndex = 0;
        
        document.querySelectorAll('.player-cell').forEach(cell => {
            cell.classList.remove('ship-placed');
        });
        
        this.updateShipPlacement();
    }

    updateShipPlacement() {
        // Update current ship info
        if (this.currentShipIndex < this.ships.length) {
            const ship = this.ships[this.currentShipIndex];
            document.getElementById('ship-name').textContent = ship.name;
            document.getElementById('ship-size').textContent = `(${ship.size} spaces)`;
        }
        
        // Update ships list
        document.querySelectorAll('.ship-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentShipIndex);
            item.classList.toggle('placed', index < this.currentShipIndex);
        });
        
        // Show start button if all ships placed
        if (this.currentShipIndex >= this.ships.length) {
            document.getElementById('start-battle-btn').style.display = 'block';
            document.getElementById('game-status').textContent = 'All ships placed! Ready for battle.';
        }
    }

    placeAIShips() {
        this.aiBoard = this.createEmptyBoard();
        this.aiShips = [];
        
        this.ships.forEach(ship => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * this.gridSize);
                const col = Math.floor(Math.random() * this.gridSize);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                if (this.canPlaceAIShip(row, col, ship.size, orientation)) {
                    const positions = this.getShipPositions(row, col, ship.size, orientation);
                    
                    positions.forEach(pos => {
                        this.aiBoard[pos.row][pos.col] = 1;
                    });
                    
                    this.aiShips.push({
                        name: ship.name,
                        size: ship.size,
                        positions: positions,
                        hits: 0,
                        sunk: false
                    });
                    
                    placed = true;
                }
                attempts++;
            }
        });
    }

    canPlaceAIShip(row, col, size, orientation) {
        const positions = this.getShipPositions(row, col, size, orientation);
        
        return positions.every(pos => {
            return pos.row >= 0 && pos.row < this.gridSize &&
                   pos.col >= 0 && pos.col < this.gridSize &&
                   this.aiBoard[pos.row][pos.col] === 0;
        });
    }

    startBattle() {
        this.phase = 'battle';
        this.gameState = 'playing';
        
        document.getElementById('ship-placement').style.display = 'none';
        document.getElementById('battle-info').style.display = 'block';
        document.getElementById('game-phase').textContent = 'Battle Phase';
        document.getElementById('game-status').textContent = 'Click on enemy waters to fire!';
        
        this.updateFleetStatus();
    }

    handlePlayerShot(event) {
        if (this.phase !== 'battle' || this.currentPlayer !== 'human') return;
        
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Check if already shot here
        if (this.playerShots[row][col] !== 0) return;
        
        const hit = this.aiBoard[row][col] === 1;
        this.playerShots[row][col] = hit ? 2 : 1; // 1 = miss, 2 = hit
        
        // Update visual
        cell.classList.add(hit ? 'hit' : 'miss');
        
        if (hit) {
            this.playerScore++;
            this.checkShipSunk(this.aiShips, row, col);
            this.playSound('capture');
            
            if (this.checkGameEnd()) return;
            
            document.getElementById('game-status').textContent = 'Hit! Fire again!';
        } else {
            this.playSound('move');
            document.getElementById('game-status').textContent = 'Miss! Enemy turn.';
            this.currentPlayer = 'ai';
            setTimeout(() => this.handleAITurn(), 1000);
        }
        
        this.updateScores();
        this.updateFleetStatus();
    }

    handleAITurn() {
        if (this.currentPlayer !== 'ai') return;
        
        const target = this.getAITarget();
        const hit = this.playerBoard[target.row][target.col] === 1;
        this.aiShots[target.row][target.col] = hit ? 2 : 1;
        
        // Update visual
        const cell = document.querySelector(`[data-row="${target.row}"][data-col="${target.col}"][data-board="player"]`);
        if (cell) {
            cell.classList.add(hit ? 'hit' : 'miss');
        }
        
        if (hit) {
            this.aiScore++;
            this.aiLastHit = target;
            this.checkShipSunk(this.playerShips, target.row, target.col);
            this.playSound('capture');
            
            if (this.checkGameEnd()) return;
            
            document.getElementById('game-status').textContent = 'Enemy hit! They fire again.';
            setTimeout(() => this.handleAITurn(), 1500);
        } else {
            this.playSound('move');
            this.aiLastHit = null;
            this.aiHitDirection = null;
            document.getElementById('game-status').textContent = 'Enemy missed! Your turn.';
            this.currentPlayer = 'human';
        }
        
        this.updateScores();
        this.updateFleetStatus();
    }

    getAITarget() {
        // Smart AI targeting
        if (this.aiTargetQueue.length > 0) {
            return this.aiTargetQueue.shift();
        }
        
        if (this.aiLastHit) {
            // Try to find the rest of the ship
            const directions = [
                { row: -1, col: 0 }, // up
                { row: 1, col: 0 },  // down
                { row: 0, col: -1 }, // left
                { row: 0, col: 1 }   // right
            ];
            
            if (this.aiHitDirection) {
                // Continue in the same direction
                const next = {
                    row: this.aiLastHit.row + this.aiHitDirection.row,
                    col: this.aiLastHit.col + this.aiHitDirection.col
                };
                
                if (this.isValidTarget(next)) {
                    return next;
                }
            } else {
                // Try all directions
                for (const dir of directions) {
                    const next = {
                        row: this.aiLastHit.row + dir.row,
                        col: this.aiLastHit.col + dir.col
                    };
                    
                    if (this.isValidTarget(next)) {
                        this.aiHitDirection = dir;
                        return next;
                    }
                }
            }
        }
        
        // Random targeting
        let target;
        do {
            target = {
                row: Math.floor(Math.random() * this.gridSize),
                col: Math.floor(Math.random() * this.gridSize)
            };
        } while (!this.isValidTarget(target));
        
        return target;
    }

    isValidTarget(target) {
        return target.row >= 0 && target.row < this.gridSize &&
               target.col >= 0 && target.col < this.gridSize &&
               this.aiShots[target.row][target.col] === 0;
    }

    checkShipSunk(ships, row, col) {
        const ship = ships.find(s => 
            s.positions.some(pos => pos.row === row && pos.col === col)
        );
        
        if (ship) {
            ship.hits++;
            if (ship.hits >= ship.size) {
                ship.sunk = true;
                
                if (ships === this.aiShips) {
                    document.getElementById('game-status').textContent += ` ${ship.name} sunk!`;
                } else {
                    document.getElementById('game-status').textContent += ` Your ${ship.name} was sunk!`;
                    this.aiLastHit = null;
                    this.aiHitDirection = null;
                }
                
                this.playSound('win');
            }
        }
    }

    checkGameEnd() {
        const playerShipsSunk = this.playerShips.filter(s => s.sunk).length;
        const aiShipsSunk = this.aiShips.filter(s => s.sunk).length;
        
        if (playerShipsSunk === this.ships.length) {
            this.winner = 'ai';
            this.gameState = 'finished';
            document.getElementById('game-status').textContent = 'Game Over! Enemy wins!';
            return true;
        } else if (aiShipsSunk === this.ships.length) {
            this.winner = 'human';
            this.gameState = 'finished';
            document.getElementById('game-status').textContent = 'Victory! You win!';
            return true;
        }
        
        return false;
    }

    updateScores() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
    }

    updateFleetStatus() {
        const playerStatus = document.getElementById('player-fleet-status');
        const aiStatus = document.getElementById('ai-fleet-status');
        
        if (playerStatus) {
            playerStatus.innerHTML = this.playerShips.map(ship => 
                `<div class="ship-status ${ship.sunk ? 'sunk' : ''}">
                    ${ship.name}: ${ship.hits}/${ship.size}
                </div>`
            ).join('');
        }
        
        if (aiStatus) {
            aiStatus.innerHTML = this.aiShips.map(ship => 
                `<div class="ship-status ${ship.sunk ? 'sunk' : ''}">
                    ${ship.name}: ${ship.sunk ? 'SUNK' : 'Active'}
                </div>`
            ).join('');
        }
    }

    updateGameStatus() {
        const status = document.getElementById('game-status');
        if (this.phase === 'placement') {
            status.textContent = 'Place your ships on the board';
        }
    }

    reset() {
        this.currentPlayer = 'human';
        this.gameState = 'setup';
        this.phase = 'placement';
        this.playerBoard = this.createEmptyBoard();
        this.aiBoard = this.createEmptyBoard();
        this.playerShots = this.createEmptyBoard();
        this.aiShots = this.createEmptyBoard();
        this.playerShips = [];
        this.aiShips = [];
        this.currentShipIndex = 0;
        this.shipOrientation = 'horizontal';
        this.winner = null;
        this.playerScore = 0;
        this.aiScore = 0;
        this.aiTargetQueue = [];
        this.aiLastHit = null;
        this.aiHitDirection = null;
        
        this.init();
    }
}