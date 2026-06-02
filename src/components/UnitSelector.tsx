import React from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { type UnitData } from '../data/api';
import { Plus, Minus, X, Swords, Pickaxe, CopyPlus } from 'lucide-react';
import { CostDisplay } from './ResourceIcon';

const STONE_ICON = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources/stone.png';

const unitTooltip = (u: UnitData) => {
  const costStr = [
    u.costs?.food ? `${u.costs.food}F` : '',
    u.costs?.wood ? `${u.costs.wood}W` : '',
    u.costs?.gold ? `${u.costs.gold}G` : '',
    u.costs?.stone ? `${u.costs.stone}S` : '',
  ].filter(Boolean).join(' ');

  const armorStr = u.armor?.map(a => `${a.type} ${a.value}`).join(', ');
  const weaponStr = u.weapons?.map(w =>
    `${w.name} (${w.type}): ${w.damage}${w.range ? ` range ${w.range.min}-${w.range.max}` : ''}`
  ).join('\n');

  return [
    `${u.name}${u.hitpoints ? `  |  HP: ${u.hitpoints}` : ''}`,
    `Cost: ${costStr}  |  Time: ${u.costs?.time || '?'}s`,
    armorStr ? `Armor: ${armorStr}` : '',
    u.movement?.speed ? `Speed: ${u.movement.speed}` : '',
    weaponStr ? `\n${weaponStr}` : '',
    u.description ? `\n${u.description}` : '',
  ].filter(Boolean).join('\n');
};

export const UnitSelector = ({ units }: { units: UnitData[] }) => {
  const { civ, age, mode, units: activeUnits, setUnitProduction, toggleDoubleProduction } = useCalculatorStore();
  const isMongolVariant = civ === 'mo' || civ === 'gol';

  // Filter available units for current civ and age, dedup by baseId (keep highest age)
  const availableUnits = Object.values(
    units
      .filter(u => u.civs.includes(civ) && u.classes?.includes('military') && !u.classes?.includes('ship') && u.age <= age)
      .reduce((acc, u) => {
        const existing = acc[u.baseId];
        if (!existing || u.age > existing.age) acc[u.baseId] = u;
        return acc;
      }, {} as Record<string, UnitData>)
  );

  // Group by production building loosely
  const getProdBuilding = (u: UnitData) => u.producedBy?.[0] || 'other';

  const isUnitMode = mode === 'unit';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 w-full">
      <div className="flex flex-col mb-6 border-b pb-2 border-slate-100">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Swords className="w-5 h-5 text-[var(--civ-primary)]" />
            {isUnitMode ? 'Desired Army Composition' : 'Production Goals'}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isUnitMode
            ? 'Select the units you want to produce continuously. The panel will show how many villagers you need.'
            : 'Select units to check if your economy can sustain their production.'}
        </p>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Units</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {availableUnits.map(u => {
            const isActive = activeUnits.some(au => au.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => {
                  if (!isActive) setUnitProduction(u.id, 1);
                }}
                className={`flex items-center gap-2 p-1.5 pr-2 border rounded-md transition-all ${
                  isActive 
                    ? 'border-[var(--civ-primary)] bg-[var(--civ-primary)]/5 opacity-60' 
                    : 'border-slate-300 bg-white hover:border-[var(--civ-primary)] hover:bg-slate-50'
                }`}
                title={unitTooltip(u)}
              >
                <img src={u.icon} alt={u.name} className="w-8 h-8 rounded-sm object-cover bg-slate-900 shrink-0" />
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-xs font-bold text-slate-700 truncate w-full">{u.name}</span>
                  <CostDisplay costs={u.costs} compact />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeUnits.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Production</h4>
          {activeUnits.map(au => {
            const unitDef = units.find(u => u.id === au.id && u.civs.includes(civ));
            if (!unitDef) return null;

            return (
              <div key={au.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <img src={unitDef.icon} alt={unitDef.name} className="w-10 h-10 rounded border border-slate-300 bg-slate-900" />
                  <div>
                    <div className="font-bold text-slate-800">{unitDef.name}</div>
                    <div className="text-xs text-slate-500 capitalize mb-1">{getProdBuilding(unitDef).replace('-', ' ')}</div>
                    <CostDisplay costs={unitDef.costs} compact showTime />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {isMongolVariant && mode === 'unit' && (
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => toggleDoubleProduction(au.id)}
                        className={`p-1.5 rounded-md transition-all border ${au.doubleProduced ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300'}`}
                        title={au.doubleProduced ? 'Double production active (costs stone)' : 'Enable double production'}
                      >
                        <img src={STONE_ICON} alt="Ovoo" className="w-4 h-4 object-contain" />
                      </button>
                      {au.doubleProduced && (
                        <span className="text-[9px] font-bold text-amber-600 mt-0.5">2x</span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-right">
                    <div className="text-slate-500 font-medium uppercase tracking-wider">Buildings</div>
                    <div className="font-bold text-slate-700">{au.buildings}x</div>
                  </div>
                  
                  <div className="flex items-center bg-white border border-slate-200 rounded-md">
                    <button 
                      onClick={() => setUnitProduction(au.id, au.buildings - 1)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-l border-r border-slate-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-mono font-medium">{au.buildings}</span>
                    <button 
                      onClick={() => setUnitProduction(au.id, au.buildings + 1)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-r border-l border-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setUnitProduction(au.id, 0)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
