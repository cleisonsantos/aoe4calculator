import { create } from 'zustand';

export interface VillagerAllocation {
  food_sheep: number;
  food_berries: number;
  food_deer: number;
  food_boar: number;
  food_farms: number;
  wood: number;
  gold: number;
  stone: number;
  oliveoil: number;
  silver: number;
}

export interface ProductionUnit {
  id: string; // unit baseId
  buildings: number; // how many buildings are producing this
}

export type CalculatorMode = 'resource' | 'unit';

interface CalculatorState {
  mode: CalculatorMode;
  civ: string;
  age: number;
  villagers: VillagerAllocation;
  activeTechs: string[];
  units: ProductionUnit[];
  ovooCount: number; // For Mongols/Golden Horde
  ovooDoubleProduction: boolean; // For Mongols/Golden Horde
  sacredSites: number;
  
  // Actions
  setMode: (mode: CalculatorMode) => void;
  setCiv: (civ: string) => void;
  setAge: (age: number) => void;
  setVillagers: (type: keyof VillagerAllocation, count: number) => void;
  toggleTech: (techId: string) => void;
  setUnitProduction: (id: string, buildings: number) => void;
  setOvoo: (count: number, double: boolean) => void;
  setSacredSites: (count: number) => void;
  loadFromUrl: (query: string) => void;
}

const defaultVillagers: VillagerAllocation = {
  food_sheep: 6,
  food_berries: 0,
  food_deer: 0,
  food_boar: 0,
  food_farms: 0,
  wood: 0,
  gold: 0,
  stone: 0,
  oliveoil: 0,
  silver: 0,
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  mode: 'resource' as CalculatorMode,
  civ: 'en', // Default English
  age: 1,
  villagers: defaultVillagers,
  activeTechs: [],
  units: [],
  ovooCount: 0,
  ovooDoubleProduction: false,
  sacredSites: 0,

  setMode: (mode) => set({ mode }),
  setCiv: (civ) => set({ civ, activeTechs: [], units: [], sacredSites: 0, ovooCount: 0, ovooDoubleProduction: false }), // Reset on civ change
  setAge: (age) => set({ age }),
  setVillagers: (type, count) => 
    set((state) => ({ villagers: { ...state.villagers, [type]: count } })),
  toggleTech: (techId) => 
    set((state) => ({
      activeTechs: state.activeTechs.includes(techId)
        ? state.activeTechs.filter((id) => id !== techId)
        : [...state.activeTechs, techId],
    })),
  setUnitProduction: (id, buildings) =>
    set((state) => {
      const existing = state.units.find((u) => u.id === id);
      if (existing) {
        if (buildings <= 0) {
          return { units: state.units.filter((u) => u.id !== id) };
        }
        return { units: state.units.map((u) => u.id === id ? { ...u, buildings } : u) };
      }
      if (buildings <= 0) return { units: state.units };
      return { units: [...state.units, { id, buildings }] };
    }),
  setOvoo: (count, double) => set({ ovooCount: count, ovooDoubleProduction: double }),
  setSacredSites: (count) => set({ sacredSites: count }),
  
  loadFromUrl: (query: string) => {
    try {
      const params = new URLSearchParams(query);
      const civ = params.get('civ') || 'en';
      const age = parseInt(params.get('age') || '1', 10);
      
      const villagers = { ...defaultVillagers };
      Object.keys(defaultVillagers).forEach((k) => {
        const val = params.get(k);
        if (val) villagers[k as keyof VillagerAllocation] = parseInt(val, 10);
      });
      
      const techs = params.get('techs') ? params.get('techs')!.split(',') : [];
      const ovooCount = parseInt(params.get('oc') || '0', 10);
      const ovooDoubleProduction = params.get('od') === 'true';
      const sacredSites = parseInt(params.get('ss') || '0', 10);

      const mode = (params.get('mode') === 'unit' ? 'unit' : 'resource') as CalculatorMode;

      set({ mode, civ, age, villagers, activeTechs: techs, ovooCount, ovooDoubleProduction, sacredSites });
    } catch (e) {
      console.error("Failed to parse URL params", e);
    }
  }
}));
