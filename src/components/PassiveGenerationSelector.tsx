import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { CopyPlus, Trophy } from 'lucide-react';

const STONE_ICON = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/stone.png';
const GOLD_ICON = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/gold.png';

export const PassiveGenerationSelector = () => {
  const { civ, ovooCount, ovooDoubleProduction, sacredSites, setOvoo, setSacredSites } = useCalculatorStore();

  const isMongolVariant = civ === 'mo' || civ === 'gol';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 w-full border-l-4 border-l-amber-500">
        <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Passive Generation
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Ovoos (Only for Mongols/Golden Horde) */}
          {isMongolVariant && (
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={STONE_ICON} alt="Stone" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-medium text-slate-700">Ovoos</span>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((count) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
