import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import OpponentPreview from '../game/OpponentPreview';

const SpectateScreen = () => {
  const { state, leaveRoom } = useGame();
  const { socket } = useSocket();
  const [elapsedTime, setElapsedTime] = useState(0);

  const room = state.room;
  const players = room?.players || [];

  // Timer
  useEffect(() => {
    if (state.startTime && room?.status === 'playing') {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state.startTime, room?.status]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="card p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Spectate Badge */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                👀 관전 모드
              </span>
              <span className="text-gray-400">방 코드: {room?.code}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span className="text-2xl font-mono font-bold text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>

            {/* Spectator Count */}
            <div className="flex items-center gap-2 text-gray-400">
              <span>👀</span>
              <span>{room?.spectatorCount || 1}명 관전 중</span>
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

      {/* Player Boards */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player, index) => (
            <div key={player.id} className="card p-4">
              {/* Player Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span>{index === 0 ? '👑' : '🎮'}</span>
                  <span>{player.nickname}</span>
                </h3>
                <div className="text-gray-400 text-sm">
                  플레이어 {index + 1}
                </div>
              </div>

              {/* Board Preview */}
              <div className="mb-4">
                <OpponentPreview
                  progress={player.progress}
                  boardSize={state.boardSize}
                  large={true}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-sm">진행률</div>
                  <div className="text-white font-bold text-lg">
                    {player.progress?.progress || 0}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-sm">🚩 깃발</div>
                  <div className="text-white font-bold text-lg">
                    {player.progress?.flagged || 0}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-sm">📊 열린 셀</div>
                  <div className="text-white font-bold text-lg">
                    {player.progress?.revealed || 0}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="progress-bar h-3">
                  <div 
                    className="progress-fill"
                    style={{ width: `${player.progress?.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Info */}
      <div className="max-w-6xl mx-auto mt-4">
        <div className="card p-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span>💣 지뢰: {state.mineCount || '?'}개</span>
            <span>📐 크기: {state.boardSize?.width || '?'} × {state.boardSize?.height || '?'}</span>
            <span>🎯 난이도: {room?.difficulty || '?'}</span>
          </div>
        </div>
      </div>

      {/* Waiting for game start message */}
      {room?.status === 'waiting' && (
        <div className="max-w-6xl mx-auto mt-4">
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-white text-xl font-bold mb-2">게임 대기 중</h3>
            <p className="text-gray-400">플레이어들이 준비하고 있습니다...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpectateScreen;
