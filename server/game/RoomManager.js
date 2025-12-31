/**
 * Room Manager
 * Handles room creation, player management, and game state
 */

const { MinesweeperGame, DIFFICULTIES } = require('./MinesweeperGame');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map(); // Maps socket ID to room code
  }

  /**
   * Generate a unique 6-character room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Create a new room
   * @param {string} hostId - Socket ID of the host
   * @param {string} nickname - Host's nickname
   * @returns {Object} Room info
   */
  createRoom(hostId, nickname) {
    const code = this.generateRoomCode();
    const room = {
      code,
      host: hostId,
      players: [
        {
          id: hostId,
          nickname: nickname || 'Player 1',
          ready: false,
          game: null,
          stats: { clicks: 0, flags: 0 }
        }
      ],
      spectators: [],
      difficulty: 'beginner',
      status: 'waiting', // waiting, playing, finished
      startTime: null,
      mineBoard: null // Shared mine positions
    };

    this.rooms.set(code, room);
    this.playerRooms.set(hostId, code);

    return {
      code,
      room: this.getRoomInfo(code)
    };
  }

  /**
   * Join an existing room as a player
   * @param {string} roomCode - Room code
   * @param {string} playerId - Socket ID
   * @param {string} nickname - Player's nickname
   * @returns {Object} { success, room, error }
   */
  joinRoom(roomCode, playerId, nickname) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    if (room.players.length >= 2) {
      return { success: false, error: 'Room is full' };
    }

    if (room.players.find(p => p.id === playerId)) {
      return { success: false, error: 'Already in room' };
    }

    room.players.push({
      id: playerId,
      nickname: nickname || 'Player 2',
      ready: false,
      game: null,
      stats: { clicks: 0, flags: 0 }
    });

    this.playerRooms.set(playerId, roomCode);

    return {
      success: true,
      room: this.getRoomInfo(roomCode)
    };
  }

  /**
   * Join a room as a spectator
   * @param {string} roomCode - Room code
   * @param {string} spectatorId - Socket ID
   * @param {string} nickname - Spectator's nickname
   * @returns {Object} { success, room, error }
   */
  joinAsSpectator(roomCode, spectatorId, nickname) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.spectators.length >= 10) {
      return { success: false, error: 'Too many spectators' };
    }

    if (room.spectators.find(s => s.id === spectatorId)) {
      return { success: false, error: 'Already spectating' };
    }

    room.spectators.push({
      id: spectatorId,
      nickname: nickname || 'Spectator',
      joinedAt: Date.now()
    });

    this.playerRooms.set(spectatorId, roomCode);

    return {
      success: true,
      room: this.getRoomInfo(roomCode),
      isSpectator: true
    };
  }

  /**
   * Leave a room
   * @param {string} participantId - Socket ID
   * @returns {Object} { roomCode, wasHost, wasPlayer, room }
   */
  leaveRoom(participantId) {
    const roomCode = this.playerRooms.get(participantId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.playerRooms.delete(participantId);
      return null;
    }

    // Check if leaving as spectator
    const spectatorIndex = room.spectators.findIndex(s => s.id === participantId);
    if (spectatorIndex !== -1) {
      room.spectators.splice(spectatorIndex, 1);
      this.playerRooms.delete(participantId);
      return { roomCode, wasSpectator: true, room: this.getRoomInfo(roomCode) };
    }

    // Check if leaving as player
    const playerIndex = room.players.findIndex(p => p.id === participantId);
    if (playerIndex === -1) {
      this.playerRooms.delete(participantId);
      return null;
    }

    const wasHost = room.host === participantId;
    room.players.splice(playerIndex, 1);
    this.playerRooms.delete(participantId);

    // If no players left, delete room
    if (room.players.length === 0) {
      // Also remove all spectators
      room.spectators.forEach(s => this.playerRooms.delete(s.id));
      this.rooms.delete(roomCode);
      return { roomCode, wasHost, wasPlayer: true, roomDeleted: true };
    }

    // Transfer host if needed
    if (wasHost && room.players.length > 0) {
      room.host = room.players[0].id;
    }

    // If game was in progress, end it
    if (room.status === 'playing') {
      room.status = 'finished';
      const remainingPlayer = room.players[0];
      return {
        roomCode,
        wasHost,
        wasPlayer: true,
        room: this.getRoomInfo(roomCode),
        gameEnded: true,
        winner: remainingPlayer.id
      };
    }

    return { roomCode, wasHost, wasPlayer: true, room: this.getRoomInfo(roomCode) };
  }

  /**
   * Set room difficulty (host only)
   */
  setDifficulty(roomCode, playerId, difficulty) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.host !== playerId) return { success: false, error: 'Not the host' };
    if (room.status !== 'waiting') return { success: false, error: 'Game already started' };
    if (!DIFFICULTIES[difficulty]) return { success: false, error: 'Invalid difficulty' };

    room.difficulty = difficulty;
    return { success: true, difficulty };
  }

  /**
   * Toggle player ready status
   */
  toggleReady(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not in room' };

    player.ready = !player.ready;
    return { success: true, ready: player.ready, playerId };
  }

  /**
   * Check if game can start
   */
  canStartGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (room.players.length !== 2) return false;
    return room.players.every(p => p.ready);
  }

  /**
   * Start the game
   */
  startGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (!this.canStartGame(roomCode)) {
      return { success: false, error: 'Cannot start game' };
    }

    const diff = DIFFICULTIES[room.difficulty];
    
    // Create game instances for each player
    // Both players get the same board configuration
    room.players.forEach(player => {
      player.game = new MinesweeperGame(diff.width, diff.height, diff.mines);
      player.stats = { clicks: 0, flags: 0 };
    });

    room.status = 'playing';
    room.startTime = Date.now();

    return {
      success: true,
      startTime: room.startTime,
      difficulty: room.difficulty,
      boardSize: { width: diff.width, height: diff.height },
      mineCount: diff.mines
    };
  }

  /**
   * Handle cell click
   */
  handleCellClick(roomCode, playerId, x, y) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.status !== 'playing') return { success: false, error: 'Game not in progress' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not in room' };
    if (!player.game) return { success: false, error: 'Game not initialized' };

    // Synchronize first click for both players (same mine layout)
    if (!player.game.initialized) {
      // If this is the first player to click, generate board for all players
      const otherPlayer = room.players.find(p => p.id !== playerId);
      
      player.game.initializeBoard(x, y);
      
      // Copy mine positions to other player's game
      if (otherPlayer && otherPlayer.game && !otherPlayer.game.initialized) {
        otherPlayer.game.mines = new Set(player.game.mines);
        otherPlayer.game.board = JSON.parse(JSON.stringify(player.game.board));
        // Reset revealed/flagged state for other player
        for (let row of otherPlayer.game.board) {
          for (let cell of row) {
            cell.revealed = false;
            cell.flagged = false;
          }
        }
        otherPlayer.game.initialized = true;
      }
    }

    player.stats.clicks++;
    const result = player.game.revealCell(x, y);

    return {
      success: true,
      ...result,
      playerId,
      stats: player.stats,
      playerView: player.game.getPlayerView(),
      progress: player.game.getProgress()
    };
  }

  /**
   * Handle flag toggle
   */
  handleFlag(roomCode, playerId, x, y) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.status !== 'playing') return { success: false, error: 'Game not in progress' };

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.game) return { success: false, error: 'Player not found' };

    const result = player.game.toggleFlag(x, y);
    if (result.success) {
      player.stats.flags += result.flagged ? 1 : -1;
    }

    return {
      success: true,
      ...result,
      playerId,
      stats: player.stats,
      playerView: player.game.getPlayerView(),
      progress: player.game.getProgress()
    };
  }

  /**
   * Handle chord action
   */
  handleChord(roomCode, playerId, x, y) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.status !== 'playing') return { success: false, error: 'Game not in progress' };

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.game) return { success: false, error: 'Player not found' };

    player.stats.clicks++;
    const result = player.game.chord(x, y);

    return {
      success: true,
      ...result,
      playerId,
      stats: player.stats,
      playerView: player.game.getPlayerView(),
      progress: player.game.getProgress()
    };
  }

  /**
   * End the game and determine winner
   */
  endGame(roomCode, winnerId, reason) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    room.status = 'finished';
    const endTime = Date.now();
    const duration = endTime - room.startTime;

    const results = {
      winner: winnerId,
      reason,
      duration,
      players: room.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        stats: p.stats,
        progress: p.game ? p.game.getProgress() : null,
        won: p.id === winnerId,
        fullBoard: p.game ? p.game.getFullBoard() : null
      }))
    };

    return results;
  }

  /**
   * Get room info (safe to send to clients)
   */
  getRoomInfo(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    return {
      code: room.code,
      host: room.host,
      players: room.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        ready: p.ready,
        progress: p.game ? p.game.getProgress() : null
      })),
      spectators: room.spectators.map(s => ({
        id: s.id,
        nickname: s.nickname
      })),
      spectatorCount: room.spectators.length,
      difficulty: room.difficulty,
      status: room.status,
      startTime: room.startTime
    };
  }

  /**
   * Get spectator view (both player boards)
   */
  getSpectatorView(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing') return null;

    return room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      progress: p.game ? p.game.getProgress() : null,
      stats: p.stats
    }));
  }

  /**
   * Get player's room code
   */
  getPlayerRoom(playerId) {
    return this.playerRooms.get(playerId);
  }

  /**
   * Check if player is spectator
   */
  isSpectator(roomCode, participantId) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    return room.spectators.some(s => s.id === participantId);
  }

  /**
   * Reset room for rematch
   */
  resetForRematch(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    room.status = 'waiting';
    room.startTime = null;
    room.players.forEach(p => {
      p.ready = false;
      p.game = null;
      p.stats = { clicks: 0, flags: 0 };
    });

    return { success: true, room: this.getRoomInfo(roomCode) };
  }
}

module.exports = RoomManager;
