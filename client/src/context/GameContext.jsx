import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Initial state
const initialState = {
  screen: 'home', // home, lobby, game, result, spectate
  nickname: '',
  room: null,
  isHost: false,
  isSpectator: false,
  gameState: null,
  board: null,
  opponentProgress: null,
  gameResult: null,
  error: null,
  boardSize: null,
  mineCount: 0,
  startTime: null
};

// Action types
const ACTIONS = {
  SET_SCREEN: 'SET_SCREEN',
  SET_NICKNAME: 'SET_NICKNAME',
  SET_ROOM: 'SET_ROOM',
  SET_HOST: 'SET_HOST',
  SET_SPECTATOR: 'SET_SPECTATOR',
  UPDATE_ROOM: 'UPDATE_ROOM',
  SET_GAME_STATE: 'SET_GAME_STATE',
  UPDATE_BOARD: 'UPDATE_BOARD',
  SET_OPPONENT_PROGRESS: 'SET_OPPONENT_PROGRESS',
  SET_GAME_RESULT: 'SET_GAME_RESULT',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET',
  START_GAME: 'START_GAME'
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_SCREEN:
      return { ...state, screen: action.payload, error: null };
    case ACTIONS.SET_NICKNAME:
      return { ...state, nickname: action.payload };
    case ACTIONS.SET_ROOM:
      return { ...state, room: action.payload };
    case ACTIONS.SET_HOST:
      return { ...state, isHost: action.payload };
    case ACTIONS.SET_SPECTATOR:
      return { ...state, isSpectator: action.payload };
    case ACTIONS.UPDATE_ROOM:
      return { ...state, room: { ...state.room, ...action.payload } };
    case ACTIONS.SET_GAME_STATE:
      return { ...state, gameState: action.payload };
    case ACTIONS.UPDATE_BOARD:
      return { ...state, board: action.payload };
    case ACTIONS.SET_OPPONENT_PROGRESS:
      return { ...state, opponentProgress: action.payload };
    case ACTIONS.SET_GAME_RESULT:
      return { ...state, gameResult: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.START_GAME:
      return { 
        ...state, 
        screen: 'game',
        gameState: 'playing',
        boardSize: action.payload.boardSize,
        mineCount: action.payload.mineCount,
        startTime: action.payload.startTime,
        board: createEmptyBoard(action.payload.boardSize.width, action.payload.boardSize.height)
      };
    case ACTIONS.RESET:
      return { 
        ...initialState, 
        nickname: state.nickname 
      };
    default:
      return state;
  }
}

