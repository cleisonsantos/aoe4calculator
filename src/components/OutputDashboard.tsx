import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import {
  calculateRPM,
  calculateProductionDrain,
  calculateMaxProduction,
  calculateRequiredVillagers,
  calculateVillagerProduction,
} from '../utils/calculator';
import { CostDisplay } from './ResourceIcon';
import { useAoE4Data } from '../hooks/useAoE4Data';
import { Pickaxe, Swords, Users, Home, AlertTriangle, CheckCircle } from 'lucide-react';

const RESOURCE_BASE_URL = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources';

export const OutputDashboard = () => {
  const { mode } = useCalculatorStore();

  return (
    <div className="sticky top-4 space-y-4">
      {mode === 'resource' ? <ResourceModeOutput /> : <UnitsModeOutput />}
    </div>
  );
};

// ── Resource Mode: show RPM + max sustainable production ──

const ResourceModeOutput = () => {
  const { villagers, civ, age, activeTechs, ovooCount, ovooDoubleProduction, sacredSites } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  const rpm = calculateRPM(villagers, civ, age, activeTechs, ovooCount, sacredSites);

  // Available military units for this civ/age
  const availableUnits = allUnits.filter(u =>
    u.civs.includes(civ) &&
    u.classes?.includes('military') &&
    !u.classes?.includes('ship') &&
    u.age <= age
  );

  const maxProd = calculateMaxProduction(rpm, availableUnits, civ, ovooDoubleProduction);

  // Sort by max sustainable descending
  const sorted = [...maxProd].sort((a, b) => b.maxSustainable - a.maxSustainable);

  return (
    <>
      {/* RPM Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
          <Pickaxe className="w-5 h-5 text-[var(--civ-primary)]" />
          Income (RPM)
        </h3>

        <div className="grid grid-cols-2 gap-3">
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

      {/* Max Sustainable Production */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-lg font-bold mb-3 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
          <Swords className="w-5 h-5 text-[var(--civ-primary)]" />
          Max Sustainable Production
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          How many of each unit your economy can continuously sustain (solo).
        </p>

        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No units available for this age.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {sorted.slice(0, 20).map(entry => (
              <div key={entry.unitId} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <img src={entry.icon} alt={entry.unitName} className="w-7 h-7 rounded bg-slate-900" />
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{entry.unitName}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{entry.maxSustainable.toFixed(1)}</span>
                  <span className="text-xs text-slate-500 ml-1">/min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ── Units Mode: show required villagers for desired production ──

const UnitsModeOutput = () => {
  const {
    civ, age, activeTechs,
    units: activeUnits,
    ovooCount, ovooDoubleProduction, sacredSites,
    tcProducingVillagers, villagers
  } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  const required = calculateRequiredVillagers(
    activeUnits, allUnits, civ, age, activeTechs,
    ovooDoubleProduction, ovooCount, sacredSites,
    tcProducingVillagers
  );

  const { perUnit, total: unitDrain } = calculateProductionDrain(activeUnits, allUnits, civ, ovooDoubleProduction);
  
  // Calculate RPM for villager production analysis based on REQUIRED villagers in Units Mode
  // this ensures the analysis shows if the REQUIRED economy is sufficient
  const requiredVillagersAllocation = {
    food_sheep: 0, food_berries: 0, food_deer: 0, food_boar: 0,
    food_farms: required.food,
    wood: required.wood,
    gold: required.gold,
    stone: required.stone,
    oliveoil: 0,
    silver: 0
  };
  const rpm = calculateRPM(requiredVillagersAllocation, civ, age, activeTechs, ovooCount, sacredSites);
  const villagerAnalysis = calculateVillagerProduction(rpm, tcProducingVillagers, unitDrain);

  return (
    <>
      {/* Required Villagers Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--civ-primary)]" />
          Required Villagers
        </h3>

        {activeUnits.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Select units to see the required economy.</p>
        ) : (
          <>
            {/* Total */}
            <div className="bg-[var(--civ-primary)]/10 border border-[var(--civ-primary)]/20 rounded-lg p-4 mb-4 text-center">
              <div className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-1">Total Villagers Needed</div>
              <div className="text-4xl font-black text-[var(--civ-primary)]">{required.total}</div>
            </div>

            {/* Per resource */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <VillagerCard
                iconUrl={`${RESOURCE_BASE_URL}/food.png`}
                label="Food"
                count={required.food}
              />
              <VillagerCard
                iconUrl={`${RESOURCE_BASE_URL}/wood.png`}
                label="Wood"
                count={required.wood}
              />
              <VillagerCard
                iconUrl={`${RESOURCE_BASE_URL}/gold.png`}
                label="Gold"
                count={required.gold}
              />
              <VillagerCard
                iconUrl={`${RESOURCE_BASE_URL}/stone.png`}
                label="Stone"
                count={required.stone}
              />
            </div>
          </>
        )}
      </div>

      {/* Production Summary */}
      {activeUnits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h3 className="text-lg font-bold mb-3 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
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
                      <img src={uDef.icon} className="w-6 h-6 rounded bg-slate-900" alt={uDef.name} />
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
      )}

      {/* Villager Production Analysis */}
      {activeUnits.length > 0 && tcProducingVillagers > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h3 className="text-lg font-bold mb-3 text-slate-800 border-b pb-2 border-slate-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-[var(--civ-primary)]" />
            Villager Production Analysis
          </h3>
          
          <div className={`mb-4 p-4 rounded-lg border-2 ${
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
              <div className="text-xs text-slate-500 mt-1">50 food × 2.4 vill/min/TC</div>
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
    <img src={iconUrl} alt={label} className="w-6 h-6 object-contain" />
    <div>
      <div className="text-xs text-slate-500 font-medium uppercase">{label}</div>
      <div className={`text-xl font-bold ${value < 0 ? 'text-red-500' : 'text-slate-800'}`}>
        {value > 0 ? '+' : ''}{value}
      </div>
    </div>
  </div>
);

const VillagerCard = ({ iconUrl, label, count }: { iconUrl: string; label: string; count: number }) => (
  <div className="flex items-center p-3 rounded bg-slate-50 border border-slate-100 gap-3">
    <img src={iconUrl} alt={label} className="w-6 h-6 object-contain" />
    <div>
      <div className="text-xs text-slate-500 font-medium uppercase">{label}</div>
      <div className="text-xl font-bold text-slate-800">
        {count} <span className="text-xs font-normal text-slate-400">vills</span>
      </div>
    </div>
  </div>
);
