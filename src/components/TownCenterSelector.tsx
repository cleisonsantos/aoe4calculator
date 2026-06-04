import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useAoE4Data } from '../hooks/useAoE4Data';
import { calculateRPM, getVillagerStats, getEffectiveRates } from '../utils/calculator';
import { Home, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const TownCenterSelector = () => {
  const { tcProducingVillagers, setTcProducingVillagers, age, mode, civ, villagers, activeTechs } = useCalculatorStore();
  const { units: allUnits } = useAoE4Data();

  // Max TCs: only the starting TC in Dark Age; no hard cap from Feudal+
  const maxTcs = age === 1 ? 1 : 10;

  // ── TC Food Sustainability Analysis (Resource Mode) ──
  const villagerStats = (allUnits?.length && civ)
    ? getVillagerStats(allUnits, civ)
    : { cost: 50, time: 20 };

  const villagersPerMinutePerTc = 60 / villagerStats.time;
  const foodDrainPerTc = villagersPerMinutePerTc * villagerStats.cost;
  const totalFoodDrain = tcProducingVillagers * foodDrainPerTc;

  const rpm = (allUnits?.length && civ)
    ? calculateRPM(villagers, civ, age, activeTechs)
    : { food: 0, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 };

  const currentFoodRpm = rpm.food;
  const foodSurplus = currentFoodRpm - totalFoodDrain;

  const effRates = (allUnits?.length && civ)
    ? getEffectiveRates(civ, age, activeTechs)
    : { food: 40, wood: 40, gold: 40, stone: 40, oliveoil: 40, silver: 40 };
  const suggestedFoodVills = totalFoodDrain > 0 ? Math.ceil(totalFoodDrain / effRates.food) : 0;
  const maxTcSupported = currentFoodRpm > 0 ? Math.floor(currentFoodRpm / foodDrainPerTc) : 0;

  const currentFoodVills = villagers.food_sheep + villagers.food_berries + villagers.food_deer + villagers.food_boar + villagers.food_farms + villagers.food_fish + villagers.food_deep_fish;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
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
            🏠 {tcProducingVillagers} TC producing {tcProducingVillagers === 1 ? 'villager' : 'villagers'} → ~{Math.round(tcProducingVillagers * villagersPerMinutePerTc)}/min
          </div>
        </div>
      )}

      {/* ── Food Sustainability Analysis in Resource Mode ── */}
      {mode === 'resource' && tcProducingVillagers > 0 && (
        <div className="mt-4 space-y-3">
          <div className={`p-3 rounded-lg border-2 ${
            foodSurplus >= 0
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {foodSurplus >= 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <span className={`font-bold text-sm ${
                foodSurplus >= 0 ? 'text-green-800' : 'text-amber-800'
              }`}>
                {foodSurplus >= 0
                  ? 'Can sustain TC production'
                  : 'Not enough food for TCs'}
              </span>
            </div>
            <p className={`text-xs ${
              foodSurplus >= 0 ? 'text-green-700' : 'text-amber-700'
            }`}>
              {foodSurplus >= 0
                ? `You produce ${currentFoodRpm} food/min. TCs consume ${Math.round(totalFoodDrain)} food/min. ${Math.round(foodSurplus)} food/min surplus.`
                : `TCs need ${Math.round(totalFoodDrain)} food/min, but you only produce ${currentFoodRpm} food/min. Need ${Math.round(Math.abs(foodSurplus))} more food/min.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium uppercase mb-1">Food on villagers</div>
              <div className="text-lg font-bold text-slate-800">{currentFoodVills}</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium uppercase mb-1">Suggested on food</div>
              <div className={`text-lg font-bold ${currentFoodVills >= suggestedFoodVills ? 'text-green-600' : 'text-amber-600'}`}>
                {suggestedFoodVills}
              </div>
              <div className="text-[10px] text-slate-400">{Math.round(effRates.food)} food/min each</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium uppercase mb-1">Food drain from TCs</div>
              <div className="text-lg font-bold text-slate-800">{Math.round(totalFoodDrain)} <span className="text-xs font-normal text-slate-500">/min</span></div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium uppercase mb-1">Max TCs supported</div>
              <div className={`text-lg font-bold ${maxTcSupported >= tcProducingVillagers ? 'text-green-600' : 'text-red-500'}`}>{maxTcSupported}</div>
            </div>
          </div>

          {tcProducingVillagers > maxTcSupported && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>You need {suggestedFoodVills - currentFoodVills} more villagers on food (or improve your food gather rate with techs) to sustain {tcProducingVillagers} TCs.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
