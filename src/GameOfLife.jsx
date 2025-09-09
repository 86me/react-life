import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Zap, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import GameGrid from '@/components/game/GameGrid.jsx';
import PatternSelector, { PATTERNS } from '@/components/game/PatternSelector.jsx';
import GameStats from '@/components/game/GameStats.jsx';

const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;

// Create empty grid
const createEmptyGrid = () => {
  return Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(false));
};

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

        // Check bounds after wrapping (or if not wrapping)
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
          // Cell is alive
          newGrid[x][y] = neighbors === 2 || neighbors === 3;
        } else {
          // Cell is dead
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
      
      // Check for stable patterns or loops
      // Keep a limited history to detect repeating patterns
      if (gridHistory.includes(nextGridString)) {
        setIsRunning(false);
        setIsStable(true);
        setStasisGeneration(generation + 1);
      } else {
        setGridHistory(prev => [nextGridString, ...prev.slice(0, 5)]); // Keep last 6 states (current + 5 previous)
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

  // New function: Initiates the drawing process on mouse down
  const startDrawing = (row, col) => {
    if (isRunning) return;
    resetManualChange();
    
    setIsDrawing(true);
    // Determine whether to set cells to alive or dead based on the first cell's state
    const newValue = !grid[row][col]; 
    setDrawingValue(newValue);
    
    // Apply the change to the cell immediately
    setGrid(currentGrid => {
      const newGrid = currentGrid.map((rowArr, rIdx) => rIdx === row ? [...rowArr] : rowArr);
      newGrid[row][col] = newValue;
      return newGrid;
    });
  };

  // New function: Continues drawing as mouse moves over cells while button is down
  const continueDrawing = useCallback((row, col) => {
    if (isRunning || !isDrawing || drawingValue === null) return;
    
    setGrid(currentGrid => {
      // Only update if the cell's current state is different from the desired drawing value
      if (currentGrid[row][col] !== drawingValue) {
        const newGrid = currentGrid.map((rowArr, rIdx) => rIdx === row ? [...rowArr] : rowArr);
        newGrid[row][col] = drawingValue;
        return newGrid;
      }
      return currentGrid; // No change needed, return current grid to prevent unnecessary re-render
    });
  }, [isRunning, isDrawing, drawingValue]);

  // New function: Stops the drawing process (e.g., on mouseup)
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setDrawingValue(null);
  }, []);

  // Effect to add a global mouseup listener to stop drawing
  // This ensures drawing stops even if the mouse is released outside the grid area.
  useEffect(() => {
    window.addEventListener('mouseup', stopDrawing);
    return () => {
      window.removeEventListener('mouseup', stopDrawing);
    };
  }, [stopDrawing]); // Depend on stopDrawing to ensure the correct function is always used

  const toggleSimulation = () => {
    if (!isRunning) {
      // Starting the simulation, so reset stability check
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

  const dropPattern = (pattern, dropRow, dropCol) => {
    if (isRunning) return;
    resetManualChange();
    
    setGrid(currentGrid => {
      const newGrid = currentGrid.map(rowArr => [...rowArr]); // Deep copy of rows
      pattern.cells.forEach(([x, y]) => {
        const targetRow = dropRow + x;
        const targetCol = dropCol + y;
        if (targetRow >= 0 && targetRow < GRID_HEIGHT && 
            targetCol >= 0 && targetCol < GRID_WIDTH) {
          newGrid[targetRow][targetCol] = true;
        }
      });
      return newGrid;
    });
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

  const handleDragEnd = (result) => {
    if (!result.destination || isRunning) return;
    
    const patternKey = result.draggableId;
    const pattern = PATTERNS[patternKey];
    if (!pattern) return;

    // Calculate drop position based on destination index
    const dropIndex = result.destination.index;
    const dropRow = Math.floor(dropIndex / GRID_WIDTH);
    const dropCol = dropIndex % GRID_WIDTH;
    
    dropPattern(pattern, dropRow, dropCol);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Conway's Game of Life
            </h1>
            <p className="text-slate-600 text-lg">
              Watch cellular automata evolve according to simple rules
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-3">
              {/* Famous Patterns - Now Above Grid */}
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
                      <Badge variant="outline" className={`transition-colors ${isStable ? 'text-purple-700 bg-purple-50' : 'text-slate-600'}`}>
                        {isStable 
                          ? `Auto-paused: Stable pattern detected` 
                          : isRunning 
                            ? 'Simulation Running' 
                            : 'Click & drag to draw, or drag patterns from above'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="grid">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <GameGrid 
                          grid={grid}
                          onCellClick={toggleCell}
                          onMouseDown={startDrawing}
                          onMouseEnter={continueDrawing}
                          onMouseUp={stopDrawing}
                          isRunning={isRunning}
                          isDrawing={isDrawing}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>

              {/* Controls */}
              <Card className="mt-6 bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-3">
                      <Button
                        onClick={toggleSimulation}
                        className={`${isRunning 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-emerald-500 hover:bg-emerald-600'
                        } text-white shadow-lg transition-all duration-200`}
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

            {/* Sidebar */}
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
    </DragDropContext>
  );
}

export default GameOfLife
