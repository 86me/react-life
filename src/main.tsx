import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Zap, Info, Shapes, MousePointer, Activity, Users, Timer, Target } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { createRoot } from 'react-dom/client';

import './main.css'

const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;

// Utility function (replacing the missing utils)
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Patterns
const PATTERNS = {
  glider: {
    name: 'Glider',
    width: 3,
    height: 3,
    cells: [[1,0], [2,1], [0,2], [1,2], [2,2]]
  },
  blinker: {
    name: 'Blinker',
    width: 3,
    height: 1,
    cells: [[0,0], [0,1], [0,2]]
  },
  toad: {
    name: 'Toad',
    width: 4,
    height: 2,
    cells: [[0,1], [0,2], [0,3], [1,0], [1,1], [1,2]]
  },
  beacon: {
    name: 'Beacon',
    width: 4,
    height: 4,
    cells: [[0,0], [0,1], [1,0], [2,3], [3,2], [3,3]]
  },
  gosperGun: {
    name: 'Gosper Gun',
    width: 36,
    height: 9,
    cells: [
      [5,1], [5,2], [6,1], [6,2], [5,11], [6,11], [7,11], [4,12], [8,12],
      [3,13], [9,13], [3,14], [9,14], [6,15], [4,16], [8,16], [5,17], [6,17],
      [7,17], [6,18], [3,21], [4,21], [5,21], [3,22], [4,22], [5,22], [2,23],
      [6,23], [1,25], [2,25], [6,25], [7,25], [3,35], [4,35], [3,36], [4,36]
    ]
  },
  lwss: {
    name: 'Lightweight Spaceship',
    width: 5,
    height: 4,
    cells: [[0,1], [0,4], [1,0], [2,0], [3,0], [3,4], [2,5], [1,5]]
  }
};

// Create empty grid
const createEmptyGrid = () => {
  return Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(false));
};

// GameGrid Component
function GameGrid({ 
  grid, 
  onCellClick, 
  onMouseDown, 
  onMouseEnter, 
  onMouseUp, 
  isRunning, 
  isDrawing 
}) {
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
              className={cn(
                "w-3 h-3 sm:w-4 sm:h-4 rounded-sm border-0 transition-all duration-150",
                cell 
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm" 
                  : "bg-white hover:bg-slate-100",
                !isRunning ? "cursor-pointer" : "cursor-default",
                isDrawing ? "cursor-crosshair" : ""
              )}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!isRunning) onMouseDown(rowIndex, colIndex);
              }}
              onMouseEnter={() => {
                if (!isRunning) onMouseEnter(rowIndex, colIndex);
              }}
              data-row={rowIndex}
              data-col={colIndex}
              disabled={isRunning}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                backgroundColor: cell ? '#3b82f6' : '#ffffff'
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

