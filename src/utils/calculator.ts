import type { VillagerAllocation, ProductionUnit } from '../store/useCalculatorStore';
import type { UnitData } from '../data/api';

export interface MongolEconomy {
  whiteStupa?: boolean;
  steppeRedoubt?: boolean;
  deerStones?: boolean;
}
// AoE4 World building descriptions; not independently verified in the installed game.
const MONGOL_OVOO_STONE_RATES = [0, 70, 100, 130, 160];
const WHITE_STUPA_STONE_RATE = 240;
const WHITE_STUPA_DOUBLE_COST_MULTIPLIER = 0.5;
const STEPPE_REDOUBT_GOLD_MULTIPLIER = 1.5;
// Description-based estimates: structured API buildTime effects disagree (0.8/0.7).
const MILITARY_ACADEMY_SPEED = 1.33;
const IMPROVED_MILITARY_ACADEMY_SPEED = 1.53;

const hasTech = (techs: string[], id: string) =>
  techs.some(t => t === id || t.replace(/-\d+$/, '') === id);

const mongolTechsAtAge = (techs: string[], age: number) => {
  const minimumAges: Record<string, number> = {
    horticulture: 2, 'horticulture-improved': 2, fertilization: 3, 'precision-cross-breeding': 4,
    'double-broadax': 2, 'double-broadax-improved': 2, 'lumber-preservation': 3, 'crosscut-saw': 4,
    'specialized-pick': 2, 'specialized-pick-improved': 2, 'shaft-mining': 3, cupellation: 4,
    'military-academy': 3, 'military-academy-improved': 3,
    'tithe-barns': 4, 'tithe-barns-improved': 4,
  };
  return techs.filter(t => age >= (minimumAges[t.replace(/-\d+$/, '')] ?? 1));
};

const mongolStoneIncome = (age: number, count = 0, mongol: MongolEconomy = {}) =>
  (Number.isFinite(count) && count >= 1 ? MONGOL_OVOO_STONE_RATES[Math.max(1, Math.min(4, age))] : 0) +
  (age === 4 && mongol.whiteStupa ? WHITE_STUPA_STONE_RATE : 0);

const mongolTithe = (techs: string[], relics: number) => {
  const improved = hasTech(techs, 'tithe-barns-improved');
  const enabled = improved || hasTech(techs, 'tithe-barns');
  return { food: enabled ? relics * (improved ? 60 : 40) : 0,
    wood: enabled ? relics * (improved ? 60 : 40) : 0,
    stone: enabled ? relics * (improved ? 15 : 10) : 0 };
};

export const getDoubleProductionStoneCost = (u: UnitData, mongol: MongolEconomy = {}) =>
  ((u.costs.food || 0) + (u.costs.wood || 0) + (u.costs.gold || 0)) *
  (mongol.whiteStupa ? WHITE_STUPA_DOUBLE_COST_MULTIPLIER : 1);

export const isTrainableUnit = (u: UnitData, civ: string, age: number, mongol: MongolEconomy = {}) => {
  if (!u.civs.includes(civ) || u.age > age || !u.classes?.includes('military')) return false;
  if (civ !== 'mo') return !u.classes.includes('ship');
  if (u.baseId === 'khan' || u.classes.includes('khaganate') ||
      u.baseId.startsWith('khaganate-')) return false;
  if (u.baseId === 'khans-hunter' && !(age >= 2 && mongol.deerStones)) return false;
  return u.producedBy.some(p => ['barracks', 'archery-range', 'stable', 'dock'].includes(p) ||
    (p === 'siege-workshop' && age >= 3));
};

export const calculateBuildingTradeoff = (
  tc: { costs: { wood: number } }, pasture: { costs: { wood: number } }
) => {
  const budget = tc.costs.wood;
  const cost = pasture.costs.wood;
  if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(cost) || cost <= 0)
    return { pastures: 0, remainingWood: Number.isFinite(budget) ? Math.max(0, budget) : 0 };
  const pastures = Math.floor(budget / cost);
  return { pastures, remainingWood: budget - pastures * cost };
};

