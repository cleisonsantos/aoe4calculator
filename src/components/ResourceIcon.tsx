import React from 'react';

const RESOURCE_BASE_URL = 'https://raw.githubusercontent.com/aoe4world/explorer/main/assets/resources';

const resourceMap: Record<string, { url: string; label: string; color: string }> = {
  food: { url: `${RESOURCE_BASE_URL}/food.png`, label: 'Food', color: 'text-red-500' },
  wood: { url: `${RESOURCE_BASE_URL}/wood.png`, label: 'Wood', color: 'text-amber-700' },
  gold: { url: `${RESOURCE_BASE_URL}/gold.png`, label: 'Gold', color: 'text-yellow-500' },
  stone: { url: `${RESOURCE_BASE_URL}/stone.png`, label: 'Stone', color: 'text-slate-400' },
  time: { url: `${RESOURCE_BASE_URL}/time.png`, label: 'Time', color: 'text-blue-400' },
  oliveoil: { url: `${RESOURCE_BASE_URL}/oliveoil.png`, label: 'Olive Oil', color: 'text-green-600' },
};

interface ResourceIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResourceIcon = ({ type, size = 'md', className = '' }: ResourceIconProps) => {
  const resource = resourceMap[type];
  if (!resource) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <img
      src={resource.url}
      alt={resource.label}
      title={resource.label}
      className={`${sizeClasses[size]} object-contain ${className}`}
    />
  );
};

interface CostDisplayProps {
  costs: {
    food?: number;
    wood?: number;
    gold?: number;
    stone?: number;
    time?: number;
    oliveoil?: number;
  };
  compact?: boolean;
  showTime?: boolean;
}

export const CostDisplay = ({ costs, compact = false, showTime = false }: CostDisplayProps) => {
  const entries = [
    { type: 'food', value: costs.food },
    { type: 'wood', value: costs.wood },
    { type: 'gold', value: costs.gold },
    { type: 'stone', value: costs.stone },
    { type: 'oliveoil', value: costs.oliveoil },
  ].filter(e => e.value && e.value > 0);

  if (showTime && costs.time && costs.time > 0) {
    entries.push({ type: 'time', value: costs.time });
  }

  if (entries.length === 0) return null;

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2.5'} flex-wrap`}>
      {entries.map(({ type, value }) => (
        <div key={type} className="flex items-center gap-0.5">
          <ResourceIcon type={type} size={compact ? 'sm' : 'md'} />
          <span className={`font-semibold tabular-nums ${compact ? 'text-[10px]' : 'text-xs'} text-slate-600`}>
            {type === 'time' ? `${value}s` : value}
          </span>
        </div>
      ))}
    </div>
  );
};