// Helper function to create empty board
function createEmptyBoard(width, height) {
  return Array(height).fill(null).map((_, y) =>
    Array(width).fill(null).map((_, x) => ({
      x,
      y,
      revealed: false,
      flagged: false,
      adjacentMines: null,
      isMine: null
    }))
  );
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket, on, emit } = useSocket();

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room created
    const unsubRoomCreated = on('room-created', ({ roomCode, room }) => {
      dispatch({ type: ACTIONS.SET_ROOM, payload: room });
      dispatch({ type: ACTIONS.SET_HOST, payload: true });
      dispatch({ type: ACTIONS.SET_SCREEN, payload: 'lobby' });
    });

    // Room joined
    const unsubRoomJoined = on('room-joined', ({ room }) => {
      dispatch({ type: ACTIONS.SET_ROOM, payload: room });
      dispatch({ type: ACTIONS.SET_HOST, payload: false });
      dispatch({ type: ACTIONS.SET_SCREEN, payload: 'lobby' });
    });

    // Spectate joined
    const unsubSpectateJoined = on('spectate-joined', ({ room, spectatorView }) => {
      dispatch({ type: ACTIONS.SET_ROOM, payload: room });
      dispatch({ type: ACTIONS.SET_SPECTATOR, payload: true });
      dispatch({ type: ACTIONS.SET_SCREEN, payload: room.status === 'playing' ? 'spectate' : 'lobby' });
    });

    // Player joined
    const unsubPlayerJoined = on('player-joined', ({ player }) => {
      dispatch({ type: ACTIONS.UPDATE_ROOM, payload: { 
        players: [...(state.room?.players || []), player] 
      }});
    });

    // Player left
    const unsubPlayerLeft = on('player-left', ({ playerId, room }) => {
      dispatch({ type: ACTIONS.SET_ROOM, payload: room });
    });

    // Ready changed
    const unsubReadyChanged = on('ready-changed', ({ playerId, ready }) => {
      dispatch({ type: ACTIONS.UPDATE_ROOM, payload: {
        players: state.room?.players?.map(p => 
          p.id === playerId ? { ...p, ready } : p
        ) || []
      }});
    });

    // Difficulty changed
    const unsubDifficultyChanged = on('difficulty-changed', ({ difficulty }) => {
      dispatch({ type: ACTIONS.UPDATE_ROOM, payload: { difficulty } });
    });

    // Game started
    const unsubGameStarted = on('game-started', (data) => {
      dispatch({ type: ACTIONS.START_GAME, payload: data });
    });

    // Board update
    const unsubBoardUpdate = on('board-update', ({ cells, playerView, gameOver, won }) => {
      if (playerView) {
        dispatch({ type: ACTIONS.UPDATE_BOARD, payload: playerView });
      }
      if (gameOver) {
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: won ? 'won' : 'lost' });
      }
    });

    // Opponent update
    const unsubOpponentUpdate = on('opponent-update', ({ playerId, progress, stats }) => {
      dispatch({ type: ACTIONS.SET_OPPONENT_PROGRESS, payload: { playerId, progress, stats } });
    });

    // Game over
    const unsubGameOver = on('game-over', (result) => {
      dispatch({ type: ACTIONS.SET_GAME_RESULT, payload: result });
      dispatch({ type: ACTIONS.SET_SCREEN, payload: 'result' });
    });

    // Rematch started
    const unsubRematchStarted = on('rematch-started', ({ room }) => {
      dispatch({ type: ACTIONS.SET_ROOM, payload: room });
      dispatch({ type: ACTIONS.SET_GAME_STATE, payload: null });
      dispatch({ type: ACTIONS.SET_GAME_RESULT, payload: null });
      dispatch({ type: ACTIONS.UPDATE_BOARD, payload: null });
      dispatch({ type: ACTIONS.SET_OPPONENT_PROGRESS, payload: null });
      dispatch({ type: ACTIONS.SET_SCREEN, payload: 'lobby' });
    });

    // Spectator events
    const unsubSpectatorJoined = on('spectator-joined', ({ spectator, count }) => {
      dispatch({ type: ACTIONS.UPDATE_ROOM, payload: { spectatorCount: count } });
    });

    const unsubSpectatorLeft = on('spectator-left', ({ spectatorId, count }) => {
      dispatch({ type: ACTIONS.UPDATE_ROOM, payload: { spectatorCount: count } });
    });

    // Error
    const unsubError = on('error', ({ message }) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: message });
    });

    return () => {
      unsubRoomCreated();
      unsubRoomJoined();
      unsubSpectateJoined();
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubReadyChanged();
      unsubDifficultyChanged();
      unsubGameStarted();
      unsubBoardUpdate();
      unsubOpponentUpdate();
      unsubGameOver();
      unsubRematchStarted();
      unsubSpectatorJoined();
      unsubSpectatorLeft();
      unsubError();
    };
  }, [socket, on, state.room?.players]);

  // Actions
  const actions = {
    setNickname: useCallback((nickname) => {
      dispatch({ type: ACTIONS.SET_NICKNAME, payload: nickname });
    }, []),

    createRoom: useCallback(() => {
      emit('create-room', { nickname: state.nickname });
    }, [emit, state.nickname]),

    joinRoom: useCallback((roomCode) => {
      emit('join-room', { roomCode: roomCode.toUpperCase(), nickname: state.nickname });
    }, [emit, state.nickname]),

    spectateRoom: useCallback((roomCode) => {
      emit('spectate-room', { roomCode: roomCode.toUpperCase(), nickname: state.nickname });
    }, [emit, state.nickname]),

    setDifficulty: useCallback((difficulty) => {
      emit('set-difficulty', { difficulty });
    }, [emit]),

    toggleReady: useCallback(() => {
      emit('player-ready');
    }, [emit]),

    startGame: useCallback(() => {
      emit('start-game');
    }, [emit]),

    clickCell: useCallback((x, y) => {
      emit('cell-click', { x, y });
    }, [emit]),

    flagCell: useCallback((x, y) => {
      emit('cell-flag', { x, y });
    }, [emit]),

    chordCell: useCallback((x, y) => {
      emit('cell-chord', { x, y });
    }, [emit]),

    leaveRoom: useCallback(() => {
      emit('leave-room');
      dispatch({ type: ACTIONS.RESET });
    }, [emit]),

    requestRematch: useCallback(() => {
      emit('request-rematch');
    }, [emit]),

    clearError: useCallback(() => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    }, []),

    goHome: useCallback(() => {
      emit('leave-room');
      dispatch({ type: ACTIONS.RESET });
    }, [emit])
  };

  return (
    <GameContext.Provider value={{ state, ...actions }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
