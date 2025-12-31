import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';

const DIFFICULTIES = {
  beginner: { name: '초급', size: '9×9', mines: 10, icon: '🌱' },
  intermediate: { name: '중급', size: '16×16', mines: 40, icon: '🌿' },
  expert: { name: '고급', size: '30×16', mines: 99, icon: '🌳' }
};

const LobbyScreen = () => {
  const { state, setDifficulty, toggleReady, startGame, leaveRoom } = useGame();
  const { socket } = useSocket();
  const [copied, setCopied] = useState(false);

  const room = state.room;
  const isHost = state.isHost;
  const isSpectator = state.isSpectator;
  const currentPlayer = room?.players?.find(p => p.id === socket?.id);
  const opponent = room?.players?.find(p => p.id !== socket?.id);
  const allReady = room?.players?.length === 2 && room.players.every(p => p.ready);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDifficultyChange = (diff) => {
    if (isHost && !isSpectator) {
      setDifficulty(diff);
    }
  };

  const handleStartGame = () => {
    if (isHost && allReady) {
      startGame();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSpectator ? '👀 관전 대기실' : '🎮 게임 대기실'}
          </h2>
          <p className="text-gray-400">
            {isSpectator ? '게임이 시작되면 관전할 수 있습니다' : '상대방을 기다리는 중...'}
          </p>
        </div>

        {/* Room Code */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="text-gray-400 text-sm mb-2 text-center">방 코드</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold text-white tracking-widest">
              {room?.code}
            </span>
            <button
              onClick={copyRoomCode}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
            >
              {copied ? '✓ 복사됨' : '📋 복사'}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">플레이어</h3>
          <div className="space-y-3">
            {/* Player 1 (Host) */}
            <div className={`bg-white/5 rounded-xl p-4 border-2 transition-all ${
              room?.players?.[0]?.ready ? 'border-green-500' : 'border-transparent'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <div className="text-white font-medium">
                      {room?.players?.[0]?.nickname || '대기 중...'}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {room?.players?.[0]?.id === socket?.id ? '(나)' : ''} 방장
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  room?.players?.[0]?.ready 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {room?.players?.[0]?.ready ? '준비 완료' : '대기 중'}
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div className={`bg-white/5 rounded-xl p-4 border-2 transition-all ${
              room?.players?.[1]?.ready ? 'border-green-500' : 'border-transparent'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎮</span>
                  <div>
                    <div className="text-white font-medium">
                      {room?.players?.[1]?.nickname || '대기 중...'}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {room?.players?.[1]?.id === socket?.id ? '(나)' : ''} 플레이어 2
                    </div>
                  </div>
                </div>
                {room?.players?.[1] && (
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    room?.players?.[1]?.ready 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {room?.players?.[1]?.ready ? '준비 완료' : '대기 중'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spectators */}
        {(room?.spectatorCount > 0 || isSpectator) && (
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">
              👀 관전자 ({room?.spectatorCount || 0}명)
            </h3>
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-gray-400 text-sm">
                {isSpectator && <span className="text-purple-400">나 (관전 중)</span>}
                {room?.spectators?.map((s, i) => (
                  <span key={s.id} className="ml-2">{s.nickname}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Difficulty Selection */}
        {!isSpectator && (
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">
              난이도 {!isHost && <span className="text-gray-500 text-sm">(방장만 변경 가능)</span>}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                <button
                  key={key}
                  onClick={() => handleDifficultyChange(key)}
                  disabled={!isHost}
                  className={`p-3 rounded-xl text-center transition-all ${
                    room?.difficulty === key
                      ? 'bg-blue-500 text-white'
                      : isHost
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-1">{diff.icon}</div>
                  <div className="font-medium">{diff.name}</div>
                  <div className="text-xs opacity-70">{diff.size}</div>
                  <div className="text-xs opacity-70">💣 {diff.mines}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isSpectator && (
            <>
              {/* Ready Button */}
              <button
                onClick={toggleReady}
                disabled={room?.players?.length < 2}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                  currentPlayer?.ready
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {currentPlayer?.ready ? '⏳ 준비 취소' : '✅ 준비 완료'}
              </button>

              {/* Start Button (Host only) */}
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!allReady}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allReady ? '🚀 게임 시작!' : '⏳ 모두 준비 대기 중...'}
                </button>
              )}
            </>
          )}

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="btn-danger w-full"
          >
            🚪 나가기
          </button>
        </div>

        {/* Waiting Message */}
        {!isSpectator && room?.players?.length < 2 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              상대방 참여를 기다리는 중...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;
