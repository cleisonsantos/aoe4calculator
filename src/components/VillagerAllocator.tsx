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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 w-full">
      <div className="flex justify-between items-center mb-6 border-b pb-2 border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="bg-[var(--civ-primary)] text-white text-sm px-2 py-1 rounded-full">
            {totalVills}
          </span>
          Villager Allocation
        </h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {renderAllocator('food_sheep')}
        {renderAllocator('food_berries')}
        {renderAllocator('food_deer')}
        {renderAllocator('food_boar')}
        {renderAllocator('food_farms')}
        {renderAllocator('wood')}
        {renderAllocator('gold')}
        {renderAllocator('stone')}
        {renderAllocator('oliveoil')}
        {renderAllocator('silver')}
      </div>
    </div>
  );
};
