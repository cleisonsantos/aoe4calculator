import { create } from 'zustand';
import { getMountedVillagerLimit, getTributaryCount, normalizeMountedVillagers } from '../utils/calculator';

export interface VillagerAllocation {
  food_sheep: number;
  food_berries: number;
  food_deer: number;
  food_boar: number;
  food_farms: number;
  food_fish: number;
  food_deep_fish: number;
  wood: number;
  gold: number;
  stone: number;
  oliveoil: number;
  silver: number;
}

export interface ProductionUnit {
  id: string; // unit baseId
  buildings: number; // how many buildings are producing this
  doubleProduced?: boolean; // Ovoo double production for this unit (Mongols/Golden Horde)
}

export type CalculatorMode = 'resource' | 'unit';

interface CalculatorState {
  mode: CalculatorMode;
  civ: string;
  age: number;
  villagers: VillagerAllocation;
  mountedVillagers: VillagerAllocation;
  villagerType: 'regular' | 'mounted';
  tributaryFoodRate: number;
  activeTechs: string[];
  units: ProductionUnit[];
  ovooCount: number; // For Mongols/Golden Horde
  ovooDoubleProduction: boolean; // For Mongols/Golden Horde
  sacredSites: number;
  relics: number;
  tributaries: number; // For Jin Dynasty (Tributary States, 0-3)
  tcProducingVillagers: number; // Number of Town Centers producing villagers

  // Actions
  setMode: (mode: CalculatorMode) => void;
  setCiv: (civ: string) => void;
  setAge: (age: number) => void;
  setVillagers: (type: keyof VillagerAllocation, count: number) => void;
  setMountedVillagers: (type: keyof VillagerAllocation, count: number) => void;
  setVillagerType: (type: 'regular' | 'mounted') => void;
  setTributaryFoodRate: (rate: number) => void;
  toggleTech: (techId: string) => void;
  setUnitProduction: (id: string, buildings: number) => void;
  toggleDoubleProduction: (id: string) => void;
  setOvoo: (count: number, double: boolean) => void;
  setSacredSites: (count: number) => void;
  setRelics: (count: number) => void;
  setTributaries: (count: number) => void;
  setTcProducingVillagers: (count: number) => void;
  loadFromUrl: (query: string) => void;
}

