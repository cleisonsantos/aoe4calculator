import React from 'react';
import { useCalculatorStore, type VillagerAllocation as VAlloc } from '../store/useCalculatorStore';

const RESOURCE_BASE_URL = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources';

const foodEmojis: Record<string, string> = {
  food_sheep: '🐑',
  food_berries: '🫐',
  food_deer: '🦌',
  food_boar: '🐗',
  food_farms: '🌾',
  food_fish: '🐟',
  food_deep_fish: '🐋',
};

const resourceIcons: Record<string, string> = {
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
  food_fish: 'Fish',
  food_deep_fish: 'Deep Sea',
  wood: 'Wood',
  gold: 'Gold',
  stone: 'Stone',
  oliveoil: 'Olive Oil',
  silver: 'Silver',
};

export const VillagerAllocator = () => {
  const { villagers, setVillagers } = useCalculatorStore();

  const totalVills = Object.values(villagers).reduce((a, b) => a + b, 0);

  const renderAllocator = (key: keyof VAlloc) => {
    const isFood = key.startsWith('food_');
    const emoji = foodEmojis[key as keyof typeof foodEmojis];

    return (
    <div key={key} className="flex flex-col gap-2 p-2 bg-slate-50 rounded-md border border-slate-100">
      <div className="flex items-center gap-2">
        {isFood ? (
          <span className="text-lg leading-none">{emoji}</span>
        ) : (
          <img 
            src={resourceIcons[key]} 
            alt={labels[key]} 
            className="w-5 h-5 object-contain"
          />
        )}
        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{labels[key]}</span>
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
            if (val > 200) val = 200;
            setVillagers(key, val);
          }}
          className="w-full p-2 text-lg font-bold border rounded text-center font-mono focus:outline-none focus:border-[var(--civ-primary)] focus:ring-1 focus:ring-[var(--civ-primary)] bg-white shadow-sm"
        />
      </div>
    </div>
  );
  };

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
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
        {renderAllocator('food_sheep')}
        {renderAllocator('food_berries')}
        {renderAllocator('food_deer')}
        {renderAllocator('food_boar')}
        {renderAllocator('food_farms')}
        {renderAllocator('food_fish')}
        {renderAllocator('food_deep_fish')}
        {renderAllocator('wood')}
        {renderAllocator('gold')}
        {renderAllocator('stone')}
        {renderAllocator('oliveoil')}
        {renderAllocator('silver')}
      </div>
    </div>
  );
};