const mongolProductionSpeed = (u: UnitData, techs: string[]) => {
  if (!u.classes?.some(c => ['infantry', 'cavalry', 'siege', 'transport'].includes(c)) ||
      u.classes.some(c => ['religious', 'support'].includes(c))) return 1;
  return hasTech(techs, 'military-academy-improved') ? IMPROVED_MILITARY_ACADEMY_SPEED :
    hasTech(techs, 'military-academy') ? MILITARY_ACADEMY_SPEED : 1;
};

// ── Villager Unit Helper ──

export interface VillagerStats {
  cost: number; // food cost
  goldCost: number; // gold cost (e.g., 50 for the Jin Mounted Villager)
  time: number; // training time in seconds
}

export interface JinEconomy {
  mountedVillagers?: Partial<VillagerAllocation>;
  villagerType?: 'regular' | 'mounted';
  tributaryFoodRate?: number;
}
// Live API mounted-villager-1 description; Emissaries unlock in Age III.
export const MOUNTED_VILLAGER_BASE_LIMIT = 20;
export const MOUNTED_VILLAGERS_PER_TRIBUTARY = 3;
export const TRIBUTARY_MIN_AGE = 3;

export const getTributaryCount = (civ: string, age: number, count = 0) =>
  civ === 'jin' && age >= TRIBUTARY_MIN_AGE && age <= 4 && Number.isFinite(count)
    ? Math.max(0, Math.min(3, Math.floor(count)))
    : 0;

export const getMountedVillagerLimit = (age: number, tributaries = 0) =>
  MOUNTED_VILLAGER_BASE_LIMIT + MOUNTED_VILLAGERS_PER_TRIBUTARY * getTributaryCount('jin', age, tributaries);

export const normalizeMountedVillagers = (
  allocation: Partial<VillagerAllocation> = {},
  age: number,
  tributaries = 0
): VillagerAllocation => {
  let remaining = getMountedVillagerLimit(age, tributaries);
  return Object.fromEntries(Object.keys(BASE_RATES).map(key => {
    const value = key === 'food_deep_fish' ? 0 : allocation[key as keyof VillagerAllocation] ?? 0;
    const count = Number.isFinite(value) ? Math.min(remaining, Math.max(0, Math.floor(value))) : 0;
    remaining -= count;
    return [key, count];
  })) as VillagerAllocation;
};

const getTributaryFood = (civ: string, age: number, tributaries = 0, rate = 0) =>
  getTributaryCount(civ, age, tributaries) * (Number.isFinite(rate) ? Math.max(0, rate) : 0);

/**
 * Retrieves villager stats (cost and training time) for a specific civilization.
 * Falls back to defaults if villager unit is not found in the data.
 *
 * The villager unit is identified by having "villager" in its classes array.
 * Different civilizations may have different villager units (e.g., "gilded-villager" for Order of the Dragon).
 * Jin has both regular and mounted villagers; mounted production must be explicitly selected.
 */
export const getVillagerStats = (
  allUnits: UnitData[],
  civ: string,
  villagerType: 'regular' | 'mounted' = 'regular'
): VillagerStats => {
  const civVillagers = allUnits.filter(
    u => u.civs.includes(civ) && u.classes?.includes('villager')
  );

  const villagerUnit = civVillagers.find(u =>
    Boolean(u.classes?.includes('mounted_villager')) === (civ === 'jin' && villagerType === 'mounted')
  );

  if (villagerUnit) {
    return {
      cost: villagerUnit.costs.food || 50,
      goldCost: villagerUnit.costs.gold || 0,
      time: villagerUnit.costs.time || 20,
    };
  }

  // Fallback to defaults if not found
  return {
    cost: 50,
    goldCost: 0,
    time: 20,
  };
};

// ── Jin Dynasty constants ──

/**
 * Estimated Mounted Villager work-rate multipliers, excluding travel/deposit cycles.
 * Community measurements: https://www.youtube.com/watch?v=P7mG9TBlBLo
 * Not verified against the current patch; surfaced as estimates in the UI.
 */
export const MOUNTED_VILLAGER_GATHER_MULT = 2.2;
export const MOUNTED_VILLAGER_FARM_MULT = 1.9;

