import React from 'react';
import { useCalculatorStore, type VillagerAllocation as VAlloc } from '../store/useCalculatorStore';

const RESOURCE_BASE_URL = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources';

const icons: Record<keyof VAlloc, string> = {
  food_sheep: `${RESOURCE_BASE_URL}/food.png`,
  food_berries: `${RESOURCE_BASE_URL}/food.png`,
  food_deer: `${RESOURCE_BASE_URL}/food.png`,
  food_boar: `${RESOURCE_BASE_URL}/food.png`,
  food_farms: `${RESOURCE_BASE_URL}/food.png`,
  wood: `${RESOURCE_BASE_URL}/wood.png`,
  gold: `${RESOURCE_BASE_URL}/gold.png`,
  stone: `${RESOURCE_BASE_URL}/stone.png`,
  oliveoil: `${RESOURCE_BASE_URL}/oliveoil.png`,
  silver: `${RESOURCE_BASE_URL}/silver.png`,
};

const labels: Record<keyof VAlloc, string> = {
  food_sheep: 'Sheep',
  food_berries: 'Berries',
  food_deer: 'Deer',
  food_boar: 'Boar',
  food_farms: 'Farms',
  wood: 'Wood',
  gold: 'Gold',
  stone: 'Stone',
  oliveoil: 'Olive Oil',
  silver: 'Silver',
};

export const VillagerAllocator = () => {
  const { villagers, setVillagers } = useCalculatorStore();

  const totalVills = Object.values(villagers).reduce((a, b) => a + b, 0);

  const renderAllocator = (key: keyof VAlloc, showLabel = true) => (
    <div key={key} className="flex flex-col gap-2 p-2 bg-slate-50 rounded-md border border-slate-100">
      <div className="flex items-center gap-2">
        <img 
          src={icons[key]} 
          alt={labels[key]} 
          className="w-5 h-5 object-contain"
        />
        <span className="text-xs font-bold text-slate-700">{labels[key]}</span>
      </div>
      
      <div className="flex items-center">
        <input 
          type="number" 
          min="0"
          max="200"
          value={villagers[key]}
          onChange={(e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 0) val = 0;
            setVillagers(key, val);
          }}
          className="w-full p-2 text-lg font-bold border rounded text-center font-mono focus:outline-none focus:border-[var(--civ-primary)] focus:ring-1 focus:ring-[var(--civ-primary)] bg-white shadow-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 w-full">
      <div className="flex justify-between items-center mb-6 border-b pb-2 border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="bg-[var(--civ-primary)] text-white text-sm px-2 py-1 rounded-full">
            {totalVills}
          </span>
          Villager Allocation
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Food Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
            <img src={icons.food_sheep} className="w-4 h-4" alt="" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Food</span>
          </div>
          {renderAllocator('food_sheep')}
          {renderAllocator('food_berries')}
          {renderAllocator('food_deer')}
          {renderAllocator('food_boar')}
          {renderAllocator('food_farms')}
        </div>

        {/* Wood Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
            <img src={icons.wood} className="w-4 h-4" alt="" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Wood</span>
          </div>
          {renderAllocator('wood')}
        </div>

        {/* Gold Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
            <img src={icons.gold} className="w-4 h-4" alt="" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Gold</span>
          </div>
          {renderAllocator('gold')}
        </div>

        {/* Stone Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
            <img src={icons.stone} className="w-4 h-4" alt="" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Stone</span>
          </div>
          {renderAllocator('stone')}
        </div>

        {/* Olive Oil Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
            <img src={icons.oliveoil} className="w-4 h-4" alt="" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Olive Oil</span>
          </div>
          {renderAllocator('oliveoil')}
        </div>

        {/* Silver Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 mb-1">
            <img src={icons.silver} className="w-4 h-4" alt="" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Silver</span>
          </div>
          {renderAllocator('silver')}
        </div>
      </div>
    </div>
  );
};
