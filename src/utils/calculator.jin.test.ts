import { describe, expect, it } from 'vitest';
import {
  MOUNTED_VILLAGER_GATHER_MULT,
  TRIBUTARY_FOOD_RATE,
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

// Regular villager listed FIRST on purpose: the API returns villager-1 (index 589)
// after mounted-villager-1 (index 576), but the helper must prioritize the
// mounted_villager class regardless of array order.
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
  it('uses the Mounted Villager as the Jin economic villager (65F + 50G, 35s)', () => {
    const stats = getVillagerStats(allUnits, 'jin');
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

  it('applies the Mounted Villager gather multiplier in getEffectiveRates', () => {
    const rates = getEffectiveRates('jin', 1, []);
    const baseFarm = 40; // BASE_RATES.food_farms on this branch

    expect(rates.food).toBeCloseTo(baseFarm * MOUNTED_VILLAGER_GATHER_MULT);
    expect(rates.wood).toBeCloseTo(40 * MOUNTED_VILLAGER_GATHER_MULT);
    expect(rates.gold).toBeCloseTo(40 * MOUNTED_VILLAGER_GATHER_MULT);
    expect(rates.stone).toBeCloseTo(40 * MOUNTED_VILLAGER_GATHER_MULT);
  });

  it('applies the Mounted Villager gather multiplier in calculateRPM', () => {
    const rpm = calculateRPM(
      { ...emptyVillagers, food_sheep: 6 },
      'jin',
      1,
      [],
      0,
      0
    );

    expect(rpm).toEqual({
      ...expectedZeroResources,
      food: Math.round(6 * 40 * MOUNTED_VILLAGER_GATHER_MULT), // 456
    });
  });

  it('adds passive food from Tributary States in calculateRPM', () => {
    expect(calculateRPM(emptyVillagers, 'jin', 1, [], 0, 0, 1).food).toBe(TRIBUTARY_FOOD_RATE);
    expect(calculateRPM(emptyVillagers, 'jin', 2, [], 0, 0, 3).food).toBe(TRIBUTARY_FOOD_RATE * 3);
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
      1 // 1 TC producing Mounted Villagers (65F + 50G, 35s)
    );

    // Villager drain: 60/35 * 65 ≈ 111.4 food/min → ceil(111.4 / 76) = 2
    //                60/35 * 50 ≈ 85.7 gold/min → ceil(85.7 / 76) = 2
    expect(required.food).toBe(2);
    expect(required.gold).toBe(2);
    expect(required.total).toBe(4);
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

    expect(required.food).toBe(4); // 60/20 * 50 = 150 food/min → ceil(150 / 46) = 4
    expect(required.gold).toBe(0);
  });

  it('subtracts Tributary State passive food from the food drain', () => {
    // 1 TC producing Mounted Villagers: 111.4 food/min drain
    const base = calculateRequiredVillagers([], allUnits, 'jin', 1, [], 0, 0, 1);
    const withOne = calculateRequiredVillagers([], allUnits, 'jin', 1, [], 0, 0, 1, 1);
    const withTwo = calculateRequiredVillagers([], allUnits, 'jin', 1, [], 0, 0, 1, 2);

    expect(withOne.food).toBeLessThan(base.food); // 51.4 food/min left → 1 villager
    expect(withTwo.food).toBe(0); // drain fully covered → no food villagers
  });

  it('reduces food villagers for unit production when Tributary States exist', () => {
    const horsemanDrain = [{ id: 'horseman', buildings: 1 }]; // 200 food/min

    const base = calculateRequiredVillagers(horsemanDrain, allUnits, 'jin', 2, [], 0, 0);
    const withTribute = calculateRequiredVillagers(horsemanDrain, allUnits, 'jin', 2, [], 0, 0, 0, 1);

    expect(base.food).toBe(3); // ceil(200 / 76)
    expect(withTribute.food).toBe(2); // ceil((200 - 60) / 76)
  });

  it('reports gold drain from Mounted Villager production in the analysis', () => {
    const analysis = calculateVillagerProduction(
      { food: 200, wood: 0, gold: 50, stone: 0, oliveoil: 0, silver: 0 },
      1,
      { food: 0, wood: 0, gold: 0, stone: 0, oliveoil: 0, silver: 0 },
      allUnits,
      'jin'
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
    expect(enRates.wood).toBeCloseTo(40); // no 1.9x

    // No Tributary food for English, even when tributaries are passed
    expect(calculateRPM(emptyVillagers, 'en', 1, [], 0, 0, 3).food).toBe(0);

    // Regular English villager cost/time
    expect(getVillagerStats(allUnits, 'en').time).toBe(20);
  });
});