export const BASE_RATES = {
  food_sheep: 45,       // 0.75/s
  food_berries: 41.4,   // 0.69/s
  food_deer: 49.5,      // 0.825/s
  food_boar: 54,        // 0.9/s
  food_farms: 45,       // 0.75/s
  food_fish: 60,        // villager shore fishing
  food_deep_fish: 45,   // fishing boat deep sea
  wood: 45,
  gold: 45,
  stone: 45,
  oliveoil: 40,
  silver: 40,
};

export interface ResourceSet {
  food: number;
  wood: number;
  gold: number;
  stone: number;
  oliveoil: number;
  silver: number;
}

// ── Shared: compute tech & civ multipliers ──

export const getResourceMultipliers = (
  civ: string,
  age: number,
  activeTechs: string[]
) => {
  let food_mult = 1.0;
  if (civ === 'mo') {
    activeTechs = mongolTechsAtAge(activeTechs, age);
    const food = (hasTech(activeTechs, 'horticulture-improved') ? 1.30 :
      hasTech(activeTechs, 'horticulture') ? 1.10 : 1) *
      (hasTech(activeTechs, 'fertilization') ? 1.10 : 1) *
      (hasTech(activeTechs, 'precision-cross-breeding') ? 1.10 : 1);
    const wood = (hasTech(activeTechs, 'double-broadax-improved') ? 1.35 :
      hasTech(activeTechs, 'double-broadax') ? 1.15 : 1) *
      (hasTech(activeTechs, 'lumber-preservation') ? 1.15 : 1) *
      (hasTech(activeTechs, 'crosscut-saw') ? 1.15 : 1);
    const gold = (hasTech(activeTechs, 'specialized-pick-improved') ? 1.35 :
      hasTech(activeTechs, 'specialized-pick') ? 1.15 : 1) *
      (hasTech(activeTechs, 'shaft-mining') ? 1.15 : 1) *
      (hasTech(activeTechs, 'cupellation') ? 1.15 : 1);
    // Carry capacity, movement and tree-felling bonuses are not raw gather-rate multipliers.
    return { food_mult: food, wood_mult: wood, gold_mult: gold, stone_mult: 0,
      oliveoil_mult: 1, silver_mult: 1 };
  }
  let wood_mult = 1.0;
  let gold_mult = 1.0;
  let stone_mult = 1.0;
  let oliveoil_mult = 1.0;
  let silver_mult = 1.0;

  if (activeTechs.includes('wheelbarrow')) {
    food_mult *= 1.05;
    wood_mult *= 1.10;
    gold_mult *= 1.10;
    stone_mult *= 1.10;
    oliveoil_mult *= 1.10;
    silver_mult *= 1.10;
  }

  if (activeTechs.includes('survival-techniques')) food_mult *= 1.10;
  if (activeTechs.includes('forestry')) wood_mult *= 1.10;

  // Mongol Ovoo-improved eco techs
  if (activeTechs.includes('wheelbarrow-improved')) {
    food_mult *= 1.10;
    wood_mult *= 1.15;
    gold_mult *= 1.15;
    stone_mult *= 1.15;
    oliveoil_mult *= 1.15;
    silver_mult *= 1.15;
  }

  if (activeTechs.includes('survival-techniques-improved')) food_mult *= 1.20;
  if (activeTechs.includes('forestry-improved')) wood_mult *= 1.20;

  if (activeTechs.includes('horticulture')) { food_mult *= 1.15; oliveoil_mult *= 1.15; }
  if (activeTechs.includes('horticulture-improved')) food_mult *= 1.30;
  if (activeTechs.includes('fertilization')) { food_mult *= 1.15; oliveoil_mult *= 1.15; }
  if (activeTechs.includes('cross-breeding')) { food_mult *= 1.15; oliveoil_mult *= 1.15; }

  if (activeTechs.includes('double-broadax')) wood_mult *= 1.15;
  if (activeTechs.includes('double-broadax-improved')) wood_mult *= 1.35;
  if (activeTechs.includes('lumber-preservation')) wood_mult *= 1.15;
  if (activeTechs.includes('crosscut-saw')) wood_mult *= 1.15;

  if (activeTechs.includes('specialized-pick')) { gold_mult *= 1.15; stone_mult *= 1.15; silver_mult *= 1.15; }
  if (activeTechs.includes('specialized-pick-improved')) { gold_mult *= 1.35; stone_mult *= 1.35; silver_mult *= 1.35; }
  if (activeTechs.includes('acid-distillation')) { gold_mult *= 1.15; stone_mult *= 1.15; silver_mult *= 1.15; }
  if (activeTechs.includes('cupellation')) { gold_mult *= 1.15; stone_mult *= 1.15; silver_mult *= 1.15; }

  return { food_mult, wood_mult, gold_mult, stone_mult, oliveoil_mult, silver_mult };
};

