import React, { memo, useRef, useCallback, useState } from 'react';

// Number colors
const NUMBER_COLORS = {
  1: 'text-blue-500',
  2: 'text-green-500',
  3: 'text-red-500',
  4: 'text-blue-800',
  5: 'text-red-800',
  6: 'text-cyan-500',
  7: 'text-black',
  8: 'text-gray-500'
};

// Single cell component (memoized for performance)
const Cell = memo(({ 
  cell, 
  disabled,
  onMouseDown,
  onMouseUp,
  isPressed
}) => {
  // Render cell content
  const renderContent = () => {
    if (cell.flagged && !cell.revealed) {
      return <span className="text-red-500 flag-animation">🚩</span>;
    }
    
    if (!cell.revealed) {
      return null;
    }

    if (cell.isMine) {
      return <span>💣</span>;
    }

    if (cell.adjacentMines > 0) {
      return (
        <span className={`font-bold ${NUMBER_COLORS[cell.adjacentMines] || ''}`}>
          {cell.adjacentMines}
        </span>
      );
    }

    return null;
  };

  // Determine cell class
  const getCellClass = () => {
    const baseClass = 'cell';
    
    if (cell.revealed) {
      if (cell.isMine) {
        return `${baseClass} cell-mine cell-reveal-animation`;
      }
      return `${baseClass} cell-revealed cell-reveal-animation`;
    }
    
    if (cell.flagged) {
      return `${baseClass} cell-flagged`;
    }
    
    // 양클릭 중일 때 눌린 효과
    if (isPressed) {
      return `${baseClass} cell-hidden ${disabled ? 'cursor-not-allowed' : ''} !border-gray-400 !from-gray-400 !to-gray-400`;
    }
    
    return `${baseClass} cell-hidden ${disabled ? 'cursor-not-allowed' : ''}`;
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    onMouseDown(cell.x, cell.y, e);
  };

  const handleMouseUp = (e) => {
    if (disabled) return;
    onMouseUp(cell.x, cell.y, e);
  };

  return (
    <div
      className={getCellClass()}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {renderContent()}
    </div>
  );
});

Cell.displayName = 'Cell';

// Main board component
const MinesweeperBoard = ({ board, onCellClick, onCellRightClick, onCellDoubleClick, disabled }) => {
  // Track mouse button states for both-click detection
  const mouseState = useRef({
    leftDown: false,
    rightDown: false,
    activeCell: null,
    bothPressed: false
  });

  const [pressedCells, setPressedCells] = useState(new Set());

  // Get neighboring cells for visual feedback
  const getNeighborCells = useCallback((x, y) => {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (board[ny] && board[ny][nx]) {
          neighbors.push(`${nx},${ny}`);
        }
      }
    }
    return neighbors;
  }, [board]);

  const handleMouseDown = useCallback((x, y, e) => {
    if (disabled) return;

    // Middle click - chord action
    if (e.button === 1) {
      e.preventDefault();
      onCellDoubleClick(x, y);
      return;
    }

    // Update button state
    if (e.button === 0) {
      mouseState.current.leftDown = true;
    } else if (e.button === 2) {
      mouseState.current.rightDown = true;
    }

    mouseState.current.activeCell = { x, y };

    // Check if both buttons are pressed (chord action)
    if (mouseState.current.leftDown && mouseState.current.rightDown) {
      mouseState.current.bothPressed = true;
      // Show visual feedback for chord
      const cell = board[y]?.[x];
      if (cell?.revealed && cell.adjacentMines > 0) {
        const neighbors = getNeighborCells(x, y);
        setPressedCells(new Set(neighbors));
      }
    }
  }, [disabled, board, getNeighborCells, onCellDoubleClick]);

  const handleMouseUp = useCallback((x, y, e) => {
    if (disabled) return;

    const activeCell = mouseState.current.activeCell;
    const wasBothPressed = mouseState.current.bothPressed;

    // Clear pressed cells visual
    setPressedCells(new Set());

    // Check which button was released
    const releasedLeft = e.button === 0;
    const releasedRight = e.button === 2;

    // If both buttons were pressed, execute chord on release
    if (wasBothPressed && activeCell) {
      mouseState.current.bothPressed = false;
      
      // Execute chord action when any button is released
      if (releasedLeft || releasedRight) {
        onCellDoubleClick(activeCell.x, activeCell.y);
      }
      
      // Update button state
      if (releasedLeft) {
        mouseState.current.leftDown = false;
      }
      if (releasedRight) {
        mouseState.current.rightDown = false;
      }
      
      // Reset when both released
      if (!mouseState.current.leftDown && !mouseState.current.rightDown) {
        mouseState.current.activeCell = null;
      }
      return;
    }

    // Single button click handling
    if (activeCell && activeCell.x === x && activeCell.y === y) {
      if (releasedLeft && !mouseState.current.rightDown) {
        // Left click only - reveal cell
        onCellClick(x, y, e);
      } else if (releasedRight && !mouseState.current.leftDown) {
        // Right click only - flag cell
        onCellRightClick(x, y, e);
      }
    }

    // Update button state
    if (releasedLeft) {
      mouseState.current.leftDown = false;
    }
    if (releasedRight) {
      mouseState.current.rightDown = false;
    }

    // Reset when both released
    if (!mouseState.current.leftDown && !mouseState.current.rightDown) {
      mouseState.current.activeCell = null;
    }
  }, [disabled, onCellClick, onCellRightClick, onCellDoubleClick]);

  // Handle global mouse up and leave (in case mouse is released outside board)
  const handleBoardMouseLeave = useCallback(() => {
    mouseState.current.leftDown = false;
    mouseState.current.rightDown = false;
    mouseState.current.activeCell = null;
    mouseState.current.bothPressed = false;
    setPressedCells(new Set());
  }, []);

  // Handle mouse up on board level to catch releases
  const handleBoardMouseUp = useCallback((e) => {
    // This catches mouse up events that don't happen on a cell
    if (!mouseState.current.activeCell) return;
    
    if (e.button === 0) {
      mouseState.current.leftDown = false;
    } else if (e.button === 2) {
      mouseState.current.rightDown = false;
    }
    
    if (!mouseState.current.leftDown && !mouseState.current.rightDown) {
      mouseState.current.activeCell = null;
      mouseState.current.bothPressed = false;
      setPressedCells(new Set());
    }
  }, []);

  if (!board || board.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">🎮</div>
          <div>보드 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="inline-block bg-gray-400 p-1 rounded select-none"
      onContextMenu={(e) => e.preventDefault()}
      onMouseLeave={handleBoardMouseLeave}
      onMouseUp={handleBoardMouseUp}
    >
      <div 
        className="grid gap-px bg-gray-400"
        style={{
          gridTemplateColumns: `repeat(${board[0]?.length || 0}, minmax(0, 1fr))`
        }}
      >
        {board.flat().map((cell) => (
          <Cell
            key={`${cell.x}-${cell.y}`}
            cell={cell}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={disabled}
            isPressed={pressedCells.has(`${cell.x},${cell.y}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(MinesweeperBoard);
