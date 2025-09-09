import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shapes, MousePointer } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

export const PATTERNS = {
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

export default function PatternSelector({ onLoadPattern, disabled }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Shapes className="w-5 h-5" />
          Famous Patterns
        </CardTitle>
        <p className="text-sm text-slate-600 flex items-center gap-1">
          <MousePointer className="w-4 h-4" />
          Click to center or drag onto grid
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(PATTERNS).map(([key, pattern], index) => (
            <Draggable key={key} draggableId={key} index={index} isDragDisabled={disabled}>
              {(provided, snapshot) => (
                <Button
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  onClick={() => onLoadPattern(pattern)}
                  disabled={disabled}
                  variant="outline"
                  className={`h-auto p-3 text-left flex-col items-start hover:bg-blue-50 border-slate-200 transition-all ${
                    snapshot.isDragging ? 'shadow-lg rotate-3 bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-slate-800 text-sm">{pattern.name}</div>
                  <div className="text-xs text-slate-500">
                    {pattern.width}×{pattern.height}
                  </div>
                </Button>
              )}
            </Draggable>
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