// ── Effective gather rate per villager (RPM) ──

export const getEffectiveRates = (
  civ: string,
  age: number,
  activeTechs: string[],
  mongol: MongolEconomy = {}
) => {
  const m = getResourceMultipliers(civ, age, activeTechs);

  // Use farms as default food source for reverse calculations
  let foodRate = BASE_RATES.food_farms * m.food_mult;

  // Apply civ-specific bonuses to the default food source (farms)
  if (civ === 'en') {
    const eng_farm_mult = age >= 4 ? 1.30 : age >= 3 ? 1.20 : 1.15;
    foodRate *= eng_farm_mult;
  }

  let woodRate = BASE_RATES.wood * m.wood_mult;
  let goldRate = BASE_RATES.gold * m.gold_mult;
  let stoneRate = BASE_RATES.stone * m.stone_mult;
  let oliveoilRate = BASE_RATES.oliveoil * m.oliveoil_mult;
  let silverRate = BASE_RATES.silver * m.silver_mult;

  // Sheep are the Mongol reverse-calculation food source; farms are unavailable.
  if (civ === 'mo') {
    foodRate = BASE_RATES.food_sheep * m.food_mult;
    if (age >= 3 && mongol.steppeRedoubt) goldRate *= STEPPE_REDOUBT_GOLD_MULTIPLIER;
  }

  // Order of the Dragon: Gilded Villagers gather resources 28% quicker
  if (civ === 'od') {
    foodRate *= 1.28;
    woodRate *= 1.28;
    goldRate *= 1.28;
    stoneRate *= 1.28;
    oliveoilRate *= 1.28;
    silverRate *= 1.28;
  }


  return { food: foodRate, wood: woodRate, gold: goldRate, stone: stoneRate, oliveoil: oliveoilRate, silver: silverRate };
};

// ── Resource Mode: calculateRPM (existing, refactored) ──

