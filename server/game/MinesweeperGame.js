/**
 * Minesweeper Game Logic
 * Handles board generation, cell operations, and win/lose conditions
 */

class MinesweeperGame {
  constructor(width, height, mineCount) {
    this.width = width;
    this.height = height;
    this.mineCount = mineCount;
    this.board = [];
    this.mines = new Set();
    this.initialized = false;
  }

  /**
   * Initialize the board with mines (called after first click)
   * @param {number} firstClickX - X coordinate of first click (safe zone)
   * @param {number} firstClickY - Y coordinate of first click (safe zone)
   */
  initializeBoard(firstClickX, firstClickY) {
    // Create empty board
    this.board = Array(this.height).fill(null).map(() =>
      Array(this.width).fill(null).map(() => ({
        isMine: false,
        adjacentMines: 0,
        revealed: false,
        flagged: false
      }))
    );

    // Place mines randomly, avoiding first click area
    const safeZone = this.getSafeZone(firstClickX, firstClickY);
    let minesPlaced = 0;

    while (minesPlaced < this.mineCount) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      const key = `${x},${y}`;

      if (!this.mines.has(key) && !safeZone.has(key)) {
        this.mines.add(key);
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mine counts
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.board[y][x].isMine) {
          this.board[y][x].adjacentMines = this.countAdjacentMines(x, y);
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Get safe zone around first click
   */
  getSafeZone(x, y) {
    const safeZone = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          safeZone.add(`${nx},${ny}`);
        }
      }
    }
    return safeZone;
  }

  /**
   * Count adjacent mines for a cell
   */
  countAdjacentMines(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (this.board[ny][nx].isMine) count++;
        }
      }
    }
    return count;
  }

  /**
   * Reveal a cell
   * @returns {Object} { success, gameOver, won, revealedCells }
   */
  revealCell(x, y) {
    // Initialize board on first click
    if (!this.initialized) {
      this.initializeBoard(x, y);
    }

    const cell = this.board[y]?.[x];
    if (!cell || cell.revealed || cell.flagged) {
      return { success: false, gameOver: false, won: false, revealedCells: [] };
    }

    const revealedCells = [];

    // Hit a mine
    if (cell.isMine) {
      cell.revealed = true;
      revealedCells.push({ x, y, isMine: true });
      return { success: true, gameOver: true, won: false, revealedCells };
    }

    // Flood fill for empty cells
    this.floodReveal(x, y, revealedCells);

    // Check for win
    const won = this.checkWin();

    return { success: true, gameOver: won, won, revealedCells };
  }

  /**
   * Flood fill reveal for empty cells
   */
  floodReveal(x, y, revealedCells) {
    const cell = this.board[y]?.[x];
    if (!cell || cell.revealed || cell.flagged || cell.isMine) return;

    cell.revealed = true;
    revealedCells.push({
      x,
      y,
      adjacentMines: cell.adjacentMines,
      isMine: false
    });

    // If cell has no adjacent mines, reveal neighbors
    if (cell.adjacentMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          this.floodReveal(x + dx, y + dy, revealedCells);
        }
      }
    }
  }

  /**
   * Toggle flag on a cell
   * @returns {Object} { success, flagged }
   */
  toggleFlag(x, y) {
    const cell = this.board[y]?.[x];
    if (!cell || cell.revealed) {
      return { success: false, flagged: false };
    }

    cell.flagged = !cell.flagged;
    return { success: true, flagged: cell.flagged };
  }

  /**
   * Chord action - reveal all adjacent cells if flag count matches
   * @returns {Object} { success, gameOver, won, revealedCells }
   */
  chord(x, y) {
    const cell = this.board[y]?.[x];
    if (!cell || !cell.revealed || cell.adjacentMines === 0) {
      return { success: false, gameOver: false, won: false, revealedCells: [] };
    }

    // Count adjacent flags
    let flagCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (this.board[ny][nx].flagged) flagCount++;
        }
      }
    }

    // If flag count doesn't match, do nothing
    if (flagCount !== cell.adjacentMines) {
      return { success: false, gameOver: false, won: false, revealedCells: [] };
    }

    // Reveal all unflagged adjacent cells
    const revealedCells = [];
    let gameOver = false;
    let hitMine = false;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const neighbor = this.board[ny][nx];
          if (!neighbor.revealed && !neighbor.flagged) {
            if (neighbor.isMine) {
              neighbor.revealed = true;
              revealedCells.push({ x: nx, y: ny, isMine: true });
              hitMine = true;
              gameOver = true;
            } else {
              this.floodReveal(nx, ny, revealedCells);
            }
          }
        }
      }
    }

    const won = !hitMine && this.checkWin();
    return { success: true, gameOver: gameOver || won, won, revealedCells };
  }

  /**
   * Check if game is won
   */
  checkWin() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.board[y][x];
        if (!cell.isMine && !cell.revealed) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get player's view of the board (hides unrevealed cells)
   */
  getPlayerView() {
    return this.board.map((row, y) =>
      row.map((cell, x) => ({
        x,
        y,
        revealed: cell.revealed,
        flagged: cell.flagged,
        adjacentMines: cell.revealed ? cell.adjacentMines : null,
        isMine: cell.revealed && cell.isMine ? true : null
      }))
    );
  }

  /**
   * Get progress information for opponent/spectator view
   */
  getProgress() {
    let revealed = 0;
    let flagged = 0;
    const totalSafe = this.width * this.height - this.mineCount;

    const revealedPositions = [];
    const flaggedPositions = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.board[y][x];
        if (cell.revealed && !cell.isMine) {
          revealed++;
          revealedPositions.push({ x, y });
        }
        if (cell.flagged) {
          flagged++;
          flaggedPositions.push({ x, y });
        }
      }
    }

    return {
      progress: totalSafe > 0 ? Math.round((revealed / totalSafe) * 100) : 0,
      revealed,
      totalSafe,
      flagged,
      revealedPositions,
      flaggedPositions
    };
  }

  /**
   * Get full board state (for game over reveal)
   */
  getFullBoard() {
    return this.board.map((row, y) =>
      row.map((cell, x) => ({
        x,
        y,
        revealed: cell.revealed,
        flagged: cell.flagged,
        adjacentMines: cell.adjacentMines,
        isMine: cell.isMine
      }))
    );
  }
}

// Difficulty presets
const DIFFICULTIES = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 }
};

module.exports = { MinesweeperGame, DIFFICULTIES };