// PatternSelector Component
function PatternSelector({ onLoadPattern, disabled }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Shapes className="w-5 h-5" />
          Famous Patterns
        </CardTitle>
        <p className="text-sm text-slate-600 flex items-center gap-1">
          <MousePointer className="w-4 h-4" />
          Click to center on grid
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(PATTERNS).map(([key, pattern]) => (
            <Button
              key={key}
              onClick={() => onLoadPattern(pattern)}
              disabled={disabled}
              variant="outline"
              className="h-auto p-3 text-left flex-col items-start hover:bg-blue-50 border-slate-200 transition-all"
            >
              <div className="font-medium text-slate-800 text-sm">{pattern.name}</div>
              <div className="text-xs text-slate-500">
                {pattern.width}×{pattern.height}
              </div>
            </Button>
          ))}
        </div>
        
        {disabled && (
          <div className="text-xs text-amber-600 mt-3 p-2 bg-amber-50 rounded">
            Pause the simulation to use patterns
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// GameStats Component
function GameStats({ generation, population, isRunning, isStable, stasisGeneration }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Timer className="w-4 h-4" />
            <span>Generation</span>
          </div>
          <div className="font-bold text-xl text-slate-800">
            {generation.toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4" />
            <span>Population</span>
          </div>
          <div className="font-bold text-xl text-blue-600">
            {population.toLocaleString()}
          </div>
        </div>

        {stasisGeneration !== null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Target className="w-4 h-4" />
              <span>Stasis at Gen</span>
            </div>
            <div className="font-bold text-xl text-purple-600">
              {stasisGeneration.toLocaleString()}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Status</span>
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              isStable
                ? "bg-purple-100 text-purple-800"
                : isRunning 
                  ? "bg-green-100 text-green-800" 
                  : "bg-slate-100 text-slate-600"
            )}>
              {isStable ? 'Stable Pattern' : isRunning ? 'Running' : 'Paused'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main GameOfLife Component
function GameOfLife() {
  const [grid, setGrid] = useState(createEmptyGrid);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState([200]);
  const [population, setPopulation] = useState(0);
  const [wrapEdges, setWrapEdges] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingValue, setDrawingValue] = useState(null);
  const [isStable, setIsStable] = useState(false);
  const [stasisGeneration, setStasisGeneration] = useState(null);
  const [gridHistory, setGridHistory] = useState([]);
  
  const runningRef = useRef(isRunning);
  const intervalRef = useRef();

  // Count living neighbors with optional wrapping
  const countNeighbors = useCallback((grid, x, y) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        let newX = x + i;
        let newY = y + j;

        if (wrapEdges) {
          newX = (newX + GRID_HEIGHT) % GRID_HEIGHT;
          newY = (newY + GRID_WIDTH) % GRID_WIDTH;
        }

        if (newX >= 0 && newX < GRID_HEIGHT && newY >= 0 && newY < GRID_WIDTH) {
          if (grid[newX][newY]) count++;
        }
      }
    }
    return count;
  }, [wrapEdges]);

  // Apply Conway's rules
  const getNextGeneration = useCallback((grid) => {
    const newGrid = createEmptyGrid();
    for (let x = 0; x < GRID_HEIGHT; x++) {
      for (let y = 0; y < GRID_WIDTH; y++) {
        const neighbors = countNeighbors(grid, x, y);
        if (grid[x][y]) {
          newGrid[x][y] = neighbors === 2 || neighbors === 3;
        } else {
          newGrid[x][y] = neighbors === 3;
        }
      }
    }
    return newGrid;
  }, [countNeighbors]);

  // Update population count
  useEffect(() => {
    const count = grid.flat().filter(cell => cell).length;
    setPopulation(count);
  }, [grid]);

  // Game loop
  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;
    
    let nextGrid;
    setGrid(currentGrid => {
      nextGrid = getNextGeneration(currentGrid);
      const nextGridString = JSON.stringify(nextGrid);
      
      if (gridHistory.includes(nextGridString)) {
        setIsRunning(false);
        setIsStable(true);
        setStasisGeneration(generation + 1);
      } else {
        setGridHistory(prev => [nextGridString, ...prev.slice(0, 5)]);
      }
      
      return nextGrid;
    });
    
    setGeneration(gen => gen + 1);
  }, [getNextGeneration, gridHistory, generation]);

  // Start/stop simulation
  useEffect(() => {
    runningRef.current = isRunning;
    if (isRunning) {
      intervalRef.current = setInterval(runSimulation, speed[0]);
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isRunning, speed, runSimulation]);

  const resetManualChange = () => {
    setIsStable(false);
    setStasisGeneration(null);
    setGridHistory([]);
  };

  const toggleCell = (row, col) => {
    if (isRunning) return;
    resetManualChange();
    
    setGrid(currentGrid => {
      const newGrid = currentGrid.map((rowArr, rIdx) => rIdx === row ? [...rowArr] : rowArr);
      newGrid[row][col] = !newGrid[row][col];
      return newGrid;
    });
  };

  const startDrawing = (row, col) => {
    if (isRunning) return;
    resetManualChange();
    
    setIsDrawing(true);
    const newValue = !grid[row][col]; 
    setDrawingValue(newValue);
    
    setGrid(currentGrid => {
      const newGrid = currentGrid.map((rowArr, rIdx) => rIdx === row ? [...rowArr] : rowArr);
      newGrid[row][col] = newValue;
      return newGrid;
    });
  };

  const continueDrawing = useCallback((row, col) => {
    if (isRunning || !isDrawing || drawingValue === null) return;
    
    setGrid(currentGrid => {
      if (currentGrid[row][col] !== drawingValue) {
        const newGrid = currentGrid.map((rowArr, rIdx) => rIdx === row ? [...rowArr] : rowArr);
        newGrid[row][col] = drawingValue;
        return newGrid;
      }
      return currentGrid;
    });
  }, [isRunning, isDrawing, drawingValue]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setDrawingValue(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', stopDrawing);
    return () => {
      window.removeEventListener('mouseup', stopDrawing);
    };
  }, [stopDrawing]);

  const toggleSimulation = () => {
    if (!isRunning) {
      resetManualChange();
    }
    setIsRunning(!isRunning);
  };

  const resetGrid = () => {
    setGrid(createEmptyGrid());
    setGeneration(0);
    setIsRunning(false);
    resetManualChange();
  };

  const loadPattern = (pattern) => {
    if (isRunning) return;
    resetManualChange();
    
    const newGrid = createEmptyGrid();
    const startX = Math.floor((GRID_HEIGHT - pattern.height) / 2);
    const startY = Math.floor((GRID_WIDTH - pattern.width) / 2);
    
    pattern.cells.forEach(([x, y]) => {
      if (startX + x >= 0 && startX + x < GRID_HEIGHT && 
          startY + y >= 0 && startY + y < GRID_WIDTH) {
        newGrid[startX + x][startY + y] = true;
      }
    });
    
    setGrid(newGrid);
    setGeneration(0);
  };

  const randomizeGrid = () => {
    if (isRunning) return;
    resetManualChange();
    
    const newGrid = createEmptyGrid();
    for (let x = 0; x < GRID_HEIGHT; x++) {
      for (let y = 0; y < GRID_WIDTH; y++) {
        newGrid[x][y] = Math.random() > 0.7;
      }
    }
    setGrid(newGrid);
    setGeneration(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Conway's Game of Life
          </h1>
          <p className="text-slate-600 text-lg">
            Watch cellular automata evolve according to simple rules
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <PatternSelector 
              onLoadPattern={loadPattern}
              disabled={isRunning}
            />

            <Card className="mt-6 bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Interactive Grid
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "transition-colors",
                      isStable ? "text-purple-700 bg-purple-50" : "text-slate-600"
                    )}>
                      {isStable 
                        ? "Auto-paused: Stable pattern detected" 
                        : isRunning 
                          ? "Simulation Running" 
                          : "Click & drag to draw cells"
                      }
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GameGrid 
                  grid={grid}
                  onCellClick={toggleCell}
                  onMouseDown={startDrawing}
                  onMouseEnter={continueDrawing}
                  onMouseUp={stopDrawing}
                  isRunning={isRunning}
                  isDrawing={isDrawing}
                />
              </CardContent>
            </Card>

            <Card className="mt-6 bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-3">
                    <Button
                      onClick={toggleSimulation}
                      className={cn(
                        "text-white shadow-lg transition-all duration-200",
                        isRunning 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-emerald-500 hover:bg-emerald-600"
                      )}
                    >
                      {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isRunning ? 'Pause' : 'Start'}
                    </Button>
                    
                    <Button
                      onClick={resetGrid}
                      variant="outline"
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    
                    <Button
                      onClick={randomizeGrid}
                      variant="outline"
                      disabled={isRunning}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Random
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                    <div className="flex items-center space-x-2">
                      <Switch id="wrap-edges" checked={wrapEdges} onCheckedChange={setWrapEdges} disabled={isRunning} />
                      <Label htmlFor="wrap-edges" className="text-sm text-slate-600 cursor-pointer">Wrap Edges</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Speed:</span>
                      <div className="w-32">
                        <Slider
                          value={speed}
                          onValueChange={setSpeed}
                          min={50}
                          max={1000}
                          step={50}
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="text-sm text-slate-500 w-12 text-right">
                        {Math.round(1000/speed[0])}fps
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <GameStats 
              generation={generation}
              population={population}
              isRunning={isRunning}
              isStable={isStable}
              stasisGeneration={stasisGeneration}
            />
            
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <div>• Live cell with 2-3 neighbors survives</div>
                <div>• Dead cell with exactly 3 neighbors becomes alive</div>
                <div>• All other cells die or stay dead</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameOfLife;

const root = createRoot(document.getElementById('root'));
root.render(<GameOfLife />);
