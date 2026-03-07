export interface CivData {
  id: string;
  name: string;
}

export interface Cost {
  food: number;
  wood: number;
  gold: number;
  stone: number;
  time: number;
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
}

export interface TechData {
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
