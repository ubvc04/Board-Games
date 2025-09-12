# Mini Games: Strategy & Board

A modern, interactive web-based collection of classic strategy and board games featuring smooth animations, AI opponents, and beautiful UI design.

## 🎮 Included Games

### ✅ Implemented Games
- **Chess** - Full chess game with Python backend using python-chess library
  - Move validation and legal move checking
  - Check and checkmate detection
  - AI opponent with multiple difficulty levels
  - Move hints and suggestions
  - Animated piece movement
  - Captured pieces display
  - Move history tracking

- **Checkers (Draughts)** - Classic checkers with jumping mechanics
  - Turn-based gameplay
  - Jump captures and mandatory capturing
  - King promotion
  - Animated piece movement
  - Score tracking

- **Connect Four** - Drop pieces to connect four in a row
  - Animated piece dropping with physics
  - AI opponent with minimax algorithm
  - Win detection (horizontal, vertical, diagonal)
  - Column highlighting
  - Hint system

### 🚧 Games to be Implemented
- Ludo (Multiplayer, Turn-Based)
- Monopoly Mini (Basic Economy Version)
- Battleship (Player vs AI)
- Reversi (Othello)
- Go (9x9 Small Board)
- Carrom (Physics-based)
- Mancala

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with smooth animations
- **Interactive Gameplay**: Click-based controls with visual feedback
- **AI Opponents**: Intelligent computer players for single-player mode
- **Sound Effects**: Audio feedback for moves, captures, and game events
- **Mobile Friendly**: Responsive design that works on all devices
- **Game Navigation**: Easy switching between different games
- **Move Validation**: Proper game rules enforcement
- **Hint Systems**: Get suggestions for your next move

## 📋 Requirements

### Python Dependencies
- Python 3.7+
- Flask 2.3.3
- Flask-CORS 4.0.0
- python-chess 1.999
- Werkzeug 2.3.7

### Optional
- Stockfish chess engine (for enhanced chess AI)

## 🛠️ Installation & Setup

### 1. Clone or Download the Project
```bash
cd "C:\Users\baves\Downloads\Board Games\mini-games-strategy-board"
```

### 2. Install Python Dependencies
```bash
# Using pip
pip install -r requirements.txt

# Or using pip3
pip3 install -r requirements.txt
```

### 3. Install Stockfish (Optional - for better chess AI)
**Windows:**
- Download Stockfish from https://stockfishchess.org/download/
- Extract to `engines/stockfish.exe`

**macOS:**
```bash
brew install stockfish
```

**Linux:**
```bash
sudo apt-get install stockfish
```

### 4. Run the Application
```bash
python app.py
```

The server will start on `http://localhost:5000`

## 🎯 How to Play

### Getting Started
1. Open your web browser and go to `http://localhost:5000`
2. Click on any game card to start playing
3. Use the back button to return to the main menu

### Game Controls
- **Chess**: Click pieces to select, click destination to move
- **Checkers**: Click pieces to select, click destination to move
- **Connect Four**: Click columns to drop pieces

### Common Features
- **Restart**: Start a new game
- **Hint**: Get AI suggestions for your next move
- **Undo**: Take back your last move
- **Sound Toggle**: Enable/disable sound effects

## 🎨 Customization

### Adding New Games
1. Create a new JavaScript file in `static/js/games/`
2. Extend the `BaseGame` class
3. Implement required methods: `init()`, `restart()`, `makeMove()`, etc.
4. Add game-specific CSS styles
5. Update the main dashboard with your new game

### Styling
- Main styles are in `static/css/main.css`
- Each game can add its own styles via JavaScript
- CSS variables are used for consistent theming

## 📱 Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🔧 Troubleshooting

### Python Backend Issues
- Make sure Python 3.7+ is installed
- Check that all dependencies are installed: `pip list`
- Verify Flask is running without errors

### Chess Engine Issues
- Chess works without Stockfish (uses basic AI)
- For better AI, install Stockfish and ensure it's in your PATH

### Audio Issues
- Some browsers require user interaction before playing audio
- Click anywhere on the page to enable audio
- Check browser audio permissions

### Performance Issues
- Games are optimized for modern browsers
- For older devices, disable animations in CSS

## 📁 Project Structure

```
mini-games-strategy-board/
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── main.css      # Main stylesheet
│   ├── js/
│   │   ├── main.js       # Core game management
│   │   ├── audio.js      # Audio management
│   │   ├── game-loader.js # Game loading utilities
│   │   └── games/        # Individual game implementations
│   │       ├── chess.js
│   │       ├── checkers.js
│   │       └── connect4.js
│   ├── audio/            # Sound effects (create and add MP3 files)
│   └── images/           # Game images and icons
└── backend/              # Backend utilities (future expansion)
```

## 🎵 Adding Sound Effects

Create the following audio files in `static/audio/`:
- `move.mp3` - Piece movement sound
- `capture.mp3` - Piece capture sound
- `dice.mp3` - Dice roll sound
- `win.mp3` - Victory sound

You can find free game sound effects at:
- https://freesound.org/
- https://opengameart.org/
- https://mixkit.co/

## 🤝 Contributing

1. Fork the project
2. Create a new game in `static/js/games/`
3. Follow the existing code structure
4. Test thoroughly across different browsers
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Enjoy Playing!

Have fun exploring these classic strategy and board games with a modern twist! Each game offers a unique challenge and hours of entertainment.

For questions or issues, please check the troubleshooting section or create an issue in the project repository.