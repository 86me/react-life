import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function GameGrid({ 
  grid, 
  onCellClick, 
  onMouseDown, 
  onMouseEnter, 
  onMouseUp, 
  isRunning, 
  isDrawing 
}) {
  // Prevent context menu and handle mouse up events
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDrawing) onMouseUp();
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isDrawing, onMouseUp]);

  return (
    <div className="flex justify-center select-none">
      <div 
        className="grid gap-[1px] bg-slate-200 p-2 rounded-lg shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))`,
        }}
        onMouseLeave={onMouseUp}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <motion.button
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-3 h-3 sm:w-4 sm:h-4 rounded-sm border-0 transition-all duration-150
                ${cell 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm' 
                  : 'bg-white hover:bg-slate-100'
                }
                ${!isRunning ? 'cursor-pointer' : 'cursor-default'}
                ${isDrawing ? 'cursor-crosshair' : ''}
              `}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!isRunning) onMouseDown(rowIndex, colIndex);
              }}
              onMouseEnter={() => {
                if (!isRunning) onMouseEnter(rowIndex, colIndex);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                if (!isRunning) onMouseDown(rowIndex, colIndex);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.dataset && element.dataset.row && element.dataset.col) {
                  const row = parseInt(element.dataset.row);
                  const col = parseInt(element.dataset.col);
                  onMouseEnter(row, col);
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onMouseUp();
              }}
              data-row={rowIndex}
              data-col={colIndex}
              disabled={isRunning}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                backgroundColor: cell 
                  ? '#3b82f6'
                  : '#ffffff'
              }}
              whileHover={!isRunning && !isDrawing ? { scale: 1.1 } : {}}
              whileTap={!isRunning ? { scale: 0.95 } : {}}
              transition={{ duration: 0.1 }}
            />
          ))
        )}
      </div>
    </div>
  );
}
