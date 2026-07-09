import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export const GameZone: React.FC = () => {
  const [activeGame, setActiveGame] = useState<'NONE' | 'TIC_TAC_TOE' | 'CHESS' | 'LUDO'>('NONE');

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-fuchsia-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-4 relative z-10">Cosmic Game Zone</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-fuchsia-500 to-pink-500 mx-auto rounded-full relative z-10"></div>
        </div>

        {activeGame === 'NONE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => setActiveGame('TIC_TAC_TOE')}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group flex flex-col items-center"
            >
              <i className="fas fa-border-all text-5xl text-cyan-400 mb-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Tic Tac Toe</h3>
              <p className="text-sm opacity-60 font-mono text-center">Classic 3x3 strategy game</p>
            </button>
            <button 
              onClick={() => setActiveGame('CHESS')}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group flex flex-col items-center"
            >
              <i className="fas fa-chess-knight text-5xl text-purple-400 mb-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Chess</h3>
              <p className="text-sm opacity-60 font-mono text-center">The royal game of strategy</p>
            </button>
            <button 
              onClick={() => setActiveGame('LUDO')}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group flex flex-col items-center"
            >
              <i className="fas fa-dice text-5xl text-pink-400 mb-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Ludo</h3>
              <p className="text-sm opacity-60 font-mono text-center">Classic board game (Coming Soon)</p>
            </button>
          </div>
        )}

        {activeGame === 'TIC_TAC_TOE' && <TicTacToeGame onBack={() => setActiveGame('NONE')} />}
        {activeGame === 'CHESS' && <ChessGame onBack={() => setActiveGame('NONE')} />}
        {activeGame === 'LUDO' && (
          <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
            <i className="fas fa-dice text-6xl text-pink-400 mb-6 animate-bounce"></i>
            <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Ludo is Coming Soon</h3>
            <p className="font-mono text-white/60 mb-8">We are crafting the ultimate cosmic Ludo experience.</p>
            <button 
              onClick={() => setActiveGame('NONE')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold"
            >
              Back to Games
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TicTacToeGame = ({ onBack }: { onBack: () => void }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(square => square !== null);

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) return;
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-sm mb-8">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
          <i className="fas fa-arrow-left mr-2"></i>Back
        </button>
        <div className="text-xl font-black tracking-widest">
          {winner ? (
            <span className="text-green-400">Winner: {winner}</span>
          ) : isDraw ? (
            <span className="text-yellow-400">Draw!</span>
          ) : (
            <span>Next Player: <span className={xIsNext ? 'text-cyan-400' : 'text-pink-400'}>{xIsNext ? 'X' : 'O'}</span></span>
          )}
        </div>
        <button onClick={resetGame} className="text-white/50 hover:text-white transition-colors">
          <i className="fas fa-redo"></i>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {board.map((square, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-5xl font-black transition-all ${
              square === 'X' ? 'text-cyan-400' : square === 'O' ? 'text-pink-400' : 'hover:bg-white/10'
            }`}
          >
            {square}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChessGame = ({ onBack }: { onBack: () => void }) => {
  const [game, setGame] = useState(new Chess());

  const makeMove = (move: any) => {
    try {
      const result = game.move(move);
      setGame(new Chess(game.fen()));
      return result;
    } catch (e) {
      return null;
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    if (move === null) return false;
    
    // AI random move
    setTimeout(() => {
      const moves = game.moves();
      if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        makeMove(move);
      }
    }, 300);
    return true;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between w-full mb-8">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
          <i className="fas fa-arrow-left mr-2"></i>Back
        </button>
        <div className="text-lg font-black tracking-widest">
          {game.isGameOver() ? 'Game Over' : game.turn() === 'w' ? 'Your Turn' : 'AI Thinking...'}
        </div>
        <button onClick={() => setGame(new Chess())} className="text-white/50 hover:text-white transition-colors">
          <i className="fas fa-redo mr-2"></i>Reset
        </button>
      </div>
      
      <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 shadow-2xl">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          customBoardStyle={{
            borderRadius: '0.5rem',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
          }}
          customDarkSquareStyle={{ backgroundColor: '#475569' }}
          customLightSquareStyle={{ backgroundColor: '#94a3b8' }}
        />
      </div>
    </div>
  );
};
