import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import {
  calculateRPM,
  calculateProductionDrain,
  calculateMaxProduction,
  calculateRequiredVillagers,
  calculateVillagerProduction,
  getVillagerStats,
} from '../utils/calculator';
import { CostDisplay } from './ResourceIcon';
import { useAoE4Data } from '../hooks/useAoE4Data';
import { Pickaxe, Swords, Users, Home, AlertTriangle, CheckCircle } from 'lucide-react';

const RESOURCE_BASE_URL = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources';

export const OutputDashboard = () => {
  return (
    <div className="space-y-3">
      <UnitsModeOutput />
    </div>
  );
};

// ── Resource Mode: show RPM + max sustainable production ──

export const RpmBar = () => {
  const { villagers, civ, age, activeTechs, ovooCount, sacredSites, relics } = useCalculatorStore();
  const rpm = calculateRPM(villagers, civ, age, activeTechs, ovooCount, sacredSites, relics);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <h3 className="text-lg font-bold mb-3 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
        <Pickaxe className="w-5 h-5 text-[var(--civ-primary)]" />
        Income (RPM)
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        <ResourceCard iconUrl={`${RESOURCE_BASE_URL}/food.png`} label="Food" value={rpm.food} />
        <ResourceCard iconUrl={`${RESOURCE_BASE_URL}/wood.png`} label="Wood" value={rpm.wood} />
        <ResourceCard iconUrl={`${RESOURCE_BASE_URL}/gold.png`} label="Gold" value={rpm.gold} />
        <ResourceCard iconUrl={`${RESOURCE_BASE_URL}/stone.png`} label="Stone" value={rpm.stone} />
        {rpm.oliveoil > 0 && (
          <ResourceCard iconUrl={`${RESOURCE_BASE_URL}/oliveoil.png`} label="Olive Oil" value={rpm.oliveoil} />
        )}
        {rpm.silver > 0 && (
          <ResourceCard iconUrl={`${RESOURCE_BASE_URL}/silver.png`} label="Silver" value={rpm.silver} />
        )}
      </div>
    </div>
  );
};

