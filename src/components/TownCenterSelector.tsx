import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { Home } from 'lucide-react';

export const TownCenterSelector = () => {
  const { tcProducingVillagers, setTcProducingVillagers, age } = useCalculatorStore();

  // Max TCs available per age
  const maxTcs = age === 1 ? 1 : age === 2 ? 2 : age === 3 ? 3 : 4;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Home className="w-5 h-5 text-[var(--civ-primary)]" />
          Town Centers Producing Villagers
        </h3>
        <span className="text-sm text-slate-500 font-medium">Max: {maxTcs}</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        How many TCs are continuously producing villagers. This affects whether you can sustain both villager and unit production.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTcProducingVillagers(Math.max(0, tcProducingVillagers - 1))}
          className="w-10 h-10 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors flex items-center justify-center"
          disabled={tcProducingVillagers <= 0}
        >
          −
        </button>
        <span className="w-12 text-center font-mono text-2xl font-bold text-slate-800">
          {tcProducingVillagers}
        </span>
        <button
          onClick={() => setTcProducingVillagers(Math.min(maxTcs, tcProducingVillagers + 1))}
          className="w-10 h-10 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors flex items-center justify-center"
          disabled={tcProducingVillagers >= maxTcs}
        >
          +
        </button>
      </div>

      {tcProducingVillagers > 0 && (
        <div className="mt-4 p-3 bg-[var(--civ-primary)]/5 border border-[var(--civ-primary)]/20 rounded-md">
          <div className="text-xs text-slate-600 font-medium">
            🏠 {tcProducingVillagers} TC producing {tcProducingVillagers === 1 ? 'villager' : 'villagers'} → ~{Math.round(tcProducingVillagers * 2.4)}/min
          </div>
        </div>
      )}
    </div>
  );
};