export const calculateRPM = (
  villagers: VillagerAllocation,
  civ: string,
  age: number,
  activeTechs: string[],
  ovooCount?: number,
  sacredSites?: number,
  tributaries?: number,
  jin: JinEconomy = {},
  relics = 0,
  mongol: MongolEconomy = {}
): ResourceSet => {
  let rpm: ResourceSet = {
    food: 0,
    wood: 0,
    gold: 0,
    stone: 0,
    oliveoil: 0,
    silver: 0,
  };

  const food_base =
    villagers.food_sheep * BASE_RATES.food_sheep +
    villagers.food_berries * BASE_RATES.food_berries +
    villagers.food_deer * BASE_RATES.food_deer +
    villagers.food_boar * BASE_RATES.food_boar +
    villagers.food_farms * BASE_RATES.food_farms +
    (villagers.food_fish ?? 0) * BASE_RATES.food_fish +
    (villagers.food_deep_fish ?? 0) * BASE_RATES.food_deep_fish;

  const wood_base = villagers.wood * BASE_RATES.wood;
  const gold_base = villagers.gold * BASE_RATES.gold;
  const stone_base = villagers.stone * BASE_RATES.stone;
  const oliveoil_base = villagers.oliveoil * BASE_RATES.oliveoil;
  const silver_base = villagers.silver * BASE_RATES.silver;

  const m = getResourceMultipliers(civ, age, activeTechs);

  // Civ bonuses
  if (civ === 'en') {
    const eng_farm_mult = age >= 4 ? 1.30 : age >= 3 ? 1.20 : 1.15;
    rpm.food += (villagers.food_farms * BASE_RATES.food_farms * eng_farm_mult) - (villagers.food_farms * BASE_RATES.food_farms);
  } else if (civ === 'ab' || civ === 'ay' || civ === 'de') {
    const berry_mult = 1.25;
    rpm.food += (villagers.food_berries * BASE_RATES.food_berries * berry_mult) - (villagers.food_berries * BASE_RATES.food_berries);
  }

  // Apply tech multipliers to all resource bases
  let food_with_techs = food_base * m.food_mult;
  let wood_with_techs = wood_base * m.wood_mult;
  let gold_with_techs = gold_base * m.gold_mult;
  let stone_with_techs = stone_base * m.stone_mult;
  let oliveoil_with_techs = oliveoil_base * m.oliveoil_mult;
  let silver_with_techs = silver_base * m.silver_mult;

  if (civ === 'mo') {
    activeTechs = mongolTechsAtAge(activeTechs, age);
    const huntMultiplier = hasTech(activeTechs, 'survival-techniques-improved') ? 1.25 :
      hasTech(activeTechs, 'survival-techniques') ? 1.15 : 1;
    const hunt = villagers.food_deer * BASE_RATES.food_deer + villagers.food_boar * BASE_RATES.food_boar;
    const nonhunt = villagers.food_sheep * BASE_RATES.food_sheep +
      villagers.food_berries * BASE_RATES.food_berries + (villagers.food_fish ?? 0) * BASE_RATES.food_fish;
    food_with_techs = hunt * huntMultiplier + nonhunt * m.food_mult +
      (villagers.food_deep_fish ?? 0) * BASE_RATES.food_deep_fish;
    stone_with_techs = 0;
    if (age >= 3 && mongol.steppeRedoubt) gold_with_techs *= STEPPE_REDOUBT_GOLD_MULTIPLIER;
    const tithe = mongolTithe(activeTechs, Math.max(0, relics));
    rpm.food += tithe.food;
    rpm.wood += tithe.wood;
    rpm.stone += tithe.stone + mongolStoneIncome(age, ovooCount, mongol);
  }

  // Order of the Dragon: Gilded Villagers gather resources 28% quicker
  if (civ === 'od') {
    food_with_techs *= 1.28;
    wood_with_techs *= 1.28;
    gold_with_techs *= 1.28;
    stone_with_techs *= 1.28;
    oliveoil_with_techs *= 1.28;
    silver_with_techs *= 1.28;
  }

  // Mounted counts are additional workers, not a bonus on every Jin villager.
  if (civ === 'jin') {
    const mounted = normalizeMountedVillagers(jin.mountedVillagers, age, tributaries);
    const mountedFood =
      (mounted.food_sheep * BASE_RATES.food_sheep +
        mounted.food_berries * BASE_RATES.food_berries +
        mounted.food_deer * BASE_RATES.food_deer +
        mounted.food_boar * BASE_RATES.food_boar) * MOUNTED_VILLAGER_GATHER_MULT +
      mounted.food_farms * BASE_RATES.food_farms * MOUNTED_VILLAGER_FARM_MULT;
    // Shore fishing uses workers; deep-sea fishing uses boats, never mounted workers.
    food_with_techs += (mountedFood + mounted.food_fish * BASE_RATES.food_fish * MOUNTED_VILLAGER_GATHER_MULT) * m.food_mult;
    wood_with_techs += mounted.wood * BASE_RATES.wood * MOUNTED_VILLAGER_GATHER_MULT * m.wood_mult;
    gold_with_techs += mounted.gold * BASE_RATES.gold * MOUNTED_VILLAGER_GATHER_MULT * m.gold_mult;
    stone_with_techs += mounted.stone * BASE_RATES.stone * MOUNTED_VILLAGER_GATHER_MULT * m.stone_mult;
    oliveoil_with_techs += mounted.oliveoil * BASE_RATES.oliveoil * MOUNTED_VILLAGER_GATHER_MULT * m.oliveoil_mult;
    silver_with_techs += mounted.silver * BASE_RATES.silver * MOUNTED_VILLAGER_GATHER_MULT * m.silver_mult;
  }

  rpm.food += food_with_techs;
  rpm.wood += wood_with_techs;
  rpm.gold += gold_with_techs;
  rpm.stone += stone_with_techs;
  rpm.oliveoil += oliveoil_with_techs;
  rpm.silver += silver_with_techs;

  if (civ === 'gol' && ovooCount && ovooCount > 0) {
    const ovooRate = age === 1 ? 80 : age === 2 ? 105 : age === 3 ? 130 : 160;
    rpm.stone += ovooRate * ovooCount;
  }

  // Jin Dynasty: Tributary States generate passive food
  rpm.food += getTributaryFood(civ, age, tributaries, jin.tributaryFoodRate);
  if (relics > 0) rpm.gold += 100 * relics;

  if (sacredSites && sacredSites > 0) {
    const siteRate = civ === 'de' ? 150 : 100;
    rpm.gold += siteRate * sacredSites;
  }

  return {
    food: Math.round(rpm.food),
    wood: Math.round(rpm.wood),
    gold: Math.round(rpm.gold),
    stone: Math.round(rpm.stone),
    oliveoil: Math.round(rpm.oliveoil),
    silver: Math.round(rpm.silver),
  };
};

