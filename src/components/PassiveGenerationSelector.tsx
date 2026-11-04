import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { CopyPlus, Trophy, Church } from 'lucide-react';
import { TRIBUTARY_MIN_AGE } from '../utils/calculator';

const STONE_ICON = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/stone.png';
const GOLD_ICON = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/gold.png';
const FOOD_ICON = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/food.png';

export const PassiveGenerationSelector = () => {
  const { civ, age, mode, ovooCount, ovooDoubleProduction, sacredSites, relics, setRelics, tributaries, tributaryFoodRate, setTributaryFoodRate, setOvoo, setSacredSites, setTributaries, mongolEconomy, setMongolEconomy } = useCalculatorStore();

  const isMongolVariant = civ === 'mo' || civ === 'gol';
  const isJin = civ === 'jin';

  return (
    <div className="space-y-4">
      {civ === 'mo' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="font-bold">Mongol Landmark Choices</h3>
          {([
            ['deerStones', 2, 'Deer Stones', 'Silver Tree'],
            ['steppeRedoubt', 3, 'Steppe Redoubt', 'Kurultai'],
            ['whiteStupa', 4, 'White Stupa', 'Khaganate Palace'],
          ] as const).map(([key, minAge, selected, alternative]) => (
            <label key={key} className="block text-sm">
              <input type="checkbox" checked={Boolean(mongolEconomy[key])} disabled={age < minAge} onChange={e => setMongolEconomy({ [key]: e.target.checked })} className="mr-2" />
              {selected} (Age {minAge}; alternative: {alternative})
            </label>
          ))}
          <p className="text-xs text-slate-500">Unchecked means the alternative landmark (or not yet built). Alternatives are exclusive; only the listed economy effect is modeled.</p>
          <p className="text-xs text-slate-500">Steppe Redoubt assumes all gold gatherers deposit there. White Stupa assumes selected double-production buildings are within its influence. Deer Stones movement benefits are not a flat gather-rate bonus.</p>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 w-full border-l-4 border-l-amber-500">
        <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Passive Generation
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sacred Sites */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={GOLD_ICON} alt="Gold" className="w-5 h-5 object-contain" />
                <span className="text-sm font-medium text-slate-700">Sacred Sites</span>
              </div>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSacredSites(count)}
                    className={`w-8 h-8 rounded text-sm font-bold transition-colors ${sacredSites === count ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Relics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Church className="w-5 h-5 text-amber-700" />
                <span className="text-sm font-medium text-slate-700">Relics</span>
              </div>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setRelics(count)}
                    className={`w-8 h-8 rounded text-sm font-bold transition-colors ${relics === count ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Ovoos (Only for Mongols/Golden Horde) */}
          {isMongolVariant && (
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={STONE_ICON} alt="Stone" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-medium text-slate-700">Ovoos</span>
                </div>
                <div className="flex items-center gap-2">
                  {(civ === 'mo' ? [0, 1] : [0, 1, 2, 3]).map((count) => (
                    <button
                      key={count}
                      onClick={() => setOvoo(count, ovooDoubleProduction)}
                      className={`w-8 h-8 rounded text-sm font-bold transition-colors ${ovooCount === count ? 'bg-[var(--civ-primary)] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'resource' ? (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <CopyPlus className="w-4 h-4 text-[var(--civ-primary)]" /> Double Production
                    </span>
                    <span className="text-xs text-slate-500">Spend stone to produce 2x units</span>
                  </div>
                  <button
                    onClick={() => setOvoo(ovooCount, !ovooDoubleProduction)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${ovooDoubleProduction ? 'bg-[var(--civ-primary)]' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${ovooDoubleProduction ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-xs text-slate-400 italic">
                  Enable double production per unit using the stone button in the unit list above
                </div>
              )}
            </div>
          )}

          {/* Tributary States (Only for Jin Dynasty) */}
          {isJin && (
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={FOOD_ICON} alt="Food" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-medium text-slate-700">Tributary States</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => setTributaries(count)}
                      disabled={age < TRIBUTARY_MIN_AGE}
                      className={`w-8 h-8 rounded text-sm font-bold transition-colors ${tributaries === count ? 'bg-[var(--civ-primary)] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 text-xs text-slate-500">
                Available from Age III. Each state increases the Mounted Villager limit by 3.
                Food generation must be entered manually; no unverified rate is assumed.
              </div>
              <label className="block text-xs text-slate-600">
                Food/min per state (user-provided)
                <input
                  type="number"
                  min="0"
                  disabled={age < TRIBUTARY_MIN_AGE}
                  value={tributaryFoodRate}
                  onChange={(e) => setTributaryFoodRate(Number(e.target.value))}
                  className="block mt-2 w-28 p-2 border rounded bg-white"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
