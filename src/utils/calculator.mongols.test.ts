import { describe, expect, it } from 'vitest';
import {
  calculateMaxProduction,
  calculateProductionDrain,
  calculateRequiredVillagers,
  calculateRPM,
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

const villager: UnitData = {
  id: 'villager',
  baseId: 'villager',
  name: 'Villager',
  civs: ['mo', 'en'],
  costs: { food: 50, wood: 0, gold: 0, stone: 0, time: 20 },
  producedBy: ['town-center'],
  icon: '',
  classes: ['villager'],
  age: 1,
};

const horseman: UnitData = {
  id: 'horseman',
  baseId: 'horseman',
  name: 'Horseman',
  civs: ['mo', 'en'],
  costs: { food: 100, wood: 0, gold: 20, stone: 0, time: 30 },
  producedBy: ['stable'],
  icon: '',
  classes: ['military'],
  age: 2,
};

const allUnits = [villager, horseman];

describe('Mongols calculator rules', () => {
  it('calculates base villager income without Mongol-specific bonuses', () => {
    const rpm = calculateRPM(
      { ...emptyVillagers, food_sheep: 6 },
      'mo',
      1,
      [],
      0,
      0
    );

    expect(rpm).toEqual({
      ...expectedZeroResources,
      food: 240,
    });
  });

  it('adds Ovoo passive stone generation according to age', () => {
    expect(calculateRPM(emptyVillagers, 'mo', 1, [], 1, 0).stone).toBe(80);
    expect(calculateRPM(emptyVillagers, 'mo', 2, [], 1, 0).stone).toBe(105);
    expect(calculateRPM(emptyVillagers, 'mo', 3, [], 1, 0).stone).toBe(120);
    expect(calculateRPM(emptyVillagers, 'mo', 4, [], 1, 0).stone).toBe(150);
  });

  it('scales Ovoo passive stone generation by Ovoo count', () => {
    expect(calculateRPM(emptyVillagers, 'mo', 2, [], 2, 0).stone).toBe(210);
    expect(calculateRPM(emptyVillagers, 'mo', 4, [], 3, 0).stone).toBe(450);
  });

  it('doubles Mongol unit output and charges the extra unit as stone drain', () => {
    const result = calculateProductionDrain(
      [{ id: 'horseman', buildings: 1 }],
      allUnits,
      'mo',
      true
    );

    expect(result.perUnit).toHaveLength(1);
    expect(result.perUnit[0].upm).toBe(4);
    expect(result.perUnit[0].drain).toEqual({
      food: 200,
      wood: 0,
      gold: 40,
      stone: 240,
      oliveoil: 0,
      silver: 0,
    });
    expect(result.total).toEqual(result.perUnit[0].drain);
  });

  it('does not apply Ovoo double production to non-Mongol civilizations', () => {
    const result = calculateProductionDrain(
      [{ id: 'horseman', buildings: 1 }],
      allUnits,
      'en',
      true
    );

    expect(result.perUnit).toHaveLength(1);
    expect(result.perUnit[0].upm).toBe(2);
    expect(result.perUnit[0].drain).toEqual({
      food: 200,
      wood: 0,
      gold: 40,
      stone: 0,
      oliveoil: 0,
      silver: 0,
    });
  });

  it('subtracts Ovoo passive stone before calculating required stone villagers', () => {
    const required = calculateRequiredVillagers(
      [{ id: 'horseman', buildings: 1 }],
      allUnits,
      'mo',
      4,
      [],
      true,
      1,
      0,
      0
    );

    expect(required).toEqual({
      food: 5,
      wood: 0,
      gold: 1,
      stone: 3,
      total: 9,
    });
  });

  it('uses Ovoo stone drain when calculating max sustainable double production', () => {
    const maxProduction = calculateMaxProduction(
      { food: 200, wood: 0, gold: 40, stone: 240, oliveoil: 0, silver: 0 },
      [horseman],
      'mo',
      true
    );

    expect(maxProduction).toHaveLength(1);
    expect(maxProduction[0].unitId).toBe('horseman');
    expect(maxProduction[0].maxSustainable).toBe(4);
  });
});
