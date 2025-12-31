import React from 'react';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import GameScreen from './components/GameScreen';

function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <GameScreen />
        </div>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;
