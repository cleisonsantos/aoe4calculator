import React, { useEffect } from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useAoE4Data } from '../hooks/useAoE4Data';
import { CivSelector } from './CivSelector';
import { VillagerAllocator } from './VillagerAllocator';
import { OutputDashboard } from './OutputDashboard';
import { TechSelector } from './TechSelector';
import { UnitSelector } from './UnitSelector';
import { PassiveGenerationSelector } from './PassiveGenerationSelector';
import { ModeToggle } from './ModeToggle';
import { ThemeToggle } from './ThemeToggle';
import { TownCenterSelector } from './TownCenterSelector';

export const Calculator = () => {
  const { loadFromUrl, mode } = useCalculatorStore();
  const data = useAoE4Data();

  useEffect(() => {
    // Load state from URL on first mount
    if (typeof window !== 'undefined') {
      loadFromUrl(window.location.search);
    }
  }, [loadFromUrl]);

  useEffect(() => {
    const unsub = useCalculatorStore.subscribe((state) => {
      const params = new URLSearchParams();
      params.set('mode', state.mode);
      params.set('civ', state.civ);
      params.set('age', state.age.toString());
      
      Object.entries(state.villagers).forEach(([k, v]) => {
        if (v > 0) params.set(k, v.toString());
      });

      if (state.activeTechs.length > 0) params.set('techs', state.activeTechs.join(','));
      if (state.ovooCount > 0) params.set('oc', state.ovooCount.toString());
      if (state.ovooDoubleProduction) params.set('od', 'true');
      if (state.sacredSites > 0) params.set('ss', state.sacredSites.toString());
      if (state.tcProducingVillagers > 0) params.set('tc', state.tcProducingVillagers.toString());

      if (state.units.length > 0) {
        const uParam = state.units.map(u => `${u.id}:${u.buildings}`).join(',');
        params.set('u', uParam);
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    });
    return unsub;
  }, []);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-[var(--civ-primary, #334155)] border-t-slate-800"></div>
        <span className="ml-4 text-slate-600 font-medium text-lg">Loading AoE4 Data...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-red-500 font-bold p-8 text-center flex-col">
        <p className="text-2xl mb-4">Error loading data.</p>
        <p className="text-slate-600 font-normal">{data.error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-200 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AoE4 <span className="text-[var(--civ-primary)]">Calculator</span></h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Dynamic Production & Timing Engine</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ThemeToggle />
          <ModeToggle />
          <AgeSelector />
        </div>
      </header>

      <CivSelector />

      {mode === 'resource' ? (
        /* ── Resource Mode: Villagers → see what you can produce ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <VillagerAllocator />
            <PassiveGenerationSelector />
            <TechSelector techs={data.technologies} />
          </div>
          <div className="lg:col-span-1">
            <OutputDashboard />
          </div>
        </div>
      ) : (
        /* ── Units Mode: Pick units → see required economy ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <UnitSelector units={data.units} />
            <TownCenterSelector />
            <PassiveGenerationSelector />
            <TechSelector techs={data.technologies} />
          </div>
          <div className="lg:col-span-1">
            <OutputDashboard />
          </div>
        </div>
      )}
      
    </div>
  );
};

const AgeSelector = () => {
  const { age, setAge } = useCalculatorStore();
  const ages = [1, 2, 3, 4];
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
      {ages.map((a) => (
        <button
          key={a}
          onClick={() => setAge(a)}
          className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${age === a ? 'bg-white shadow-sm text-[var(--civ-primary)]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Age {['I', 'II', 'III', 'IV'][a - 1]}
        </button>
      ))}
    </div>
  );
};