// ── Calculate total resource drain from unit production ──

export interface UnitDrain {
  unitId: string;
  upm: number; // units per minute
  drain: ResourceSet;
}

export const calculateProductionDrain = (
  activeUnits: ProductionUnit[],
  allUnits: UnitData[],
  civ: string,
  mongol: MongolEconomy = {},
  activeTechs: string[] = []
): { perUnit: UnitDrain[]; total: ResourceSet; missingTimeUnits: string[] } => {
  const total: ResourceSet = { food: 0, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 };
  const perUnit: UnitDrain[] = [];
  const missingTimeUnits: string[] = [];

  activeUnits.forEach(au => {
    const uDef = allUnits.find(u => u.id === au.id && u.civs.includes(civ));
    if (!uDef) return;

    const time = typeof uDef.costs.time === 'number'
      ? uDef.costs.time / (civ === 'mo' ? mongolProductionSpeed(uDef, activeTechs) : 1)
      : undefined;
    if (typeof time !== 'number' || !Number.isFinite(time) || time <= 0) {
      missingTimeUnits.push(uDef.id);
      return;
    }
    const foodCost = uDef.costs.food || 0;
    const woodCost = uDef.costs.wood || 0;
    const goldCost = uDef.costs.gold || 0;
    let stoneCost = uDef.costs.stone || 0;

    let upmMultiplier = 1;
    if (civ === 'mo' && au.doubleProduced) {
      upmMultiplier = 2;
      stoneCost += getDoubleProductionStoneCost(uDef, mongol);
    }

    const upm = (60 / time) * upmMultiplier * au.buildings;
    const unitDrain: ResourceSet = {
      food: (foodCost / time) * 60 * au.buildings,
      wood: (woodCost / time) * 60 * au.buildings,
      gold: (goldCost / time) * 60 * au.buildings,
      stone: (stoneCost / time) * 60 * au.buildings,
      oliveoil: 0,
      silver: 0,
    };

    perUnit.push({ unitId: au.id, upm, drain: unitDrain });
    total.food += unitDrain.food;
    total.wood += unitDrain.wood;
    total.gold += unitDrain.gold;
    total.stone += unitDrain.stone;
  });

  return { perUnit, total, missingTimeUnits };
};

// ── Resource Mode output: max sustainable units given current RPM ──

export interface MaxProductionEntry {
  unitId: string;
  unitName: string;
  icon: string;
  maxSustainable: number; // units per minute that can be sustained solo
}

export const calculateMaxProduction = (
  rpm: ResourceSet,
  availableUnits: UnitData[],
  civ: string,
  ovooDoubleProduction: boolean,
  mongol: MongolEconomy = {}
): MaxProductionEntry[] => {
  return availableUnits.map(u => {
    const foodCost = u.costs.food || 0;
    const woodCost = u.costs.wood || 0;
    const goldCost = u.costs.gold || 0;
    let stoneCost = u.costs.stone || 0;

    let upmMultiplier = 1;
    if (civ === 'mo' && ovooDoubleProduction) {
      upmMultiplier = 2;
      stoneCost += getDoubleProductionStoneCost(u, mongol);
    }

    // Income-limited units/min depends on cost, not training time or building count.
    const limits: number[] = [];
    if (foodCost > 0) limits.push(rpm.food / foodCost);
    if (woodCost > 0) limits.push(rpm.wood / woodCost);
    if (goldCost > 0) limits.push(rpm.gold / goldCost);
    if (stoneCost > 0) limits.push(rpm.stone / stoneCost);
    const maxSustainable = limits.length > 0 ? Math.min(...limits) * upmMultiplier : Infinity;

    return {
      unitId: u.id,
      unitName: u.name,
      icon: u.icon,
      maxSustainable: maxSustainable === Infinity
        ? (u.costs.time && u.costs.time > 0 ? 60 / u.costs.time * upmMultiplier : 0)
        : Math.max(0, maxSustainable),
    };
  });
};

