export interface CivData {
  id: string;
  name: string;
}

export interface Cost {
  food: number;
  wood: number;
  gold: number;
  stone: number;
  time?: number;
  popcap?: number;
}

export interface UnitData {
  id: string;
  baseId: string;
  name: string;
  civs: string[];
  costs: Cost;
  producedBy: string[];
  icon: string;
  classes?: string[];
  age: number;
  description?: string;
  hitpoints?: number;
  armor?: { type: string; value: number }[];
  weapons?: { name: string; type: string; damage: number; range?: { min: number; max: number } }[];
  movement?: { speed: number };
}

export interface TechData {
  age?: number;
  description?: string;
  id: string;
  baseId: string;
  name: string;
  civs: string[];
  costs: Cost;
  icon: string;
  effects?: {
    property: string;
    select?: {
      id?: string[];
      class?: string[][];
    };
    effect: 'multiply' | 'change';
    value: number;
    type: string; // 'gatherRate', 'hitpoints', etc.
  }[];
}

export interface BuildingData {
  id: string;
  baseId: string;
  name: string;
  civs: string[];
  costs: Cost;
  age: number;
  icon: string;
}

export const fetchBuildings = async (): Promise<BuildingData[]> => {
  const res = await fetch('https://data.aoe4world.com/buildings/all.json');
  if (!res.ok) throw new Error('Failed to fetch buildings');
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
};

export const fetchUnits = async (): Promise<UnitData[]> => {
  const res = await fetch('https://data.aoe4world.com/units/all.json');
  if (!res.ok) throw new Error('Failed to fetch units');
  const data = await res.json();
  return data.data;
};

export const fetchTechnologies = async (): Promise<TechData[]> => {
  const res = await fetch('https://data.aoe4world.com/technologies/all.json');
  if (!res.ok) throw new Error('Failed to fetch technologies');
  const data = await res.json();
  return data.data;
};