export const MaxProductionGrid = () => {
  const { villagers, civ, age, activeTechs, ovooCount, ovooDoubleProduction, sacredSites, relics } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  const rpm = calculateRPM(villagers, civ, age, activeTechs, ovooCount, sacredSites, relics);

  const availableUnits = Object.values(
    allUnits
      .filter(u => u.civs.includes(civ) && u.classes?.includes('military') && !u.classes?.includes('ship') && u.age <= age)
      .reduce((acc, u) => {
        const existing = acc[u.baseId];
        if (!existing || u.age > existing.age) acc[u.baseId] = u;
        return acc;
      }, {} as Record<string, UnitData>)
  );

  const maxProd = calculateMaxProduction(rpm, availableUnits, civ, ovooDoubleProduction);

  const villagerStats = getVillagerStats(allUnits, civ);
  const maxVillagersPerMin = villagerStats.cost > 0 ? +(rpm.food / villagerStats.cost).toFixed(1) : 0;
  const villagerUnit = allUnits.find(u => u.civs.includes(civ) && u.classes?.includes('villager'));

  const sorted = [
    ...maxProd,
    {
      unitId: 'villager',
      unitName: villagerUnit?.name || 'Villager',
      icon: villagerUnit?.icon || 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/food.png',
      maxSustainable: maxVillagersPerMin,
    },
  ].sort((a, b) => b.maxSustainable - a.maxSustainable);

  if (sorted.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-slate-800 flex items-center gap-2">
        <Swords className="w-5 h-5 text-[var(--civ-primary)]" />
        Max Sustainable Production
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        How many of each unit your economy can continuously sustain (solo).
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
        {sorted.slice(0, 30).map(entry => {
          const isVillager = entry.unitId === 'villager';
          const uDef = isVillager
            ? villagerUnit
            : allUnits.find(u => u.id === entry.unitId && u.civs.includes(civ));
          const costs = isVillager
            ? { food: villagerStats.cost, time: villagerStats.time }
            : uDef?.costs;
          return (
            <div
              key={entry.unitId}
              className="p-2 rounded flex flex-col items-center justify-center border border-slate-200 bg-white hover:border-[var(--civ-primary)] hover:bg-slate-50 transition-all"
              title={costs ? `${entry.unitName} — ${costs.food ? costs.food + 'F ' : ''}${costs.wood ? costs.wood + 'W ' : ''}${costs.gold ? costs.gold + 'G ' : ''}${'time' in costs && costs.time ? costs.time + 's' : ''}` : entry.unitName}
            >
              <img src={entry.icon} alt={entry.unitName} loading="lazy" className="w-8 h-8 rounded bg-slate-900 object-cover mb-1" />
              <div className="font-bold text-[10px] text-center leading-tight text-slate-700 truncate w-full">{entry.unitName}</div>
              <div className="text-xs font-bold text-[var(--civ-primary)]">{entry.maxSustainable.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">/min</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Units Mode: show required villagers for desired production ──

export const RequiredVillagersBar = () => {
  const { civ, age, activeTechs, units: activeUnits, ovooCount, sacredSites, relics, tcProducingVillagers } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  const required = calculateRequiredVillagers(
    activeUnits, allUnits, civ, age, activeTechs,
    ovooCount, sacredSites, relics,
    tcProducingVillagers
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--civ-primary)]" />
          <span className="font-bold text-slate-800">Required Villagers:</span>
        </div>
        {activeUnits.length === 0 ? (
          <span className="text-sm text-slate-400 italic">Select units to see the required economy.</span>
        ) : (
          <>
            <div className="bg-[var(--civ-primary)]/10 border border-[var(--civ-primary)]/20 rounded-lg px-4 py-1.5">
              <span className="text-2xl font-black text-[var(--civ-primary)]">{required.total}</span>
              <span className="text-sm text-slate-500 ml-1">total</span>
            </div>
            {[
              { url: `${RESOURCE_BASE_URL}/food.png`, label: 'Food', count: required.food },
              { url: `${RESOURCE_BASE_URL}/wood.png`, label: 'Wood', count: required.wood },
              { url: `${RESOURCE_BASE_URL}/gold.png`, label: 'Gold', count: required.gold },
              { url: `${RESOURCE_BASE_URL}/stone.png`, label: 'Stone', count: required.stone },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-1.5">
                <img src={r.url} alt={r.label} loading="lazy" className="w-4 h-4 object-contain" />
                <span className="text-sm font-semibold text-slate-700">{r.count}</span>
                <span className="text-[10px] text-slate-400 uppercase">{r.label}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export const ProductionSummary = () => {
  const { civ, units: activeUnits } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  const { perUnit } = calculateProductionDrain(activeUnits, allUnits, civ);

  if (activeUnits.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <h3 className="text-base font-bold mb-2 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
        <Swords className="w-5 h-5 text-[var(--civ-primary)]" />
        Production Summary
      </h3>
      <div className="space-y-3">
        {perUnit.map(pu => {
          const uDef = allUnits.find(u => u.id === pu.unitId && u.civs.includes(civ));
          if (!uDef) return null;
          return (
            <div key={pu.unitId} className="flex flex-col gap-1 text-sm border-b border-slate-50 pb-2 last:border-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src={uDef.icon} loading="lazy" className="w-6 h-6 rounded bg-slate-900" alt={uDef.name} />
                  <span className="font-medium text-slate-700">{uDef.name}</span>
                </div>
                <div className="font-bold text-slate-900">
                  {pu.upm.toFixed(1)} / min
                </div>
              </div>
              <div className="ml-8 flex items-center gap-3 text-xs text-slate-500">
                <CostDisplay costs={uDef.costs} compact showTime />
              </div>
              <div className="ml-8 flex gap-2 text-[10px] text-slate-400">
                {pu.drain.food > 0 && <span>Food: {Math.round(pu.drain.food)}/m</span>}
                {pu.drain.wood > 0 && <span>Wood: {Math.round(pu.drain.wood)}/m</span>}
                {pu.drain.gold > 0 && <span>Gold: {Math.round(pu.drain.gold)}/m</span>}
                {pu.drain.stone > 0 && <span>Stone: {Math.round(pu.drain.stone)}/m</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UnitsModeOutput = () => {
  const {
    civ, age, activeTechs,
    units: activeUnits,
    ovooCount, ovooDoubleProduction, sacredSites, relics,
    tcProducingVillagers, villagers
  } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  const required = calculateRequiredVillagers(
    activeUnits, allUnits, civ, age, activeTechs,
    ovooCount, sacredSites, relics,
    tcProducingVillagers
  );

  const { total: unitDrain } = calculateProductionDrain(activeUnits, allUnits, civ);
  
  const requiredVillagersAllocation = {
    food_sheep: 0, food_berries: 0, food_deer: 0, food_boar: 0,
    food_farms: required.food,
    wood: required.wood,
    gold: required.gold,
    stone: required.stone,
    oliveoil: 0,
    silver: 0
  };
  const rpm = calculateRPM(requiredVillagersAllocation, civ, age, activeTechs, ovooCount, sacredSites, relics);
  const villagerAnalysis = calculateVillagerProduction(rpm, tcProducingVillagers, unitDrain, allUnits, civ);

  return (
    <>
      {/* Villager Production Analysis */}
      {activeUnits.length > 0 && tcProducingVillagers > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
          <h3 className="text-base font-bold mb-2 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-[var(--civ-primary)]" />
            Villager Production Analysis
          </h3>
          
          <div className={`mb-3 p-3 rounded-lg border-2 ${
            villagerAnalysis.canProduceSimultaneously 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {villagerAnalysis.canProduceSimultaneously ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-bold ${
                villagerAnalysis.canProduceSimultaneously ? 'text-green-800' : 'text-red-800'
              }`}>
                {villagerAnalysis.canProduceSimultaneously 
                  ? 'Can Produce Both Simultaneously' 
                  : 'Food Conflict - Not Enough for Both'}
              </span>
            </div>
            <p className={`text-sm ${
              villagerAnalysis.canProduceSimultaneously ? 'text-green-700' : 'text-red-700'
            }`}>
              {villagerAnalysis.canProduceSimultaneously 
                ? `Your economy can sustain both unit production and ${villagerAnalysis.villagerProductionRate} villagers/min`
                : `You need ${Math.abs(villagerAnalysis.foodSurplus)} more food/min to sustain both`
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium uppercase mb-1">Villager Production</div>
              <div className="text-2xl font-bold text-slate-800">{villagerAnalysis.villagerProductionRate} <span className="text-sm font-normal text-slate-500">/min</span></div>
              <div className="text-xs text-slate-500 mt-1">from {tcProducingVillagers} TC</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium uppercase mb-1">Food Drain (Vills)</div>
              <div className="text-2xl font-bold text-slate-800">{villagerAnalysis.foodDrainFromVillagers} <span className="text-sm font-normal text-slate-500">/min</span></div>
              <div className="text-xs text-slate-500 mt-1">Dynamic villager cost based on civ</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium uppercase mb-1">Food Surplus</div>
              <div className={`text-2xl font-bold ${villagerAnalysis.foodSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {villagerAnalysis.foodSurplus >= 0 ? '+' : ''}{villagerAnalysis.foodSurplus} <span className="text-sm font-normal text-slate-500">/min</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">After units + villagers</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-xs text-slate-500 font-medium uppercase mb-1">Max TCs Supported</div>
              <div className="text-2xl font-bold text-slate-800">{villagerAnalysis.maxTcForCurrentFood}</div>
              <div className="text-xs text-slate-500 mt-1">with current food surplus</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Shared small components ──

const ResourceCard = ({ iconUrl, label, value }: { iconUrl: string; label: string; value: number }) => (
  <div className="flex items-center p-3 rounded bg-slate-50 border border-slate-100 gap-3">
    <img src={iconUrl} alt={label} loading="lazy" className="w-6 h-6 object-contain" />
    <div>
      <div className="text-xs text-slate-500 font-medium uppercase">{label}</div>
      <div className={`text-xl font-bold ${value < 0 ? 'text-red-500' : 'text-slate-800'}`}>
        {value > 0 ? '+' : ''}{value}
      </div>
    </div>
  </div>
);


