import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';

const HomeScreen = () => {
  const { state, setNickname, createRoom, joinRoom, spectateRoom } = useGame();
  const { connected } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [joinMode, setJoinMode] = useState('play'); // 'play' or 'spectate'

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
  };

  const handleCreateRoom = () => {
    if (!state.nickname.trim()) {
      alert('닉네임을 입력해주세요!');
      return;
    }
    createRoom();
  };

  const handleJoinRoom = () => {
    if (!state.nickname.trim()) {
      alert('닉네임을 입력해주세요!');
      return;
    }
    if (!roomCode.trim()) {
      alert('방 코드를 입력해주세요!');
      return;
    }
    if (joinMode === 'spectate') {
      spectateRoom(roomCode);
    } else {
      joinRoom(roomCode);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💣</div>
          <h1 className="text-3xl font-bold text-white mb-2">멀티플레이 지뢰찾기</h1>
          <p className="text-gray-400">친구와 실시간으로 대결하세요!</p>
        </div>

        {/* Nickname Input */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            닉네임
          </label>
          <input
            type="text"
            value={state.nickname}
            onChange={handleNicknameChange}
            placeholder="닉네임을 입력하세요"
            className="input"
            maxLength={12}
          />
        </div>

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          disabled={!connected || !state.nickname.trim()}
          className="btn-primary w-full mb-4"
        >
          🎮 방 만들기
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-gray-400 text-sm">또는</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        {/* Join Mode Toggle */}
        <div className="flex mb-4 bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setJoinMode('play')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              joinMode === 'play' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 플레이어로 참여
          </button>
          <button
            onClick={() => setJoinMode('spectate')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              joinMode === 'spectate' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👀 관전하기
          </button>
        </div>

        {/* Room Code Input */}
        <div className="mb-4">
          <label className="block text-white text-sm font-medium mb-2">
            방 코드
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="6자리 방 코드 입력"
            className="input uppercase tracking-widest text-center text-lg"
            maxLength={6}
          />
        </div>

        {/* Join Room Button */}
        <button
          onClick={handleJoinRoom}
          disabled={!connected || !state.nickname.trim() || !roomCode.trim()}
          className={`w-full ${joinMode === 'spectate' ? 'btn-secondary' : 'btn-success'}`}
        >
          {joinMode === 'spectate' ? '👀 관전 입장' : '🚀 방 참여'}
        </button>

        {/* Connection Warning */}
        {!connected && (
          <div className="mt-4 text-center text-yellow-400 text-sm">
            ⚠️ 서버에 연결 중입니다...
          </div>
        )}

        {/* How to Play */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-white font-medium mb-3 text-center">게임 방법</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span>🖱️</span>
              <span>좌클릭: 셀 열기</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🚩</span>
              <span>우클릭: 깃발 꽂기/제거</span>
            </li>
            <li className="flex items-start gap-2">
              <span>⚡</span>
              <span>양클릭: 주변 셀 자동 열기</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🏆</span>
              <span>상대보다 먼저 클리어하면 승리!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