// ── Units Mode output: required villagers for desired production ──

export interface RequiredVillagers {
  food: number;
  wood: number;
  gold: number;
  stone: number;
  total: number;
  missingTimeUnits: string[];
  stoneDeficit: number;
}

export const calculateRequiredVillagers = (
  activeUnits: ProductionUnit[],
  allUnits: UnitData[],
  civ: string,
  age: number,
  activeTechs: string[],
  ovooCount?: number,
  sacredSites?: number,
  tcProducingVillagers: number = 0,
  tributaries?: number,
  jin: JinEconomy = {},
  relics = 0,
  mongol: MongolEconomy = {}
): RequiredVillagers => {
  if (civ === 'mo') activeTechs = mongolTechsAtAge(activeTechs, age);
  const { total: drain, missingTimeUnits } = calculateProductionDrain(activeUnits, allUnits, civ,
    { ...mongol, whiteStupa: age === 4 && mongol.whiteStupa }, activeTechs);
  const rates = getEffectiveRates(civ, age, activeTechs, mongol);

  // Get villager stats dynamically from API data
  const villagerStats = getVillagerStats(allUnits, civ, jin.villagerType);
  const VILLAGER_FOOD_COST = villagerStats.cost;
  const VILLAGER_GOLD_COST = villagerStats.goldCost;
  const VILLAGER_TIME = villagerStats.time;
  const villagersPerMinutePerTc = 60 / VILLAGER_TIME;
  const villagerFoodDrain = tcProducingVillagers * villagersPerMinutePerTc * VILLAGER_FOOD_COST;
  // Jin Mounted Villagers also cost gold (65F + 50G)
  const villagerGoldDrain = tcProducingVillagers * villagersPerMinutePerTc * VILLAGER_GOLD_COST;

  // Subtract passive generation before calculating villagers
  let foodDrain = drain.food + villagerFoodDrain;
  let goldDrain = drain.gold + villagerGoldDrain;
  let stoneDrain = drain.stone;
  if (relics > 0) goldDrain = Math.max(0, goldDrain - 100 * relics);

  if (sacredSites && sacredSites > 0) {
    const siteRate = civ === 'de' ? 150 : 100;
    goldDrain = Math.max(0, goldDrain - siteRate * sacredSites);
  }

  if (civ === 'gol' && ovooCount && ovooCount > 0) {
    const ovooRate = age === 1 ? 80 : age === 2 ? 105 : age === 3 ? 130 : 160;
    stoneDrain = Math.max(0, stoneDrain - ovooRate * ovooCount);
  }

  // Jin Dynasty: Tributary States generate passive food — no villagers needed for that part
  foodDrain = Math.max(0, foodDrain - getTributaryFood(civ, age, tributaries, jin.tributaryFoodRate));

  let woodDrain = drain.wood;
  if (civ === 'mo') {
    const tithe = mongolTithe(activeTechs, Math.max(0, relics));
    foodDrain = Math.max(0, foodDrain - tithe.food);
    woodDrain = Math.max(0, woodDrain - tithe.wood);
    stoneDrain = Math.max(0, stoneDrain - mongolStoneIncome(age, ovooCount, mongol) - tithe.stone);
  }

  const foodVills = rates.food > 0 ? Math.ceil(foodDrain / rates.food) : 0;
  const woodVills = rates.wood > 0 ? Math.ceil(woodDrain / rates.wood) : 0;
  const goldVills = rates.gold > 0 ? Math.ceil(goldDrain / rates.gold) : 0;

  // Ovoo stone is passive income — it does not require villagers to gather
  const hasOvoo = (civ === 'mo' || civ === 'gol') && !!ovooCount;
  const stoneVills = civ === 'mo' || hasOvoo ? 0 : rates.stone > 0 ? Math.ceil(stoneDrain / rates.stone) : 0;

  return {
    food: foodVills,
    wood: woodVills,
    gold: goldVills,
    stone: stoneVills,
    total: foodVills + woodVills + goldVills + stoneVills,
    missingTimeUnits,
    stoneDeficit: civ === 'mo' ? stoneDrain : 0,
  };
};

