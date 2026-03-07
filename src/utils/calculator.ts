import { type VillagerAllocation } from '../store/useCalculatorStore';
import { type UnitData } from '../data/api';
import { type ProductionUnit } from '../store/useCalculatorStore';

export const BASE_RATES = {
  food_sheep: 40,
  food_berries: 40,
  food_deer: 45,
  food_boar: 55,
  food_farms: 40,
  wood: 40,
  gold: 40,
  stone: 40,
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

  if (activeTechs.includes('horticulture')) { food_mult *= 1.15; oliveoil_mult *= 1.15; }
  if (activeTechs.includes('fertilization')) { food_mult *= 1.15; oliveoil_mult *= 1.15; }
  if (activeTechs.includes('cross-breeding')) { food_mult *= 1.15; oliveoil_mult *= 1.15; }

  if (activeTechs.includes('double-broadax')) wood_mult *= 1.15;
  if (activeTechs.includes('lumber-preservation')) wood_mult *= 1.15;
  if (activeTechs.includes('crosscut-saw')) wood_mult *= 1.15;

  if (activeTechs.includes('specialized-pick')) { gold_mult *= 1.15; stone_mult *= 1.15; silver_mult *= 1.15; }
  if (activeTechs.includes('acid-distillation')) { gold_mult *= 1.15; stone_mult *= 1.15; silver_mult *= 1.15; }
  if (activeTechs.includes('cupellation')) { gold_mult *= 1.15; stone_mult *= 1.15; silver_mult *= 1.15; }

  return { food_mult, wood_mult, gold_mult, stone_mult, oliveoil_mult, silver_mult };
};

// ── Effective gather rate per villager (RPM) ──

export const getEffectiveRates = (
  civ: string,
  age: number,
  activeTechs: string[]
) => {
  const m = getResourceMultipliers(civ, age, activeTechs);

  // Use farms as default food source for reverse calculations
  const foodRate = BASE_RATES.food_farms * m.food_mult;
  const woodRate = BASE_RATES.wood * m.wood_mult;
  const goldRate = BASE_RATES.gold * m.gold_mult;
  const stoneRate = BASE_RATES.stone * m.stone_mult;
  const oliveoilRate = BASE_RATES.oliveoil * m.oliveoil_mult;
  const silverRate = BASE_RATES.silver * m.silver_mult;

  return { food: foodRate, wood: woodRate, gold: goldRate, stone: stoneRate, oliveoil: oliveoilRate, silver: silverRate };
};

// ── Resource Mode: calculateRPM (existing, refactored) ──

