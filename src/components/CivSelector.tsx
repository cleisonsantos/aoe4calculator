import React, { useEffect } from 'react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { CIVS, getCivFlagUrl } from '../constants/civs';
import clsx from 'clsx';
import { Flag } from 'lucide-react';

export const CivSelector = () => {
  const { civ, setCiv } = useCalculatorStore();

  useEffect(() => {
    const selectedCiv = CIVS.find((c) => c.id === civ) || CIVS[0];
    
    document.documentElement.style.setProperty('--civ-primary', selectedCiv.theme.primary);
    document.documentElement.style.setProperty('--civ-secondary', selectedCiv.theme.secondary);
    document.documentElement.style.setProperty('--civ-primary-hover', selectedCiv.theme.primary + 'CC'); 
  }, [civ]);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-[var(--civ-primary)]">Select Civilization</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
        {CIVS.map((c) => {
          const isActive = c.id === civ;
          return (
            <button
              key={c.id}
              onClick={() => setCiv(c.id)}
              className={clsx(
                "p-1.5 rounded flex flex-col items-center justify-center transition-all border-2 group",
                isActive 
                  ? "border-[var(--civ-primary)] bg-[var(--civ-primary)] text-white shadow-md scale-105" 
                  : "border-slate-200 bg-white text-slate-600 hover:border-[var(--civ-primary)] hover:bg-slate-50"
              )}
              title={c.name}
            >
              <img 
                src={getCivFlagUrl(c)}
                alt={c.name}
                className={clsx(
                  "w-10 h-10 object-contain mb-1 rounded-sm",
                  !isActive && "opacity-80 group-hover:opacity-100"
                )}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextSibling) nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-10 h-10 rounded mb-1 hidden items-center justify-center shadow-sm"
                style={{ backgroundColor: c.theme.primary, color: c.theme.secondary }}
              >
                <Flag className="w-5 h-5" />
              </div>
              <div className="font-bold text-[10px] text-center leading-tight">
                {c.name}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 p-3 bg-slate-100 rounded border border-slate-200 flex items-center gap-3">
        <img 
          src={getCivFlagUrl(CIVS.find(c => c.id === civ) || CIVS[0])}
          alt={CIVS.find(c => c.id === civ)?.name || 'Unknown'}
          className="w-8 h-8 object-contain rounded-sm"
        />
        <span className="font-semibold text-slate-800">
          {CIVS.find(c => c.id === civ)?.name || 'Unknown'} Selected
        </span>
      </div>
    </div>
  );
};
