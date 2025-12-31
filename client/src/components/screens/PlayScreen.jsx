import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import MinesweeperBoard from '../game/MinesweeperBoard';
import OpponentPreview from '../game/OpponentPreview';

const PlayScreen = () => {
  const { state, clickCell, flagCell, chordCell, leaveRoom } = useGame();
  const { socket } = useSocket();
  const [elapsedTime, setElapsedTime] = useState(0);

  const room = state.room;
  const opponent = room?.players?.find(p => p.id !== socket?.id);
  const currentPlayer = room?.players?.find(p => p.id === socket?.id);

  // Timer
  useEffect(() => {
    if (state.startTime && state.gameState === 'playing') {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state.startTime, state.gameState]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cell click
  const handleCellClick = useCallback((x, y, e) => {
    if (state.gameState !== 'playing') return;
    
    // Middle click or both buttons for chord
    if (e.button === 1 || (e.buttons === 3)) {
      chordCell(x, y);
      return;
    }
    
    clickCell(x, y);
  }, [clickCell, chordCell, state.gameState]);

  // Handle right click (flag)
  const handleCellRightClick = useCallback((x, y, e) => {
    e.preventDefault();
    if (state.gameState !== 'playing') return;
    flagCell(x, y);
  }, [flagCell, state.gameState]);

  // Handle double click (chord)
  const handleCellDoubleClick = useCallback((x, y) => {
    if (state.gameState !== 'playing') return;
    chordCell(x, y);
  }, [chordCell, state.gameState]);

  // Calculate flags used
  const flagsUsed = state.board?.flat().filter(c => c.flagged).length || 0;

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="card p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span className="text-2xl font-mono font-bold text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>

            {/* Game Info */}
            <div className="flex items-center gap-4">
              <div className="text-white">
                <span className="text-gray-400">💣</span>
                <span className="ml-2 font-bold">{state.mineCount}</span>
              </div>
              <div className="text-white">
                <span className="text-gray-400">🚩</span>
                <span className="ml-2 font-bold">{flagsUsed}</span>
              </div>
            </div>

            {/* Leave Button */}
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              🚪 나가기
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* My Board */}
          <div className="lg:col-span-2">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span>🎮</span>
                  <span>내 보드</span>
                  <span className="text-sm text-gray-400">({state.nickname})</span>
                </h3>
                {state.gameState === 'won' && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    🎉 클리어!
                  </span>
                )}
                {state.gameState === 'lost' && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                    💥 폭발!
                  </span>
                )}
              </div>

              {/* Board */}
              <div className="overflow-auto">
                <MinesweeperBoard
                  board={state.board}
                  onCellClick={handleCellClick}
                  onCellRightClick={handleCellRightClick}
                  onCellDoubleClick={handleCellDoubleClick}
                  disabled={state.gameState !== 'playing'}
                />
              </div>
            </div>
          </div>

          {/* Opponent Area */}
          <div className="lg:col-span-1">
            <div className="card p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span>👤</span>
                  <span>상대방</span>
                  <span className="text-sm text-gray-400">({opponent?.nickname || '...'})</span>
                </h3>
              </div>

              {/* Opponent Preview */}
              <OpponentPreview
                progress={state.opponentProgress?.progress}
                boardSize={state.boardSize}
              />

              {/* Opponent Stats */}
              <div className="mt-4 space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">진행률</span>
                    <span className="text-white font-bold">
                      {state.opponentProgress?.progress?.progress || 0}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${state.opponentProgress?.progress?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-gray-400 text-sm">🚩 깃발</div>
                    <div className="text-white font-bold text-lg">
                      {state.opponentProgress?.progress?.flagged || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-gray-400 text-sm">📊 열린 셀</div>
                    <div className="text-white font-bold text-lg">
                      {state.opponentProgress?.progress?.revealed || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spectator Count */}
              {room?.spectatorCount > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>👀</span>
                    <span className="text-sm">{room.spectatorCount}명이 관전 중</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="max-w-7xl mx-auto mt-4">
        <div className="card p-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span>🖱️ 좌클릭: 열기</span>
            <span>🖱️ 우클릭: 깃발</span>
            <span>🖱️ 더블클릭/휠클릭: 자동 열기</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayScreen;
