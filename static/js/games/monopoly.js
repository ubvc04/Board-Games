class MonopolyGame extends BaseGame {
    constructor() {
        super();
        this.players = 2;
        this.currentPlayer = 0;
        this.gameState = 'rolling'; // rolling, moving, buying, finished
        this.playerColors = ['red', 'blue'];
        this.playerNames = ['Player 1', 'Player 2'];
        
        // Initialize players
        this.playerData = {
            red: {
                money: 1500,
                position: 0,
                properties: [],
                inJail: false,
                jailTurns: 0
            },
            blue: {
                money: 1500,
                position: 0,
                properties: [],
                inJail: false,
                jailTurns: 0
            }
        };
        
        this.diceValue = 0;
        this.doubles = 0;
        this.winner = null;
        
        // Simplified 20-space board
        this.board = [
            { type: 'go', name: 'GO', description: 'Collect $200' },
            { type: 'property', name: 'Mediterranean Ave', price: 60, rent: [2, 10, 30, 90, 160, 250], color: 'brown' },
            { type: 'community', name: 'Community Chest', description: 'Draw a card' },
            { type: 'property', name: 'Baltic Ave', price: 60, rent: [4, 20, 60, 180, 320, 450], color: 'brown' },
            { type: 'tax', name: 'Income Tax', description: 'Pay $200' },
            { type: 'railroad', name: 'Reading Railroad', price: 200, rent: [25, 50, 100, 200] },
            { type: 'property', name: 'Oriental Ave', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'lightblue' },
            { type: 'chance', name: 'Chance', description: 'Draw a card' },
            { type: 'property', name: 'Vermont Ave', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'lightblue' },
            { type: 'property', name: 'Connecticut Ave', price: 120, rent: [8, 40, 100, 300, 450, 600], color: 'lightblue' },
            { type: 'jail', name: 'Jail', description: 'Just Visiting' },
            { type: 'property', name: 'St. Charles Place', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'pink' },
            { type: 'utility', name: 'Electric Company', price: 150, rent: [4, 10] },
            { type: 'property', name: 'States Ave', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'pink' },
            { type: 'property', name: 'Virginia Ave', price: 160, rent: [12, 60, 180, 500, 700, 900], color: 'pink' },
            { type: 'railroad', name: 'Pennsylvania Railroad', price: 200, rent: [25, 50, 100, 200] },
            { type: 'property', name: 'St. James Place', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'orange' },
            { type: 'community', name: 'Community Chest', description: 'Draw a card' },
            { type: 'property', name: 'Tennessee Ave', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'orange' },
            { type: 'property', name: 'New York Ave', price: 200, rent: [16, 80, 220, 600, 800, 1000], color: 'orange' }
        ];
        
        // Property ownership
        this.propertyOwners = {};
    }

    init() {
        this.createBoard();
        this.setupControls();
        this.updatePlayerInfo();
        this.placePlayers();
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="monopoly-container">
                <div class="monopoly-board">
                    <div class="board-spaces">
                        ${this.createBoardSpaces()}
                    </div>
                    
                    <div class="center-area">
                        <div class="monopoly-logo">
                            <h2>MONOPOLY</h2>
                            <div class="subtitle">Mini Edition</div>
                        </div>
                        
                        <div class="dice-area">
                            <div class="dice-container">
                                <div class="dice" id="dice1">
                                    <div class="dice-face">1</div>
                                </div>
                                <div class="dice" id="dice2">
                                    <div class="dice-face">1</div>
                                </div>
                            </div>
                            <button id="roll-dice-btn" class="control-btn">Roll Dice</button>
                        </div>
                    </div>
                </div>
                
                <div class="game-panel">
                    <div class="player-info">
                        <div class="player-card red-player" id="player-red">
                            <div class="player-header">
                                <div class="player-token red"></div>
                                <div class="player-name">Player 1</div>
                            </div>
                            <div class="player-money">$1500</div>
                            <div class="player-properties">
                                <div class="properties-title">Properties:</div>
                                <div class="properties-list" id="red-properties"></div>
                            </div>
                        </div>
                        
                        <div class="player-card blue-player" id="player-blue">
                            <div class="player-header">
                                <div class="player-token blue"></div>
                                <div class="player-name">Player 2</div>
                            </div>
                            <div class="player-money">$1500</div>
                            <div class="player-properties">
                                <div class="properties-title">Properties:</div>
                                <div class="properties-list" id="blue-properties"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-actions">
                        <div class="current-turn">
                            <span id="current-player-name">Player 1</span>'s Turn
                        </div>
                        
                        <div class="action-buttons">
                            <button id="buy-property-btn" class="action-btn" style="display: none;">
                                Buy Property
                            </button>
                            <button id="end-turn-btn" class="action-btn" style="display: none;">
                                End Turn
                            </button>
                        </div>
                        
                        <div class="game-status" id="monopoly-status">
                            Click "Roll Dice" to start your turn!
                        </div>
                        
                        <div class="property-details" id="property-details" style="display: none;">
                            <div class="property-card">
                                <div class="property-title" id="property-title"></div>
                                <div class="property-price" id="property-price"></div>
                                <div class="property-rent" id="property-rent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createBoardSpaces() {
        let spacesHTML = '';
        
        this.board.forEach((space, index) => {
            const colorClass = space.color ? `color-${space.color}` : '';
            const typeClass = `space-${space.type}`;
            
            spacesHTML += `
                <div class="board-space ${typeClass} ${colorClass}" data-position="${index}">
                    <div class="space-content">
                        <div class="space-name">${space.name}</div>
                        ${space.price ? `<div class="space-price">$${space.price}</div>` : ''}
                        ${space.description ? `<div class="space-description">${space.description}</div>` : ''}
                    </div>
                    <div class="space-players"></div>
                    ${space.type === 'property' ? `<div class="property-stripe ${space.color}"></div>` : ''}
                </div>
            `;
        });
        
        return spacesHTML;
    }

    setupControls() {
        const rollBtn = document.getElementById('roll-dice-btn');
        const buyBtn = document.getElementById('buy-property-btn');
        const endTurnBtn = document.getElementById('end-turn-btn');
        
        rollBtn?.addEventListener('click', () => this.rollDice());
        buyBtn?.addEventListener('click', () => this.buyProperty());
        endTurnBtn?.addEventListener('click', () => this.endTurn());
    }

    placePlayers() {
        this.playerColors.forEach(color => {
            const playerToken = document.createElement('div');
            playerToken.className = `player-token ${color} on-board`;
            playerToken.id = `token-${color}`;
            
            const goSpace = document.querySelector('[data-position="0"] .space-players');
            if (goSpace) {
                goSpace.appendChild(playerToken);
            }
        });
    }

    rollDice() {
        if (this.gameState !== 'rolling') return;
        
        const dice1 = document.getElementById('dice1');
        const dice2 = document.getElementById('dice2');
        const rollBtn = document.getElementById('roll-dice-btn');
        
        rollBtn.disabled = true;
        this.gameState = 'rolling-animation';
        
        // Animate dice roll
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            const value1 = Math.floor(Math.random() * 6) + 1;
            const value2 = Math.floor(Math.random() * 6) + 1;
            
            dice1.querySelector('.dice-face').textContent = value1;
            dice2.querySelector('.dice-face').textContent = value2;
            
            dice1.className = 'dice rolling';
            dice2.className = 'dice rolling';
            
            rollCount++;
            if (rollCount >= 15) {
                clearInterval(rollInterval);
                dice1.className = 'dice';
                dice2.className = 'dice';
                
                this.diceValue = value1 + value2;
                this.handleDiceRoll(value1, value2);
            }
        }, 100);
        
        this.playSound('dice');
    }

    handleDiceRoll(dice1, dice2) {
        const currentColor = this.playerColors[this.currentPlayer];
        const player = this.playerData[currentColor];
        
        // Check for doubles
        const isDoubles = dice1 === dice2;
        if (isDoubles) {
            this.doubles++;
            if (this.doubles >= 3) {
                // Go to jail on three doubles
                this.sendToJail();
                return;
            }
        } else {
            this.doubles = 0;
        }
        
        // Move player
        this.movePlayer(currentColor, this.diceValue);
        
        // Update status
        const status = document.getElementById('monopoly-status');
        status.textContent = `Rolled ${dice1} + ${dice2} = ${this.diceValue}. Moving...`;
        
        setTimeout(() => {
            this.handleLandedSpace();
            
            if (isDoubles && !player.inJail) {
                status.textContent = 'Doubles! Roll again!';
                this.gameState = 'rolling';
                document.getElementById('roll-dice-btn').disabled = false;
            }
        }, 1000);
    }

    movePlayer(color, spaces) {
        const player = this.playerData[color];
        const oldPosition = player.position;
        
        // Remove token from old position
        const oldToken = document.getElementById(`token-${color}`);
        if (oldToken) {
            oldToken.remove();
        }
        
        // Calculate new position
        player.position = (player.position + spaces) % this.board.length;
        
        // Check if passed GO
        if (oldPosition + spaces >= this.board.length) {
            this.collectGo(color);
        }
        
        // Place token at new position
        const newSpace = document.querySelector(`[data-position="${player.position}"] .space-players`);
        if (newSpace) {
            const playerToken = document.createElement('div');
            playerToken.className = `player-token ${color} on-board`;
            playerToken.id = `token-${color}`;
            newSpace.appendChild(playerToken);
        }
        
        this.updatePlayerInfo();
    }

    collectGo(color) {
        this.playerData[color].money += 200;
        const status = document.getElementById('monopoly-status');
        status.textContent += ' Passed GO, collect $200!';
        this.playSound('move');
    }

    handleLandedSpace() {
        const currentColor = this.playerColors[this.currentPlayer];
        const player = this.playerData[currentColor];
        const space = this.board[player.position];
        const status = document.getElementById('monopoly-status');
        
        switch (space.type) {
            case 'go':
                status.textContent = 'Landed on GO!';
                this.showEndTurn();
                break;
                
            case 'property':
            case 'railroad':
            case 'utility':
                this.handlePropertyLanding(space, player.position);
                break;
                
            case 'tax':
                this.handleTax();
                break;
                
            case 'jail':
                status.textContent = 'Just visiting jail.';
                this.showEndTurn();
                break;
                
            case 'community':
            case 'chance':
                this.handleCard(space.type);
                break;
                
            default:
                this.showEndTurn();
        }
    }

    handlePropertyLanding(space, position) {
        const currentColor = this.playerColors[this.currentPlayer];
        const owner = this.propertyOwners[position];
        const status = document.getElementById('monopoly-status');
        
        if (!owner) {
            // Property is available for purchase
            status.textContent = `${space.name} is available for $${space.price}`;
            this.showPropertyDetails(space);
            this.showBuyOption();
        } else if (owner === currentColor) {
            // Player owns this property
            status.textContent = `You own ${space.name}`;
            this.showEndTurn();
        } else {
            // Pay rent to owner
            const rent = this.calculateRent(space, position);
            this.payRent(currentColor, owner, rent);
            status.textContent = `Paid $${rent} rent to ${this.getPlayerName(owner)}`;
            this.showEndTurn();
        }
    }

    calculateRent(space, position) {
        if (space.type === 'railroad') {
            const railroadsOwned = this.countRailroadsOwned(this.propertyOwners[position]);
            return space.rent[railroadsOwned - 1];
        } else if (space.type === 'utility') {
            const utilitiesOwned = this.countUtilitiesOwned(this.propertyOwners[position]);
            return this.diceValue * space.rent[utilitiesOwned - 1];
        } else {
            return space.rent[0]; // Base rent for properties
        }
    }

    countRailroadsOwned(owner) {
        let count = 0;
        [5, 15].forEach(pos => {
            if (this.propertyOwners[pos] === owner) count++;
        });
        return count;
    }

    countUtilitiesOwned(owner) {
        let count = 0;
        [12].forEach(pos => {
            if (this.propertyOwners[pos] === owner) count++;
        });
        return count;
    }

    payRent(payer, receiver, amount) {
        this.playerData[payer].money -= amount;
        this.playerData[receiver].money += amount;
        this.updatePlayerInfo();
        this.playSound('capture');
    }

    handleTax() {
        const currentColor = this.playerColors[this.currentPlayer];
        this.playerData[currentColor].money -= 200;
        this.updatePlayerInfo();
        
        const status = document.getElementById('monopoly-status');
        status.textContent = 'Paid $200 income tax';
        this.showEndTurn();
    }

    handleCard(type) {
        const cards = type === 'community' ? this.communityCards : this.chanceCards;
        const card = cards[Math.floor(Math.random() * cards.length)];
        
        const status = document.getElementById('monopoly-status');
        status.textContent = card.text;
        
        // Execute card effect
        this.executeCardEffect(card);
        
        setTimeout(() => this.showEndTurn(), 2000);
    }

    executeCardEffect(card) {
        const currentColor = this.playerColors[this.currentPlayer];
        const player = this.playerData[currentColor];
        
        switch (card.type) {
            case 'money':
                player.money += card.amount;
                break;
            case 'move':
                this.movePlayer(currentColor, card.spaces);
                break;
            case 'jail':
                this.sendToJail();
                break;
        }
        
        this.updatePlayerInfo();
    }

    sendToJail() {
        const currentColor = this.playerColors[this.currentPlayer];
        const player = this.playerData[currentColor];
        
        player.inJail = true;
        player.jailTurns = 0;
        player.position = 10; // Jail position
        
        // Move token to jail
        const oldToken = document.getElementById(`token-${currentColor}`);
        if (oldToken) oldToken.remove();
        
        const jailSpace = document.querySelector('[data-position="10"] .space-players');
        if (jailSpace) {
            const playerToken = document.createElement('div');
            playerToken.className = `player-token ${currentColor} on-board in-jail`;
            playerToken.id = `token-${currentColor}`;
            jailSpace.appendChild(playerToken);
        }
        
        const status = document.getElementById('monopoly-status');
        status.textContent = 'Go directly to jail!';
        this.doubles = 0;
        
        setTimeout(() => this.showEndTurn(), 2000);
    }

    showPropertyDetails(space) {
        const details = document.getElementById('property-details');
        const title = document.getElementById('property-title');
        const price = document.getElementById('property-price');
        const rent = document.getElementById('property-rent');
        
        title.textContent = space.name;
        price.textContent = `Price: $${space.price}`;
        rent.textContent = `Rent: $${space.rent[0]}`;
        
        details.style.display = 'block';
    }

    showBuyOption() {
        const buyBtn = document.getElementById('buy-property-btn');
        buyBtn.style.display = 'block';
        this.gameState = 'buying';
    }

    showEndTurn() {
        const endBtn = document.getElementById('end-turn-btn');
        endBtn.style.display = 'block';
        this.gameState = 'ending';
    }

    buyProperty() {
        const currentColor = this.playerColors[this.currentPlayer];
        const player = this.playerData[currentColor];
        const space = this.board[player.position];
        
        if (player.money >= space.price) {
            player.money -= space.price;
            player.properties.push(player.position);
            this.propertyOwners[player.position] = currentColor;
            
            const status = document.getElementById('monopoly-status');
            status.textContent = `Purchased ${space.name} for $${space.price}`;
            
            this.updatePlayerInfo();
            this.playSound('move');
        } else {
            const status = document.getElementById('monopoly-status');
            status.textContent = 'Not enough money!';
        }
        
        this.hideActionButtons();
        this.showEndTurn();
    }

    endTurn() {
        this.hideActionButtons();
        document.getElementById('property-details').style.display = 'none';
        
        if (this.doubles === 0) {
            this.nextPlayer();
        }
        
        this.gameState = 'rolling';
        document.getElementById('roll-dice-btn').disabled = false;
        
        const status = document.getElementById('monopoly-status');
        status.textContent = 'Click "Roll Dice" to start your turn!';
    }

    hideActionButtons() {
        document.getElementById('buy-property-btn').style.display = 'none';
        document.getElementById('end-turn-btn').style.display = 'none';
    }

    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players;
        this.updateCurrentPlayer();
        
        // Check for bankruptcy
        if (this.checkGameEnd()) return;
    }

    updateCurrentPlayer() {
        const currentPlayerName = document.getElementById('current-player-name');
        currentPlayerName.textContent = this.playerNames[this.currentPlayer];
        
        // Highlight current player card
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const currentColor = this.playerColors[this.currentPlayer];
        document.getElementById(`player-${currentColor}`).classList.add('active');
    }

    updatePlayerInfo() {
        this.playerColors.forEach(color => {
            const player = this.playerData[color];
            const card = document.getElementById(`player-${color}`);
            
            const moneyElement = card.querySelector('.player-money');
            moneyElement.textContent = `$${player.money}`;
            
            const propertiesList = card.querySelector('.properties-list');
            propertiesList.innerHTML = '';
            
            player.properties.forEach(position => {
                const property = this.board[position];
                const propertyElement = document.createElement('div');
                propertyElement.className = 'property-item';
                propertyElement.textContent = property.name;
                propertiesList.appendChild(propertyElement);
            });
        });
        
        this.updateCurrentPlayer();
    }

    checkGameEnd() {
        const bankruptPlayers = this.playerColors.filter(color => 
            this.playerData[color].money < 0
        );
        
        if (bankruptPlayers.length > 0) {
            const winner = this.playerColors.find(color => 
                this.playerData[color].money >= 0
            );
            
            this.winner = winner;
            this.gameState = 'finished';
            
            const status = document.getElementById('monopoly-status');
            status.textContent = `Game Over! ${this.getPlayerName(winner)} wins!`;
            
            document.getElementById('roll-dice-btn').disabled = true;
            this.hideActionButtons();
            this.playSound('win');
            
            return true;
        }
        
        return false;
    }

    getPlayerName(color) {
        return this.playerNames[this.playerColors.indexOf(color)];
    }

    reset() {
        this.currentPlayer = 0;
        this.gameState = 'rolling';
        this.diceValue = 0;
        this.doubles = 0;
        this.winner = null;
        this.propertyOwners = {};
        
        // Reset player data
        this.playerColors.forEach(color => {
            this.playerData[color] = {
                money: 1500,
                position: 0,
                properties: [],
                inJail: false,
                jailTurns: 0
            };
        });
        
        this.init();
    }

    // Card definitions
    get communityCards() {
        return [
            { text: 'Bank error in your favor! Collect $200', type: 'money', amount: 200 },
            { text: 'Doctor\'s fees. Pay $50', type: 'money', amount: -50 },
            { text: 'Income tax refund. Collect $20', type: 'money', amount: 20 },
            { text: 'Holiday fund matures. Collect $100', type: 'money', amount: 100 },
            { text: 'Go to jail!', type: 'jail' }
        ];
    }

    get chanceCards() {
        return [
            { text: 'Advance to GO! Collect $200', type: 'move', spaces: 0 },
            { text: 'Bank pays dividend. Collect $50', type: 'money', amount: 50 },
            { text: 'Speeding fine. Pay $15', type: 'money', amount: -15 },
            { text: 'Advance 3 spaces', type: 'move', spaces: 3 },
            { text: 'Go directly to jail!', type: 'jail' }
        ];
    }
}