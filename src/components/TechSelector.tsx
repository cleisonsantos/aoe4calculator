import React, { useState } from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { CostDisplay } from './ResourceIcon';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CORE_ECO_TECHS = {
  tier1: ['wheelbarrow'],
  tier2: ['double-broadax', 'horticulture', 'specialized-pick'],
  tier3: ['lumber-preservation', 'fertilization', 'shaft-mining'],
  tier4: ['crosscut-saw', 'cross-breeding', 'cupellation'], 
};

export const TechSelector = ({ techs }: { techs: any[] }) => {
  const { civ, activeTechs, toggleTech } = useCalculatorStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getTechForCiv = (baseId: string) => {
    const matches = techs.filter(t => t.baseId === baseId || t.baseId.includes(baseId));
    const exact = matches.find(t => t.civs.includes(civ));
    return exact || matches[0];
  };

  const renderTechTier = (title: string, techIds: string[]) => (
    <div className="mb-4 last:mb-0">
      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {techIds.map(id => {
          const tech = getTechForCiv(id);
          if (!tech) return null;

          const isActive = activeTechs.includes(id);

          return (
            <button
              key={id}
              onClick={() => toggleTech(id)}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded border transition-all ${
                isActive
                  ? 'bg-[var(--civ-primary)] border-[var(--civ-primary)] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title={tech.name}
            >
              <img src={tech.icon} alt={tech.name} className="w-8 h-8 rounded-sm object-cover bg-slate-900" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{tech.name}</span>
                <CostDisplay costs={tech.costs} compact />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 w-full">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex justify-between items-center border-b pb-2 border-slate-100 group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-slate-800">
            Economic Upgrades
          </h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {activeTechs.length} Active
          </span>
        </div>
        {isCollapsed ? (
          <div className="flex items-center gap-1 text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
            Show <ChevronDown className="w-4 h-4" />
          </div>
        ) : (
          <div className="flex items-center gap-1 text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
            Hide <ChevronUp className="w-4 h-4" />
          </div>
        )}
      </button>
      
      {!isCollapsed && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {renderTechTier('Core & Age 1', CORE_ECO_TECHS.tier1)}
          {renderTechTier('Age 2 Upgrades', CORE_ECO_TECHS.tier2)}
          {renderTechTier('Age 3 Upgrades', CORE_ECO_TECHS.tier3)}
          {renderTechTier('Age 4 Upgrades', CORE_ECO_TECHS.tier4)}
        </div>
      )}
    </div>
  );
};
