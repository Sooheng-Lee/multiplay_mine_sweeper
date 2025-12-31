import React, { memo, useMemo } from 'react';

const OpponentPreview = ({ progress, boardSize, large = false }) => {
  // Create a preview grid based on progress data
  const previewGrid = useMemo(() => {
    if (!boardSize) return null;

    const { width, height } = boardSize;
    const grid = Array(height).fill(null).map((_, y) =>
      Array(width).fill(null).map((_, x) => ({
        x,
        y,
        revealed: false,
        flagged: false
      }))
    );

    // Mark revealed positions
    if (progress?.revealedPositions) {
      progress.revealedPositions.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x]) {
          grid[y][x].revealed = true;
        }
      });
    }

    // Mark flagged positions
    if (progress?.flaggedPositions) {
      progress.flaggedPositions.forEach(({ x, y }) => {
        if (grid[y] && grid[y][x]) {
          grid[y][x].flagged = true;
        }
      });
    }

    return grid;
  }, [progress, boardSize]);

  if (!boardSize || !previewGrid) {
    return (
      <div className="flex items-center justify-center p-4 bg-white/5 rounded-lg">
        <div className="text-gray-400 text-sm">대기 중...</div>
      </div>
    );
  }

  const cellSize = large ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-2 h-2 sm:w-3 sm:h-3';

  return (
    <div className="flex justify-center">
      <div 
        className="inline-block bg-gray-700 p-1 rounded"
        style={{ maxWidth: '100%', overflow: 'auto' }}
      >
        <div 
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${boardSize.width}, minmax(0, 1fr))`
          }}
        >
          {previewGrid.flat().map((cell) => (
            <div
              key={`${cell.x}-${cell.y}`}
              className={`${cellSize} transition-colors duration-200 ${
                cell.flagged
                  ? 'bg-yellow-400'
                  : cell.revealed
                    ? 'bg-blue-400'
                    : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(OpponentPreview);
