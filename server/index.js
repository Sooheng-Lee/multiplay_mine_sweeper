/**
 * Multiplayer Minesweeper Server
 * Express + Socket.IO backend
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const RoomManager = require('./game/RoomManager');

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? false 
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Room manager instance
const roomManager = new RoomManager();

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', ({ nickname }) => {
    try {
      const { code, room } = roomManager.createRoom(socket.id, nickname);
      socket.join(code);
      socket.emit('room-created', { roomCode: code, room });
      console.log(`[Room] Created room ${code} by ${nickname}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create room' });
      console.error('[Error] Create room:', error);
    }
  });

  // Join an existing room as player
  socket.on('join-room', ({ roomCode, nickname }) => {
    try {
      const result = roomManager.joinRoom(roomCode.toUpperCase(), socket.id, nickname);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(roomCode.toUpperCase());
      socket.emit('room-joined', { room: result.room });
      
      // Notify other players
      socket.to(roomCode.toUpperCase()).emit('player-joined', {
        player: { id: socket.id, nickname, ready: false }
      });
      
      console.log(`[Room] ${nickname} joined room ${roomCode}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
      console.error('[Error] Join room:', error);
    }
  });

  // Join as spectator
  socket.on('spectate-room', ({ roomCode, nickname }) => {
    try {
      const result = roomManager.joinAsSpectator(roomCode.toUpperCase(), socket.id, nickname);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(roomCode.toUpperCase());
      socket.emit('spectate-joined', { 
        room: result.room,
        spectatorView: roomManager.getSpectatorView(roomCode.toUpperCase())
      });
      
      // Notify room
      io.to(roomCode.toUpperCase()).emit('spectator-joined', {
        spectator: { id: socket.id, nickname },
        count: result.room.spectatorCount
      });
      
      console.log(`[Room] ${nickname} spectating room ${roomCode}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to spectate room' });
      console.error('[Error] Spectate room:', error);
    }
  });

  // Set difficulty (host only)
  socket.on('set-difficulty', ({ difficulty }) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      const result = roomManager.setDifficulty(roomCode, socket.id, difficulty);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      io.to(roomCode).emit('difficulty-changed', { difficulty });
      console.log(`[Room] ${roomCode} difficulty set to ${difficulty}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to set difficulty' });
      console.error('[Error] Set difficulty:', error);
    }
  });

  // Toggle ready status
  socket.on('player-ready', () => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      const result = roomManager.toggleReady(roomCode, socket.id);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      io.to(roomCode).emit('ready-changed', {
        playerId: socket.id,
        ready: result.ready
      });

      // Check if game can start
      if (roomManager.canStartGame(roomCode)) {
        io.to(roomCode).emit('can-start', { canStart: true });
      }
      
      console.log(`[Room] ${socket.id} ready: ${result.ready}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle ready' });
      console.error('[Error] Toggle ready:', error);
    }
  });

  // Start game
  socket.on('start-game', () => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      const result = roomManager.startGame(roomCode);
      
      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      io.to(roomCode).emit('game-started', {
        startTime: result.startTime,
        difficulty: result.difficulty,
        boardSize: result.boardSize,
        mineCount: result.mineCount
      });
      
      console.log(`[Game] Started in room ${roomCode}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to start game' });
      console.error('[Error] Start game:', error);
    }
  });

  // Cell click
  socket.on('cell-click', ({ x, y }) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) return;

      const result = roomManager.handleCellClick(roomCode, socket.id, x, y);
      
      if (!result.success) return;

      // Send full board update to clicking player
      socket.emit('board-update', {
        cells: result.revealedCells,
        playerView: result.playerView,
        gameOver: result.gameOver,
        won: result.won
      });

      // Send progress to opponent and spectators
      socket.to(roomCode).emit('opponent-update', {
        playerId: socket.id,
        progress: result.progress,
        stats: result.stats
      });

      // Handle game over
      if (result.gameOver) {
        handleGameOver(roomCode, socket.id, result.won);
      }
    } catch (error) {
      console.error('[Error] Cell click:', error);
    }
  });

  // Flag toggle
  socket.on('cell-flag', ({ x, y }) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) return;

      const result = roomManager.handleFlag(roomCode, socket.id, x, y);
      
      if (!result.success) return;

      socket.emit('board-update', {
        cells: [{ x, y, flagged: result.flagged }],
        playerView: result.playerView
      });

      socket.to(roomCode).emit('opponent-update', {
        playerId: socket.id,
        progress: result.progress,
        stats: result.stats
      });
    } catch (error) {
      console.error('[Error] Cell flag:', error);
    }
  });

  // Chord action
  socket.on('cell-chord', ({ x, y }) => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) return;

      const result = roomManager.handleChord(roomCode, socket.id, x, y);
      
      if (!result.success) return;

      socket.emit('board-update', {
        cells: result.revealedCells,
        playerView: result.playerView,
        gameOver: result.gameOver,
        won: result.won
      });

      socket.to(roomCode).emit('opponent-update', {
        playerId: socket.id,
        progress: result.progress,
        stats: result.stats
      });

      if (result.gameOver) {
        handleGameOver(roomCode, socket.id, result.won);
      }
    } catch (error) {
      console.error('[Error] Cell chord:', error);
    }
  });

  // Request rematch
  socket.on('request-rematch', () => {
    try {
      const roomCode = roomManager.getPlayerRoom(socket.id);
      if (!roomCode) return;

      const result = roomManager.resetForRematch(roomCode);
      
      if (result.success) {
        io.to(roomCode).emit('rematch-started', { room: result.room });
        console.log(`[Game] Rematch in room ${roomCode}`);
      }
    } catch (error) {
      console.error('[Error] Request rematch:', error);
    }
  });

  // Leave room
  socket.on('leave-room', () => {
    handleLeaveRoom(socket);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    handleLeaveRoom(socket);
  });

  // Helper function to handle game over
  function handleGameOver(roomCode, playerId, won) {
    const winnerId = won ? playerId : 
      roomManager.rooms.get(roomCode)?.players.find(p => p.id !== playerId)?.id;
    
    const reason = won ? 'completed' : 'hit_mine';
    const results = roomManager.endGame(roomCode, winnerId, reason);
    
    if (results) {
      io.to(roomCode).emit('game-over', results);
      console.log(`[Game] Over in room ${roomCode}, winner: ${winnerId}`);
    }
  }

  // Helper function to handle leaving room
  function handleLeaveRoom(socket) {
    const result = roomManager.leaveRoom(socket.id);
    if (!result) return;

    socket.leave(result.roomCode);

    if (result.roomDeleted) {
      console.log(`[Room] ${result.roomCode} deleted`);
      return;
    }

    if (result.wasSpectator) {
      io.to(result.roomCode).emit('spectator-left', {
        spectatorId: socket.id,
        count: result.room.spectatorCount
      });
    } else if (result.wasPlayer) {
      io.to(result.roomCode).emit('player-left', {
        playerId: socket.id,
        room: result.room
      });

      if (result.gameEnded) {
        const results = roomManager.endGame(result.roomCode, result.winner, 'opponent_left');
        if (results) {
          io.to(result.roomCode).emit('game-over', results);
        }
      }
    }

    console.log(`[Room] ${socket.id} left ${result.roomCode}`);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Multiplayer Minesweeper server running on port ${PORT}`);
});

module.exports = { app, server, io };
