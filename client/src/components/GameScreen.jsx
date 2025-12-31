import React from 'react';
import { useGame } from '../context/GameContext';
import { useSocket } from '../context/SocketContext';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import PlayScreen from './screens/PlayScreen';
import ResultScreen from './screens/ResultScreen';
import SpectateScreen from './screens/SpectateScreen';

const GameScreen = () => {
  const { state } = useGame();
  const { connected } = useSocket();

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-xs text-white/70">
        {connected ? '연결됨' : '연결 끊김'}
      </span>
    </div>
  );

  // Error toast
  const ErrorToast = () => {
    const { clearError } = useGame();
    
    if (!state.error) return null;

    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-shake">
        <span>⚠️</span>
        <span>{state.error}</span>
        <button 
          onClick={clearError}
          className="ml-2 hover:bg-red-600 rounded p-1"
        >
          ✕
        </button>
      </div>
    );
  };

  // Render current screen
  const renderScreen = () => {
    switch (state.screen) {
      case 'home':
        return <HomeScreen />;
      case 'lobby':
        return <LobbyScreen />;
      case 'game':
        return <PlayScreen />;
      case 'result':
        return <ResultScreen />;
      case 'spectate':
        return <SpectateScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="relative min-h-screen">
      <ConnectionStatus />
      {renderScreen()}
      <ErrorToast />
    </div>
  );
};

export default GameScreen;
