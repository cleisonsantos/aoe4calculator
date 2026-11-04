import React, { useEffect, useState } from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useAoE4Data } from '../hooks/useAoE4Data';
import { CivSelector } from './CivSelector';
import { VillagerAllocator } from './VillagerAllocator';
import { OutputDashboard, RpmBar, MaxProductionGrid, RequiredVillagersBar, ProductionSummary } from './OutputDashboard';
import { TechSelector } from './TechSelector';
import { UnitSelector } from './UnitSelector';
import { PassiveGenerationSelector } from './PassiveGenerationSelector';
import { ModeToggle } from './ModeToggle';
import { ThemeToggle } from './ThemeToggle';
import { TownCenterSelector } from './TownCenterSelector';
import { isTrainableUnit } from '../utils/calculator';

export const Calculator = () => {
  const { loadFromUrl, mode, civ, age, mongolEconomy, units, setUnitProduction, activeTechs, toggleTech } = useCalculatorStore();
  const [removedUnits, setRemovedUnits] = useState<string[]>([]);
  const data = useAoE4Data();

  useEffect(() => {
    if (data.loading || data.error) return;
    const invalid = units.filter(selected => !data.units.some(unit => unit.id === selected.id && !unit.classes?.includes('ship') && isTrainableUnit(unit, civ, age, mongolEconomy)));
    if (invalid.length) {
      setRemovedUnits(invalid.map(selected => data.units.find(unit => unit.id === selected.id)?.name ?? selected.id));
      invalid.forEach(selected => setUnitProduction(selected.id, 0));
    }
  }, [data.loading, data.error, data.units, civ, age, mongolEconomy, units, setUnitProduction]);

  useEffect(() => {
    if (civ !== 'mo' || data.loading || data.error || !data.technologies.length) return;
    activeTechs.forEach(id => {
      const tech = data.technologies.find(t => t.baseId === id && t.civs.includes(civ));
      if (!tech || (tech.age ?? 1) > age) toggleTech(id);
    });
  }, [data.loading, data.error, data.technologies, civ, age, activeTechs, toggleTech]);

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
        if (v > 0 || k === 'food_sheep') params.set(k, v.toString());
      });
      if (state.civ === 'jin') {
        Object.entries(state.mountedVillagers).forEach(([k, v]) => {
          if (v > 0) params.set(`mv_${k}`, v.toString());
        });
        if (state.villagerType === 'mounted') params.set('vt', 'mounted');
        if (state.tributaryFoodRate > 0) params.set('tfr', state.tributaryFoodRate.toString());
        if (state.tributaries > 0) params.set('tb', state.tributaries.toString());
      }

      if (state.activeTechs.length > 0) params.set('techs', state.activeTechs.join(','));
      if (state.civ === 'mo') {
        if (state.mongolEconomy.whiteStupa) params.set('ms', 'true');
        if (state.mongolEconomy.steppeRedoubt) params.set('mr', 'true');
        if (state.mongolEconomy.deerStones) params.set('md', 'true');
      }
      if (state.ovooCount > 0) params.set('oc', state.ovooCount.toString());
      if (state.ovooDoubleProduction) params.set('od', 'true');
      if (state.sacredSites > 0) params.set('ss', state.sacredSites.toString());
      if (state.relics > 0) params.set('rl', state.relics.toString());
      params.set('tc', state.tcProducingVillagers.toString());

      if (state.units.length > 0) {
        const uParam = state.units.map(u => `${u.id}:${u.buildings}${u.doubleProduced ? ':d' : ''}`).join(',');
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
        <p className="text-slate-600 font-normal">Failed to load game data. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-4">
      
      <header className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AoE4 <span className="text-[var(--civ-primary)]">Calculator</span></h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Dynamic Production & Timing Engine</p>
        </div>
        <ThemeToggle />
      </header>

      <CivSelector />
      {removedUnits.length > 0 && <p role="status" className="text-sm text-amber-800 bg-amber-50 p-3 rounded">Unavailable selections removed: {removedUnits.join(', ')}. Choose an available unit; researched veterancy is not assumed.</p>}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-2">
        <ModeToggle />
        <AgeSelector />
      </div>

      {mode === 'resource' ? (
        /* ── Resource Mode: Villagers → see what you can produce ── */
        <>
          <RpmBar />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3 space-y-3">
            <VillagerAllocator />
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
              <MaxProductionGrid />
            </div>
            <PassiveGenerationSelector />
            <TownCenterSelector />
            <TechSelector techs={data.technologies} />
          </div>
        </div>
        </>
      ) : (
        /* ── Units Mode: Pick units → see required economy ── */
        <>
          <RequiredVillagersBar />
          <div className="space-y-3">
            <UnitSelector units={data.units} />
            <ProductionSummary />
            <TownCenterSelector />
            <PassiveGenerationSelector />
            <TechSelector techs={data.technologies} />
            <OutputDashboard />
          </div>
        </>
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