// ── Villager Production Analysis ──

export interface VillagerProductionAnalysis {
  tcProducingVillagers: number;
  villagerProductionRate: number; // villagers per minute
  foodDrainFromVillagers: number; // food per minute consumed by villager production
  goldDrainFromVillagers: number; // gold per minute consumed by villager production (Jin Mounted Villager)
  canProduceSimultaneously: boolean;
  foodSurplus: number; // positive = can sustain both, negative = conflict
  goldSurplus: number; // gold surplus after unit + villager production (Jin)
  maxTcForCurrentFood: number; // max TCs that can produce villagers with current food surplus
}

export const calculateVillagerProduction = (
  rpm: ResourceSet,
  tcProducingVillagers: number,
  unitDrain: ResourceSet,
  allUnits?: UnitData[],
  civ?: string,
  villagerType: 'regular' | 'mounted' = 'regular'
): VillagerProductionAnalysis => {
  // Get villager stats dynamically from API data
  const villagerStats = (allUnits && civ)
    ? getVillagerStats(allUnits, civ, villagerType)
    : { cost: 50, goldCost: 0, time: 20 };

  const VILLAGER_FOOD_COST = villagerStats.cost;
  const VILLAGER_GOLD_COST = villagerStats.goldCost;
  const VILLAGER_TIME = villagerStats.time;

  // Calculate villager production rate per TC (villagers per minute)
  const villagersPerMinutePerTc = 60 / VILLAGER_TIME;

  // Total villager production rate
  const totalVillagerRate = tcProducingVillagers * villagersPerMinutePerTc;

  // Food drain from villager production
  const foodDrainFromVillagers = totalVillagerRate * VILLAGER_FOOD_COST;

  // Gold drain from villager production (Jin Mounted Villagers cost gold)
  const goldDrainFromVillagers = totalVillagerRate * VILLAGER_GOLD_COST;

  // Calculate food/gold surplus after unit production and villager production
  const foodAvailable = rpm.food;
  const foodUsedByUnits = unitDrain.food;
  const foodSurplus = foodAvailable - foodUsedByUnits - foodDrainFromVillagers;

  const goldAvailable = rpm.gold;
  const goldUsedByUnits = unitDrain.gold;
  const goldSurplus = goldAvailable - goldUsedByUnits - goldDrainFromVillagers;

  // Can produce simultaneously if we have enough food AND gold for both
  const canProduceSimultaneously = foodSurplus >= 0 && goldSurplus >= 0;

  // Calculate max TCs that can produce villagers with current food surplus
  const foodAfterUnits = foodAvailable - foodUsedByUnits;
  const maxTcByFood = foodAfterUnits > 0
    ? Math.floor(foodAfterUnits / (villagersPerMinutePerTc * VILLAGER_FOOD_COST))
    : 0;

  // Jin Mounted Villagers also drain gold — TCs are limited by gold as well
  const goldAfterUnits = goldAvailable - goldUsedByUnits;
  const maxTcByGold = VILLAGER_GOLD_COST > 0
    ? (goldAfterUnits > 0
        ? Math.floor(goldAfterUnits / (villagersPerMinutePerTc * VILLAGER_GOLD_COST))
        : 0)
    : Infinity;
  const maxTcForCurrentFood = Math.min(maxTcByFood, maxTcByGold);

  return {
    tcProducingVillagers,
    villagerProductionRate: Math.round(totalVillagerRate * 10) / 10,
    foodDrainFromVillagers: Math.round(foodDrainFromVillagers),
    goldDrainFromVillagers: Math.round(goldDrainFromVillagers),
    canProduceSimultaneously,
    foodSurplus: Math.round(foodSurplus),
    goldSurplus: Math.round(goldSurplus),
    maxTcForCurrentFood,
  };
};
