"""
Flask Backend for Mini Games: Strategy & Board
Handles chess engine integration using python-chess library
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import chess
import chess.engine
import chess.svg
import random
import os
import sys
from typing import Optional, Dict, List, Tuple

app = Flask(__name__)
CORS(app)

# Global chess engine instance
engine: Optional[chess.engine.SimpleEngine] = None

class ChessGameManager:
    """Manages chess game state and AI engine interactions"""
    
    def __init__(self):
        self.games = {}  # Store multiple game sessions
        self.engine = None
        self.init_engine()
    
    def init_engine(self):
        """Initialize chess engine (Stockfish if available)"""
        try:
            # Try to find Stockfish engine
            possible_paths = [
                'stockfish',  # If in PATH
                '/usr/local/bin/stockfish',
                '/usr/bin/stockfish',
                'engines/stockfish.exe',  # Windows
                'engines/stockfish',      # Linux/Mac
            ]
            
            for path in possible_paths:
                try:
                    self.engine = chess.engine.SimpleEngine.popen_uci(path)
                    print(f"Chess engine initialized: {path}")
                    return
                except:
                    continue
                    
            print("Warning: No chess engine found, using basic AI")
            
        except Exception as e:
            print(f"Error initializing chess engine: {e}")
    
    def get_board_from_fen(self, fen: str) -> chess.Board:
        """Create chess board from FEN string"""
        try:
            return chess.Board(fen)
        except:
            return chess.Board()  # Return default starting position
    
    def get_valid_moves(self, fen: str, square: str) -> List[str]:
        """Get valid moves for a piece on given square"""
        try:
            board = self.get_board_from_fen(fen)
            square_obj = chess.parse_square(square)
            
            valid_moves = []
            for move in board.legal_moves:
                if move.from_square == square_obj:
                    valid_moves.append(chess.square_name(move.to_square))
            
            return valid_moves
        except Exception as e:
            print(f"Error getting valid moves: {e}")
            return []
    
    def make_move(self, fen: str, from_square: str, to_square: str) -> Dict:
        """Make a move and return new game state"""
        try:
            board = self.get_board_from_fen(fen)
            
            # Parse squares
            from_sq = chess.parse_square(from_square)
            to_sq = chess.parse_square(to_square)
            
            # Create move
            move = chess.Move(from_sq, to_sq)
            
            # Check for promotion (assume queen for simplicity)
            piece = board.piece_at(from_sq)
            if piece and piece.piece_type == chess.PAWN:
                if (piece.color == chess.WHITE and chess.square_rank(to_sq) == 7) or \
                   (piece.color == chess.BLACK and chess.square_rank(to_sq) == 0):
                    move = chess.Move(from_sq, to_sq, promotion=chess.QUEEN)
            
            # Validate and make move
            if move not in board.legal_moves:
                return {"error": "Invalid move"}
            
            board.push(move)
            
            # Check game state
            result = {
                "newPosition": board.fen(),
                "moveNotation": board.san(move),
                "isCheck": board.is_check(),
                "isCheckmate": board.is_checkmate(),
                "isDraw": board.is_stalemate() or board.is_insufficient_material(),
                "drawReason": None,
                "winner": None
            }
            
            if result["isCheckmate"]:
                result["winner"] = "Black" if board.turn else "White"
            elif result["isDraw"]:
                if board.is_stalemate():
                    result["drawReason"] = "Stalemate"
                elif board.is_insufficient_material():
                    result["drawReason"] = "Insufficient material"
            
            return result
            
        except Exception as e:
            print(f"Error making move: {e}")
            return {"error": str(e)}
    
    def get_ai_move(self, fen: str, difficulty: int = 2) -> Dict:
        """Get AI move using chess engine or basic AI"""
        try:
            board = self.get_board_from_fen(fen)
            
            if self.engine:
                # Use Stockfish engine
                time_limit = {1: 0.1, 2: 0.5, 3: 1.0}.get(difficulty, 0.5)
                result = self.engine.play(board, chess.engine.Limit(time=time_limit))
                move = result.move
            else:
                # Use basic AI
                move = self.get_basic_ai_move(board, difficulty)
            
            if not move:
                return {"error": "No valid moves available"}
            
            # Make the move and return result
            from_square = chess.square_name(move.from_square)
            to_square = chess.square_name(move.to_square)
            
            result = self.make_move(fen, from_square, to_square)
            result.update({
                "from": from_square,
                "to": to_square
            })
            
            return result
            
        except Exception as e:
            print(f"Error getting AI move: {e}")
            return {"error": str(e)}
    
    def get_basic_ai_move(self, board: chess.Board, difficulty: int) -> Optional[chess.Move]:
        """Basic AI when no engine is available"""
        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return None
        
        if difficulty == 1:
            # Random move
            return random.choice(legal_moves)
        
        # Simple evaluation-based AI
        best_move = None
        best_score = float('-inf')
        
        for move in legal_moves:
            board.push(move)
            score = self.evaluate_position(board)
            
            if board.turn == chess.BLACK:  # AI is black, minimize score
                score = -score
            
            if score > best_score:
                best_score = score
                best_move = move
            
            board.pop()
        
        return best_move
    
    def evaluate_position(self, board: chess.Board) -> float:
        """Simple position evaluation"""
        if board.is_checkmate():
            return -1000 if board.turn else 1000
        
        if board.is_stalemate() or board.is_insufficient_material():
            return 0
        
        # Material count
        piece_values = {
            chess.PAWN: 1,
            chess.KNIGHT: 3,
            chess.BISHOP: 3,
            chess.ROOK: 5,
            chess.QUEEN: 9,
            chess.KING: 0
        }
        
        score = 0
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece:
                value = piece_values[piece.piece_type]
                score += value if piece.color == chess.WHITE else -value
        
        return score
    
    def get_hint(self, fen: str) -> Dict:
        """Get a hint for the current position"""
        try:
            board = self.get_board_from_fen(fen)
            
            if self.engine:
                # Use engine for best move
                result = self.engine.play(board, chess.engine.Limit(time=0.1))
                move = result.move
                hint_text = f"Consider {board.san(move)}"
            else:
                # Basic hint
                move = self.get_basic_ai_move(board, 2)
                hint_text = f"Consider {board.san(move)}" if move else "No hints available"
            
            return {
                "hint": hint_text,
                "from": chess.square_name(move.from_square) if move else None,
                "to": chess.square_name(move.to_square) if move else None
            }
            
        except Exception as e:
            print(f"Error getting hint: {e}")
            return {"hint": "Hint not available"}
    
    def cleanup(self):
        """Cleanup chess engine"""
        if self.engine:
            self.engine.quit()

# Global chess manager
chess_manager = ChessGameManager()

@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

# Chess API endpoints
@app.route('/api/chess/status', methods=['GET'])
def chess_status():
    """Check if chess backend is available"""
    return jsonify({
        "status": "available",
        "engine": "stockfish" if chess_manager.engine else "basic",
        "version": "1.0"
    })

@app.route('/api/chess/valid-moves', methods=['POST'])
def get_valid_moves():
    """Get valid moves for a piece"""
    try:
        data = request.get_json()
        fen = data.get('position')
        square = data.get('square')
        
        if not fen or not square:
            return jsonify({"error": "Missing position or square"}), 400
        
        moves = chess_manager.get_valid_moves(fen, square)
        return jsonify({"moves": moves})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chess/make-move', methods=['POST'])
def make_move():
    """Make a chess move"""
    try:
        data = request.get_json()
        fen = data.get('position')
        from_square = data.get('from')
        to_square = data.get('to')
        
        if not all([fen, from_square, to_square]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        result = chess_manager.make_move(fen, from_square, to_square)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chess/ai-move', methods=['POST'])
def get_ai_move():
    """Get AI move"""
    try:
        data = request.get_json()
        fen = data.get('position')
        difficulty = data.get('difficulty', 2)
        
        if not fen:
            return jsonify({"error": "Missing position"}), 400
        
        result = chess_manager.get_ai_move(fen, difficulty)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chess/hint', methods=['POST'])
def get_hint():
    """Get a hint for the current position"""
    try:
        data = request.get_json()
        fen = data.get('position')
        
        if not fen:
            return jsonify({"error": "Missing position"}), 400
        
        result = chess_manager.get_hint(fen)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Cleanup on exit
import atexit
atexit.register(chess_manager.cleanup)

if __name__ == '__main__':
    try:
        print("Starting Mini Games: Strategy & Board Server")
        print("Chess engine:", "Stockfish" if chess_manager.engine else "Basic AI")
        print("Server running on http://localhost:5000")
        
        # Development server
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\nShutting down server...")
        chess_manager.cleanup()
    except Exception as e:
        print(f"Error starting server: {e}")
        chess_manager.cleanup()