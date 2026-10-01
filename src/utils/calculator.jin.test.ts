import { describe, expect, it } from 'vitest';
import {
  MOUNTED_VILLAGER_GATHER_MULT,
  BASE_RATES,
  MOUNTED_VILLAGER_FARM_MULT,
  calculateProductionDrain,
  calculateMaxProduction,
  normalizeMountedVillagers,
  calculateRequiredVillagers,
  calculateRPM,
  calculateVillagerProduction,
  getEffectiveRates,
  getVillagerStats,
  type ResourceSet,
} from './calculator';
import { type UnitData } from '../data/api';
import { type VillagerAllocation } from '../store/useCalculatorStore';

const emptyVillagers: VillagerAllocation = {
  food_sheep: 0,
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

const expectedZeroResources: ResourceSet = {
  food: 0,
  wood: 0,
  gold: 0,
  stone: 0,
  oliveoil: 0,
  silver: 0,
};

// Both types exist in the live API; selection must not depend on array order.
const regularVillager: UnitData = {
  id: 'villager-1',
  baseId: 'villager',
  name: 'Villager',
  civs: ['jin', 'en'],
  costs: { food: 50, wood: 0, gold: 0, stone: 0, time: 20 },
  producedBy: ['town-center'],
  icon: '',
  classes: ['villager', 'builder', 'worker'],
  age: 1,
};

const mountedVillager: UnitData = {
  id: 'mounted-villager-1',
  baseId: 'mounted-villager',
  name: 'Mounted Villager',
  civs: ['jin'],
  costs: { food: 65, wood: 0, gold: 50, stone: 0, time: 35 },
  producedBy: ['town-center'],
  icon: '',
  classes: ['mounted_villager', 'villager', 'builder', 'worker'],
  age: 1,
};

const horseman: UnitData = {
  id: 'horseman',
  baseId: 'horseman',
  name: 'Horseman',
  civs: ['jin', 'en'],
  costs: { food: 100, wood: 0, gold: 20, stone: 0, time: 30 },
  producedBy: ['stable'],
  icon: '',
  classes: ['military'],
  age: 2,
};

const allUnits = [regularVillager, mountedVillager, horseman];

describe('Jin Dynasty calculator rules', () => {
  it('uses the Mounted Villager when explicitly selected (65F + 50G, 35s)', () => {
    const stats = getVillagerStats(allUnits, 'jin', 'mounted');
    expect(stats.cost).toBe(65);
    expect(stats.goldCost).toBe(50);
    expect(stats.time).toBe(35);
  });

  it('returns the regular villager for civs without a mounted villager', () => {
    const stats = getVillagerStats(allUnits, 'en');
    expect(stats.cost).toBe(50);
    expect(stats.goldCost).toBe(0);
    expect(stats.time).toBe(20);
  });

  it('expresses required economy in regular villagers, without a blanket Jin bonus', () => {
    const rates = getEffectiveRates('jin', 1, []);
    const baseFarm = BASE_RATES.food_farms;

    expect(rates.food).toBeCloseTo(baseFarm);
    expect(rates.wood).toBeCloseTo(BASE_RATES.wood);
    expect(rates.gold).toBeCloseTo(BASE_RATES.gold);
    expect(rates.stone).toBeCloseTo(BASE_RATES.stone);
  });

  it('applies the Mounted Villager gather multiplier in calculateRPM', () => {
    const rpm = calculateRPM(
      emptyVillagers,
      'jin',
      1,
      [],
      0,
      0,
      0,
      { mountedVillagers: { food_sheep: 6 } }
    );

    expect(rpm).toEqual({
      ...expectedZeroResources,
      food: Math.round(6 * BASE_RATES.food_sheep * MOUNTED_VILLAGER_GATHER_MULT),
    });
  });

  it('adds passive food from Tributary States in calculateRPM', () => {
    const settings = { tributaryFoodRate: 80 }; // User input, not a game balance value.
    expect(calculateRPM(emptyVillagers, 'jin', 3, [], 0, 0, 1, settings).food).toBe(80);
    expect(calculateRPM(emptyVillagers, 'jin', 4, [], 0, 0, 3, settings).food).toBe(240);
    expect(calculateRPM(emptyVillagers, 'jin', 3, [], 0, 0, 3).food).toBe(0);
    expect(calculateRPM(emptyVillagers, 'jin', 1, [], 0, 0, 3, settings).food).toBe(0);
    expect(calculateRPM(emptyVillagers, 'jin', 2, [], 0, 0, 3, settings).food).toBe(0);
  });

  it('includes the gold cost of Mounted Villagers in the required-villager drain', () => {
    const required = calculateRequiredVillagers(
      [],
      allUnits,
      'jin',
      1,
      [],
      0,
      0,
      1,
      0,
      { villagerType: 'mounted' }
    );

    // Required economy uses regular workers: ceil(111.4/45), ceil(85.7/45).
    expect(required.food).toBe(3);
    expect(required.gold).toBe(2);
    expect(required.total).toBe(5);
  });

  it('does not drain gold from villager production for other civs', () => {
    const required = calculateRequiredVillagers(
      [],
      allUnits,
      'en',
      1,
      [],
      0,
      0,
      1
    );

    expect(required.food).toBe(3); // ceil(150 / 51.75)
    expect(required.gold).toBe(0);
  });

  it('subtracts Tributary State passive food from the food drain', () => {
    const settings = { villagerType: 'mounted' as const, tributaryFoodRate: 80 };
    const base = calculateRequiredVillagers([], allUnits, 'jin', 3, [], 0, 0, 1, 0, settings);
    const withOne = calculateRequiredVillagers([], allUnits, 'jin', 3, [], 0, 0, 1, 1, settings);
    const withTwo = calculateRequiredVillagers([], allUnits, 'jin', 3, [], 0, 0, 1, 2, settings);

    expect(withOne.food).toBeLessThan(base.food);
    expect(withTwo.food).toBe(0); // drain fully covered → no food villagers
  });

  it('reduces food villagers for unit production when Tributary States exist', () => {
    const horsemanDrain = [{ id: 'horseman', buildings: 1 }]; // 200 food/min

    const base = calculateRequiredVillagers(horsemanDrain, allUnits, 'jin', 3, [], 0, 0);
    const withTribute = calculateRequiredVillagers(horsemanDrain, allUnits, 'jin', 3, [], 0, 0, 0, 1, { tributaryFoodRate: 80 });

    expect(base.food).toBe(5);
    expect(withTribute.food).toBe(3);
  });

  it('reports gold drain from Mounted Villager production in the analysis', () => {
    const analysis = calculateVillagerProduction(
      { food: 200, wood: 0, gold: 50, stone: 0, oliveoil: 0, silver: 0 },
      1,
      { food: 0, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 },
      allUnits,
      'jin',
      'mounted'
    );

    expect(analysis.foodDrainFromVillagers).toBe(111); // 60/35 * 65 ≈ 111.4
    expect(analysis.goldDrainFromVillagers).toBe(86); // 60/35 * 50 ≈ 85.7
    // Food is fine (200 - 111 = 89 surplus) but gold is not (50 - 86 < 0)
    expect(analysis.foodSurplus).toBeGreaterThan(0);
    expect(analysis.goldSurplus).toBeLessThan(0);
    expect(analysis.canProduceSimultaneously).toBe(false);
    expect(analysis.maxTcForCurrentFood).toBe(0); // limited by gold
  });

  it('ignores the gold constraint for civs whose villagers cost no gold', () => {
    const analysis = calculateVillagerProduction(
      { food: 200, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 },
      1,
      { food: 0, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 },
      allUnits,
      'en'
    );

    expect(analysis.goldDrainFromVillagers).toBe(0);
    expect(analysis.canProduceSimultaneously).toBe(true); // only food matters
  });

  it('does not apply Jin bonuses to other civilizations (regression)', () => {
    // No gather multiplier for English
    const enRates = getEffectiveRates('en', 1, []);
    expect(enRates.wood).toBeCloseTo(BASE_RATES.wood);

    // No Tributary food for English, even when tributaries are passed
    expect(calculateRPM(emptyVillagers, 'en', 3, [], 0, 0, 3, {
      tributaryFoodRate: 80,
      mountedVillagers: { food_sheep: 20 },
    }).food).toBe(0);

    // Regular English villager cost/time
    expect(getVillagerStats(allUnits, 'en').time).toBe(20);
  });

  it('handles units missing costs.time from the live API (no NaN)', () => {
    // horseman-2 in the live API has no costs.time (60 / undefined = NaN)
    const noTimeHorseman: UnitData = {
      id: 'horseman-2',
      baseId: 'horseman',
      name: 'Horseman',
      civs: ['jin', 'en'],
      costs: { food: 75, wood: 20, gold: 0, stone: 0 }, // no time field
      producedBy: ['stable'],
      icon: '',
      classes: ['military'],
      age: 2,
    };

    const required = calculateRequiredVillagers(
      [{ id: 'horseman-2', buildings: 1 }],
      [noTimeHorseman, regularVillager, mountedVillager],
      'jin',
      2,
      []
    );

    expect(Number.isNaN(required.food)).toBe(false);
    expect(Number.isNaN(required.gold)).toBe(false);
    expect(Number.isNaN(required.total)).toBe(false);
    expect(required.missingTimeUnits).toEqual(['horseman-2']);
    expect(required.total).toBe(0);
    const drain = calculateProductionDrain([{ id: 'horseman-2', buildings: 1 }], [noTimeHorseman], 'jin');
    expect(drain.perUnit).toEqual([]);
    expect(drain.missingTimeUnits).toEqual(['horseman-2']);
    const max = calculateMaxProduction({ ...expectedZeroResources, food: 150, wood: 40 }, [noTimeHorseman], 'jin', false);
    expect(max[0].maxSustainable).toBe(2);
  });

  it('defaults Jin TC production to regular villagers regardless of API order', () => {
    expect(getVillagerStats([mountedVillager, regularVillager], 'jin')).toEqual({
      cost: 50, goldCost: 0, time: 20,
    });
    const required = calculateRequiredVillagers([], allUnits, 'jin', 1, [], 0, 0, 1);
    expect(required.food).toBe(4);
    expect(required.gold).toBe(0);
  });

  it('combines regular and mounted workers and applies the separate farm estimate', () => {
    const rpm = calculateRPM({ ...emptyVillagers, wood: 10, food_farms: 2 }, 'jin', 3, [], 0, 0, 0, {
      mountedVillagers: { wood: 5, food_farms: 3, food_sheep: 4 },
    });
    expect(rpm.wood).toBe(945);
    expect(rpm.food).toBe(Math.round(2 * BASE_RATES.food_farms + 3 * BASE_RATES.food_farms * MOUNTED_VILLAGER_FARM_MULT + 4 * BASE_RATES.food_sheep * MOUNTED_VILLAGER_GATHER_MULT));
  });

  it('does not grant mounted bonuses to regular Jin workers', () => {
    expect(calculateRPM({ ...emptyVillagers, wood: 40 }, 'jin', 1, []).wood).toBe(1800);
  });

  it('limits mounted allocation and unlocks additional workers only in Castle Age', () => {
    expect(normalizeMountedVillagers({ wood: 40 }, 1, 3).wood).toBe(20);
    expect(normalizeMountedVillagers({ wood: 40 }, 3, 3).wood).toBe(29);
    const allocation = normalizeMountedVillagers({ food_sheep: 15, wood: 15, gold: -2 }, 1);
    expect(allocation.food_sheep).toBe(15);
    expect(allocation.wood).toBe(5);
    expect(allocation.gold).toBe(0);
  });

  it('applies technologies to the mixed economy', () => {
    const rpm = calculateRPM({ ...emptyVillagers, wood: 10 }, 'jin', 2, ['double-broadax'], 0, 0, 0, {
      mountedVillagers: { wood: 5 },
    });
    expect(rpm.wood).toBe(Math.round(945 * 1.15));
  });

  it('preserves shore fishing and deep sea income without mounted boat bonuses', () => {
    const rpm = calculateRPM({ ...emptyVillagers, food_fish: 2, food_deep_fish: 3 }, 'jin', 3, [], 0, 0, 0, {
      mountedVillagers: { food_fish: 1, food_deep_fish: 10 },
    });
    expect(rpm.food).toBe(120 + 135 + 132);
    expect(normalizeMountedVillagers({ food_deep_fish: 10 }, 3).food_deep_fish).toBe(0);
  });

  it('combines relic income with tributary food and mounted TC drain', () => {
    const jin = { villagerType: 'mounted' as const, tributaryFoodRate: 80 };
    const rpm = calculateRPM(emptyVillagers, 'jin', 3, [], 0, 0, 2, jin, 1);
    expect(rpm.food).toBe(160);
    expect(rpm.gold).toBe(100);
    const required = calculateRequiredVillagers([], allUnits, 'jin', 3, [], 0, 0, 1, 2, jin, 1);
    expect(required.food).toBe(0);
    expect(required.gold).toBe(0);
  });

  it('preserves other civilizations fishing and relic generation', () => {
    const rpm = calculateRPM({ ...emptyVillagers, food_fish: 2, food_deep_fish: 3 }, 'mo', 3, [], 1, 0, 0, {}, 2);
    expect(rpm.food).toBe(255);
    expect(rpm.gold).toBe(200);
    expect(rpm.stone).toBe(130);
  });

  it.each([0, -1, Infinity, NaN])('reports invalid training time %s instead of inventing a rate', (time) => {
    const unit = { ...horseman, costs: { ...horseman.costs, time } };
    expect(calculateProductionDrain([{ id: unit.id, buildings: 1 }], [unit], 'jin').missingTimeUnits).toEqual([unit.id]);
  });
});