const defaultVillagers: VillagerAllocation = {
  food_sheep: 6,
  food_berries: 0,
  food_deer: 0,
  food_boar: 0,
  food_farms: 0,
  food_fish: 0,
  food_deep_fish: 0,
  wood: 0,
  gold: 0,
  stone: 0,
  oliveoil: 0,
  silver: 0,
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  mode: 'unit' as CalculatorMode,
  civ: 'en', // Default English
  age: 1,
  villagers: defaultVillagers,
  mountedVillagers: normalizeMountedVillagers({}, 1),
  villagerType: 'regular',
  tributaryFoodRate: 0,
  activeTechs: [],
  units: [],
  ovooCount: 0,
  ovooDoubleProduction: false,
  sacredSites: 0,
  relics: 0,
  tributaries: 0,
  tcProducingVillagers: 1, // Default: 1 TC producing villagers (starting TC)

  setMode: (mode) => set({ mode }),
  setCiv: (civ) => set({ civ, activeTechs: [], units: [], sacredSites: 0, relics: 0, ovooCount: 0, ovooDoubleProduction: false, tributaries: 0, mountedVillagers: normalizeMountedVillagers({}, 1), villagerType: 'regular', tributaryFoodRate: 0 }), // Reset on civ change
  setAge: (age) => set((state) => {
    const tributaries = getTributaryCount(state.civ, age, state.tributaries);
    return { age, tributaries, mountedVillagers: normalizeMountedVillagers(state.mountedVillagers, age, tributaries) };
  }),
  setVillagers: (type, count) =>
    set((state) => ({ villagers: { ...state.villagers, [type]: count } })),
  setMountedVillagers: (type, count) => set((state) => {
    if (type === 'food_deep_fish') return {};
    const otherCount = Object.entries(state.mountedVillagers)
      .reduce((total, [key, value]) => total + (key === type ? 0 : value), 0);
    const limit = getMountedVillagerLimit(state.age, state.tributaries);
    const value = Number.isFinite(count) ? Math.min(limit - otherCount, Math.max(0, Math.floor(count))) : 0;
    return { mountedVillagers: state.civ === 'jin'
      ? { ...state.mountedVillagers, [type]: value }
      : normalizeMountedVillagers({}, state.age) };
  }),
  setVillagerType: (villagerType) => set((state) => ({ villagerType: state.civ === 'jin' ? villagerType : 'regular' })),
  setTributaryFoodRate: (rate) => set({ tributaryFoodRate: Number.isFinite(rate) ? Math.max(0, rate) : 0 }),
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
  toggleDoubleProduction: (id) =>
    set((state) => ({
      units: state.units.map((u) =>
        u.id === id ? { ...u, doubleProduced: !u.doubleProduced } : u
      ),
    })),
  setOvoo: (count, double) => set({ ovooCount: count, ovooDoubleProduction: double }),
  setSacredSites: (count) => set({ sacredSites: count }),
  setRelics: (count) => set({ relics: count }),
  setTributaries: (count) => set((state) => {
    const tributaries = getTributaryCount(state.civ, state.age, count);
    return { tributaries, mountedVillagers: normalizeMountedVillagers(state.mountedVillagers, state.age, tributaries) };
  }),
  setTcProducingVillagers: (count) => set({ tcProducingVillagers: count }),
  
  loadFromUrl: (query: string) => {
    try {
      const params = new URLSearchParams(query);
      const civ = params.get('civ') || 'en';
      const age = Math.max(1, Math.min(4, parseInt(params.get('age') || '1', 10) || 1));
      
      const villagers = { ...defaultVillagers };
      Object.keys(defaultVillagers).forEach((k) => {
        const val = params.get(k);
        if (val) villagers[k as keyof VillagerAllocation] = Math.max(0, Math.min(200, parseInt(val, 10) || 0));
      });
      
      const techs = params.get('techs') ? params.get('techs')!.split(',') : [];
      const ovooCount = Math.max(0, Math.min(3, parseInt(params.get('oc') || '0', 10) || 0));
      const ovooDoubleProduction = params.get('od') === 'true';
      const sacredSites = Math.max(0, Math.min(3, parseInt(params.get('ss') || '0', 10) || 0));
      const relics = Math.max(0, Math.min(5, parseInt(params.get('rl') || '0', 10) || 0));
      const tributaries = getTributaryCount(civ, age, Number(params.get('tb') || 0));
      const rawTributaryFoodRate = Number(params.get('tfr') || 0);
      const tributaryFoodRate = civ === 'jin' && Number.isFinite(rawTributaryFoodRate)
        ? Math.max(0, rawTributaryFoodRate) : 0;
      const villagerType = civ === 'jin' && params.get('vt') === 'mounted' ? 'mounted' : 'regular';
      const mountedVillagers = normalizeMountedVillagers(
        civ === 'jin' ? Object.fromEntries(Object.keys(defaultVillagers)
          .map(key => [key, Number(params.get(`mv_${key}`) || 0)])) : {},
        age, tributaries
      );
      const rawTc = Number(params.get('tc') ?? 1);
      const tcProducingVillagers = Number.isFinite(rawTc)
        ? Math.max(0, Math.min(age === 1 ? 1 : 10, Math.floor(rawTc))) : 1;

      const mode = (params.get('mode') === 'resource' ? 'resource' : 'unit') as CalculatorMode;

      // Parse units: "horseman:1:d,archer:2" (":d" = doubleProduced)
      const uParam = params.get('u');
      const units: ProductionUnit[] = uParam
        ? uParam.split(',').map(part => {
            const segs = part.split(':');
            return {
              id: segs[0],
              buildings: Math.max(1, Math.min(999, parseInt(segs[1] || '1', 10) || 1)),
              doubleProduced: segs[2] === 'd',
            };
          })
        : [];

      set({ mode, civ, age, villagers, mountedVillagers, villagerType, tributaryFoodRate, activeTechs: techs, units, ovooCount, ovooDoubleProduction, sacredSites, relics, tributaries, tcProducingVillagers });
    } catch (e) {
      if (import.meta.env.DEV) console.error("Failed to parse URL params", e);
    }
  }
}));
