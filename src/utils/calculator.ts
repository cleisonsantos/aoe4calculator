import { type VillagerAllocation } from '../store/useCalculatorStore';
import { type UnitData } from '../data/api';
import { type ProductionUnit } from '../store/useCalculatorStore';

// ── Villager Unit Helper ──

export interface VillagerStats {
  cost: number; // food cost
  time: number; // training time in seconds
}

/**
 * Retrieves villager stats (cost and training time) for a specific civilization.
 * Falls back to defaults if villager unit is not found in the data.
 * 
 * The villager unit is identified by having "villager" in its classes array.
 * Different civilizations may have different villager units (e.g., "gilded-villager" for Order of the Dragon).
 */
export const getVillagerStats = (
  allUnits: UnitData[],
  civ: string
): VillagerStats => {
  // Find the villager unit for this civilization
  const villagerUnit = allUnits.find(
    u => u.civs.includes(civ) && u.classes?.includes('villager')
  );

  if (villagerUnit) {
    return {
      cost: villagerUnit.costs.food || 50,
      time: villagerUnit.costs.time || 20,
    };
  }

  // Fallback to defaults if not found
  return {
    cost: 50,
    time: 20,
  };
};

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
  activeTechs: string[]
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

  // Apply tech multipliers to all resource bases
  let food_with_techs = food_base * m.food_mult;
  let wood_with_techs = wood_base * m.wood_mult;
  let gold_with_techs = gold_base * m.gold_mult;
  let stone_with_techs = stone_base * m.stone_mult;
  let oliveoil_with_techs = oliveoil_base * m.oliveoil_mult;
  let silver_with_techs = silver_base * m.silver_mult;

  // Order of the Dragon: Gilded Villagers gather resources 28% quicker
  if (civ === 'od') {
    food_with_techs *= 1.28;
    wood_with_techs *= 1.28;
    gold_with_techs *= 1.28;
    stone_with_techs *= 1.28;
    oliveoil_with_techs *= 1.28;
    silver_with_techs *= 1.28;
  }

  rpm.food += food_with_techs;
  rpm.wood += wood_with_techs;
  rpm.gold += gold_with_techs;
  rpm.stone += stone_with_techs;
  rpm.oliveoil += oliveoil_with_techs;
  rpm.silver += silver_with_techs;

  if ((civ === 'mo' || civ === 'gol') && ovooCount && ovooCount > 0) {
    const ovooRate = age === 1 ? 80 : age === 2 ? 105 : age === 3 ? 130 : 160;
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
    const uDef = allUnits.find(u => u.id === au.id && u.civs.includes(civ));
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
  sacredSites?: number,
  tcProducingVillagers: number = 0
): RequiredVillagers => {
  const { total: drain } = calculateProductionDrain(activeUnits, allUnits, civ, ovooDoubleProduction);
  const rates = getEffectiveRates(civ, age, activeTechs);

  // Get villager stats dynamically from API data
  const villagerStats = getVillagerStats(allUnits, civ);
  const VILLAGER_FOOD_COST = villagerStats.cost;
  const VILLAGER_TIME = villagerStats.time;
  const villagersPerMinutePerTc = 60 / VILLAGER_TIME;
  const villagerFoodDrain = tcProducingVillagers * villagersPerMinutePerTc * VILLAGER_FOOD_COST;

  // Subtract passive generation before calculating villagers
  let foodDrain = drain.food + villagerFoodDrain;
  let goldDrain = drain.gold;
  let stoneDrain = drain.stone;

  if (sacredSites && sacredSites > 0) {
    const siteRate = civ === 'de' ? 150 : 100;
    goldDrain = Math.max(0, goldDrain - siteRate * sacredSites);
  }

  if ((civ === 'mo' || civ === 'gol') && ovooCount && ovooCount > 0) {
    const ovooRate = age === 1 ? 80 : age === 2 ? 105 : age === 3 ? 130 : 160;
    stoneDrain = Math.max(0, stoneDrain - ovooRate * ovooCount);
  }

  const foodVills = rates.food > 0 ? Math.ceil(foodDrain / rates.food) : 0;
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

// ── Villager Production Analysis ──

export interface VillagerProductionAnalysis {
  tcProducingVillagers: number;
  villagerProductionRate: number; // villagers per minute
  foodDrainFromVillagers: number; // food per minute consumed by villager production
  canProduceSimultaneously: boolean;
  foodSurplus: number; // positive = can sustain both, negative = conflict
  maxTcForCurrentFood: number; // max TCs that can produce villagers with current food surplus
}

export const calculateVillagerProduction = (
  rpm: ResourceSet,
  tcProducingVillagers: number,
  unitDrain: ResourceSet,
  allUnits?: UnitData[],
  civ?: string
): VillagerProductionAnalysis => {
  // Get villager stats dynamically from API data
  const villagerStats = (allUnits && civ) 
    ? getVillagerStats(allUnits, civ)
    : { cost: 50, time: 20 };
  
  const VILLAGER_FOOD_COST = villagerStats.cost;
  const VILLAGER_TIME = villagerStats.time;
  
  // Calculate villager production rate per TC (villagers per minute)
  const villagersPerMinutePerTc = 60 / VILLAGER_TIME;
  
  // Total villager production rate
  const totalVillagerRate = tcProducingVillagers * villagersPerMinutePerTc;
  
  // Food drain from villager production
  const foodDrainFromVillagers = totalVillagerRate * VILLAGER_FOOD_COST;
  
  // Calculate food surplus after unit production and villager production
  const foodAvailable = rpm.food;
  const foodUsedByUnits = unitDrain.food;
  const foodSurplus = foodAvailable - foodUsedByUnits - foodDrainFromVillagers;
  
  // Can produce simultaneously if we have enough food for both
  const canProduceSimultaneously = foodSurplus >= 0;
  
  // Calculate max TCs that can produce villagers with current food surplus
  const foodAfterUnits = foodAvailable - foodUsedByUnits;
  const maxTcForCurrentFood = foodAfterUnits > 0 
    ? Math.floor(foodAfterUnits / (villagersPerMinutePerTc * VILLAGER_FOOD_COST))
    : 0;
  
  return {
    tcProducingVillagers,
    villagerProductionRate: Math.round(totalVillagerRate * 10) / 10,
    foodDrainFromVillagers: Math.round(foodDrainFromVillagers),
    canProduceSimultaneously,
    foodSurplus: Math.round(foodSurplus),
    maxTcForCurrentFood,
  };
};
