import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { Pickaxe, Swords } from 'lucide-react';

export const ModeToggle = () => {
  const { mode, setMode } = useCalculatorStore();

  return (
    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button
        onClick={() => setMode('resource')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
          mode === 'resource'
            ? 'bg-white shadow-sm text-[var(--civ-primary)]'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Pickaxe className="w-4 h-4" />
        Resource Mode
      </button>
      <button
        onClick={() => setMode('unit')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
          mode === 'unit'
            ? 'bg-white shadow-sm text-[var(--civ-primary)]'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Swords className="w-4 h-4" />
        Units Mode
      </button>
    </div>
  );
};
