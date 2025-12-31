import React from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';

const ResultScreen = () => {
  const { state, requestRematch, goHome } = useGame();
  const { socket } = useSocket();

  const result = state.gameResult;
  const isWinner = result?.winner === socket?.id;
  const myResult = result?.players?.find(p => p.id === socket?.id);
  const opponentResult = result?.players?.find(p => p.id !== socket?.id);

  // Format duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  // Get reason text
  const getReasonText = (reason) => {
    switch (reason) {
      case 'completed':
        return '모든 셀 클리어!';
      case 'hit_mine':
        return '지뢰 폭발 💥';
      case 'opponent_left':
        return '상대방 퇴장';
      default:
        return '게임 종료';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-lg">
        {/* Result Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {isWinner ? '🏆' : '😢'}
          </div>
          <h1 className={`text-4xl font-bold mb-2 ${
            isWinner ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {isWinner ? '승리!' : '패배'}
          </h1>
          <p className="text-gray-400">{getReasonText(result?.reason)}</p>
        </div>

        {/* Game Stats */}
        <div className="mb-8">
          <h3 className="text-white font-medium mb-4 text-center">게임 통계</h3>
          
          {/* Duration */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
            <div className="text-gray-400 text-sm mb-1">게임 시간</div>
            <div className="text-white text-2xl font-bold">
              {formatDuration(result?.duration || 0)}
            </div>
          </div>

          {/* Player Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* My Stats */}
            <div className={`rounded-xl p-4 ${
              isWinner ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5'
            }`}>
              <div className="text-center mb-3">
                <div className="text-2xl mb-1">{isWinner ? '👑' : '🎮'}</div>
                <div className="text-white font-medium truncate">
                  {myResult?.nickname}
                </div>
                <div className="text-gray-400 text-sm">(나)</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">진행률</span>
                  <span className="text-white font-medium">
                    {myResult?.progress?.progress || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">클릭 수</span>
                  <span className="text-white font-medium">
                    {myResult?.stats?.clicks || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">깃발 수</span>
                  <span className="text-white font-medium">
                    {myResult?.stats?.flags || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Opponent Stats */}
            <div className={`rounded-xl p-4 ${
              !isWinner ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5'
            }`}>
              <div className="text-center mb-3">
                <div className="text-2xl mb-1">{!isWinner ? '👑' : '👤'}</div>
                <div className="text-white font-medium truncate">
                  {opponentResult?.nickname}
                </div>
                <div className="text-gray-400 text-sm">(상대)</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">진행률</span>
                  <span className="text-white font-medium">
                    {opponentResult?.progress?.progress || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">클릭 수</span>
                  <span className="text-white font-medium">
                    {opponentResult?.stats?.clicks || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">깃발 수</span>
                  <span className="text-white font-medium">
                    {opponentResult?.stats?.flags || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={requestRematch}
            className="btn-primary w-full"
          >
            🔄 재대결
          </button>
          <button
            onClick={goHome}
            className="btn-secondary w-full"
          >
            🏠 메인으로
          </button>
        </div>

        {/* Confetti effect for winner */}
        {isWinner && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['🎉', '🎊', '✨', '⭐'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultScreen;