export const calculateRPM = (
  villagers: VillagerAllocation,
  civ: string,
  age: number,
  activeTechs: string[],
  ovooCount?: number,
  sacredSites?: number
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
    villagers.food_farms * BASE_RATES.food_farms;

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
  } else if (civ === 'ab' || civ === 'de') {
    const berry_mult = 1.30;
    rpm.food += (villagers.food_berries * BASE_RATES.food_berries * berry_mult) - (villagers.food_berries * BASE_RATES.food_berries);
  }

  rpm.food += food_base * m.food_mult;
  rpm.wood += wood_base * m.wood_mult;
  rpm.gold += gold_base * m.gold_mult;
  rpm.stone += stone_base * m.stone_mult;
  rpm.oliveoil += oliveoil_base * m.oliveoil_mult;
  rpm.silver += silver_base * m.silver_mult;

  if ((civ === 'mo' || civ === 'gol') && ovooCount && ovooCount > 0) {
    const ovooRate = age === 1 ? 80 : age === 2 ? 105 : age === 3 ? 120 : 150;
    rpm.stone += ovooRate * ovooCount;
  }

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
  ovooDoubleProduction: boolean
): { perUnit: UnitDrain[]; total: ResourceSet } => {
  const total: ResourceSet = { food: 0, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 };
  const perUnit: UnitDrain[] = [];

  activeUnits.forEach(au => {
    const uDef = allUnits.find(u => u.id === au.id);
    if (!uDef) return;

    const time = uDef.costs.time;
    const foodCost = uDef.costs.food || 0;
    const woodCost = uDef.costs.wood || 0;
    const goldCost = uDef.costs.gold || 0;
    let stoneCost = uDef.costs.stone || 0;

    let upmMultiplier = 1;
    if (civ === 'mo' && ovooDoubleProduction) {
      upmMultiplier = 2;
      stoneCost += (foodCost + woodCost + goldCost);
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

  return { perUnit, total };
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
  ovooDoubleProduction: boolean
): MaxProductionEntry[] => {
  return availableUnits.map(u => {
    const time = u.costs.time;
    const foodCost = u.costs.food || 0;
    const woodCost = u.costs.wood || 0;
    const goldCost = u.costs.gold || 0;
    let stoneCost = u.costs.stone || 0;

    let upmMultiplier = 1;
    if (civ === 'mo' && ovooDoubleProduction) {
      upmMultiplier = 2;
      stoneCost += (foodCost + woodCost + goldCost);
    }

    // Cost per unit per minute from a single building
    const costPerUnitPerMin = {
      food: foodCost > 0 ? (foodCost / time) * 60 : 0,
      wood: woodCost > 0 ? (woodCost / time) * 60 : 0,
      gold: goldCost > 0 ? (goldCost / time) * 60 : 0,
      stone: stoneCost > 0 ? (stoneCost / time) * 60 : 0,
    };

    // Max sustainable buildings = min across all resources that have a cost
    const limits: number[] = [];
    if (costPerUnitPerMin.food > 0) limits.push(rpm.food / costPerUnitPerMin.food);
    if (costPerUnitPerMin.wood > 0) limits.push(rpm.wood / costPerUnitPerMin.wood);
    if (costPerUnitPerMin.gold > 0) limits.push(rpm.gold / costPerUnitPerMin.gold);
    if (costPerUnitPerMin.stone > 0) limits.push(rpm.stone / costPerUnitPerMin.stone);

    // limits gives max buildings sustainable; convert to UPM
    const maxBuildings = limits.length > 0 ? Math.min(...limits) : Infinity;
    const upmPerBuilding = (60 / time) * upmMultiplier;
    const maxSustainable = maxBuildings === Infinity ? Infinity : maxBuildings * upmPerBuilding;

    return {
      unitId: u.id,
      unitName: u.name,
      icon: u.icon,
      maxSustainable: maxSustainable === Infinity ? 999 : Math.max(0, maxSustainable),
    };
  }).filter(e => e.maxSustainable > 0);
};

// ── Units Mode output: required villagers for desired production ──

export interface RequiredVillagers {
  food: number;
  wood: number;
  gold: number;
  stone: number;
  total: number;
}

export const calculateRequiredVillagers = (
  activeUnits: ProductionUnit[],
  allUnits: UnitData[],
  civ: string,
  age: number,
  activeTechs: string[],
  ovooDoubleProduction: boolean,
  ovooCount?: number,
  sacredSites?: number
): RequiredVillagers => {
  const { total: drain } = calculateProductionDrain(activeUnits, allUnits, civ, ovooDoubleProduction);
  const rates = getEffectiveRates(civ, age, activeTechs);

  // Subtract passive generation before calculating villagers
  let goldDrain = drain.gold;
  let stoneDrain = drain.stone;

  if (sacredSites && sacredSites > 0) {
    const siteRate = civ === 'de' ? 150 : 100;
    goldDrain = Math.max(0, goldDrain - siteRate * sacredSites);
  }

  if ((civ === 'mo' || civ === 'gol') && ovooCount && ovooCount > 0) {
    const ovooRate = age === 1 ? 80 : age === 2 ? 105 : age === 3 ? 120 : 150;
    stoneDrain = Math.max(0, stoneDrain - ovooRate * ovooCount);
  }

  const foodVills = rates.food > 0 ? Math.ceil(drain.food / rates.food) : 0;
  const woodVills = rates.wood > 0 ? Math.ceil(drain.wood / rates.wood) : 0;
  const goldVills = rates.gold > 0 ? Math.ceil(goldDrain / rates.gold) : 0;
  const stoneVills = rates.stone > 0 ? Math.ceil(stoneDrain / rates.stone) : 0;

  return {
    food: foodVills,
    wood: woodVills,
    gold: goldVills,
    stone: stoneVills,
    total: foodVills + woodVills + goldVills + stoneVills,
  };
};
