import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Timer, Target } from 'lucide-react';

export default function GameStats({ generation, population, isRunning, isStable, stasisGeneration }) {
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
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isStable
                ? 'bg-purple-100 text-purple-800'
                : isRunning 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-slate-100 text-slate-600'
            }`}>
              {isStable ? 'Stable Pattern' : isRunning ? 'Running' : 'Paused'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
