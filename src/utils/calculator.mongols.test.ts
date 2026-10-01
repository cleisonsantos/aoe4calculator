import { describe, expect, it } from 'vitest';
import {
  calculateMaxProduction,
  calculateProductionDrain,
  calculateRequiredVillagers,
  calculateRPM,
  getEffectiveRates,
  getDoubleProductionStoneCost,
  isTrainableUnit,
  calculateBuildingTradeoff,
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
      food: 270,
    });
  });

  it('ignores invalid future-age technologies in age-aware APIs', () => {
    expect(getEffectiveRates('mo', 1, ['horticulture', 'fertilization', 'precision-cross-breeding']).food).toBe(45);
    expect(calculateRPM(emptyVillagers, 'mo', 3, ['tithe-barns-improved'], 0, 0, 0, {}, 1))
      .toEqual({ ...expectedZeroResources, gold: 100 });
    expect(calculateRequiredVillagers(production, [keshik], 'mo', 2, ['military-academy'], 0).stoneDeficit).toBe(400);
  });

  it('adds Ovoo passive stone generation according to age', () => {
    expect(calculateRPM(emptyVillagers, 'mo', 1, [], 1, 0).stone).toBe(70);
    expect(calculateRPM(emptyVillagers, 'mo', 2, [], 1, 0).stone).toBe(100);
    expect(calculateRPM(emptyVillagers, 'mo', 3, [], 1, 0).stone).toBe(130);
    expect(calculateRPM(emptyVillagers, 'mo', 4, [], 1, 0).stone).toBe(160);
  });

  it('caps Mongol Ovoos at one', () => {
    expect(calculateRPM(emptyVillagers, 'mo', 2, [], 2, 0).stone).toBe(100);
    expect(calculateRPM(emptyVillagers, 'mo', 4, [], 3, 0).stone).toBe(160);
  });

  it('doubles Mongol unit output and charges the extra unit as stone drain', () => {
    const result = calculateProductionDrain(
      [{ id: 'horseman', buildings: 1, doubleProduced: true }],
      allUnits,
      'mo'
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
      [{ id: 'horseman', buildings: 1, doubleProduced: true }],
      allUnits,
      'en'
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

  it('does not count Ovoo stone as requiring villagers', () => {
    const required = calculateRequiredVillagers(
      [{ id: 'horseman', buildings: 1, doubleProduced: true }],
      allUnits,
      'mo',
      4,
      [],
      1,
      0,
      0
    );

    // Ovoo stone is passive — no villagers needed for stone
    expect(required.stone).toBe(0);
    expect(required.total).toBe(required.food + required.wood + required.gold);
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

// Snapshot-shaped fixtures: costs and train times are input data, never calculator constants.
const keshik: UnitData = {
  id: 'keshik-2', baseId: 'keshik', name: 'Keshik', civs: ['mo'],
  costs: { food: 120, wood: 0, gold: 80, stone: 0, time: 30 },
  producedBy: ['khaganate-palace', 'stable'], icon: '', age: 2,
  classes: ['military', 'cavalry', 'armored'],
};
const hunter: UnitData = {
  ...keshik, id: 'khans-hunter-2', baseId: 'khans-hunter', name: "Khan's Hunter",
  costs: { food: 0, wood: 60, gold: 60, stone: 0, time: 20 },
  producedBy: ['archery-range'],
};
const production = [{ id: keshik.id, buildings: 1, doubleProduced: true }];

describe('Mongol live-shaped economy edge cases', () => {
  it('ignores unavailable farms and stone miners even with malformed allocation', () => {
    expect(calculateRPM({ ...emptyVillagers, food_farms: 20, stone: 20 }, 'mo', 4, []))
      .toEqual(expectedZeroResources);
    expect(getEffectiveRates('mo', 4, []).stone).toBe(0);
  });

  it('reports unmet stone rather than inventing miners with or without an Ovoo', () => {
    const required = (ovoo: number) =>
      calculateRequiredVillagers(production, [keshik], 'mo', 4, [], ovoo);
    expect(required(0).stone).toBe(0);
    expect(required(0).stoneDeficit).toBe(400);
    expect(required(1).stoneDeficit).toBe(240);
    expect(required(5).stoneDeficit).toBe(240);
  });

  it('adds age-IV White Stupa income and applies the local double-cost discount', () => {
    expect(calculateRPM(emptyVillagers, 'mo', 3, [], 1, 0, 0, {}, 0, { whiteStupa: true }).stone).toBe(130);
    expect(calculateRPM(emptyVillagers, 'mo', 4, [], 1, 0, 0, {}, 0, { whiteStupa: true }).stone).toBe(400);
    expect(calculateRPM(emptyVillagers, 'mo', 4, [], 0, 0, 0, {}, 0, { whiteStupa: true }).stone).toBe(240);
    expect(getDoubleProductionStoneCost(keshik)).toBe(200);
    expect(getDoubleProductionStoneCost(keshik, { whiteStupa: true })).toBe(100);
    expect(calculateProductionDrain(production, [keshik], 'mo', { whiteStupa: true }).total.stone).toBe(200);
    expect(calculateRequiredVillagers(production, [keshik], 'mo', 3, [], 1, 0, 0, 0, {}, 0,
      { whiteStupa: true }).stoneDeficit).toBe(270);
    expect(calculateRequiredVillagers(production, [keshik], 'mo', 4, [], 1, 0, 0, 0, {}, 0,
      { whiteStupa: true }).stoneDeficit).toBe(0);
  });

  it('applies Steppe Redoubt only to deposited villager gold, not relics or sites', () => {
    const v = { ...emptyVillagers, gold: 2 };
    expect(calculateRPM(v, 'mo', 3, [], 0, 1, 0, {}, 1, { steppeRedoubt: true }).gold).toBe(335);
    expect(calculateRPM(v, 'mo', 2, [], 0, 1, 0, {}, 1, { steppeRedoubt: true }).gold).toBe(290);
    expect(getEffectiveRates('mo', 3, [], { steppeRedoubt: true }).gold).toBe(67.5);
  });

  it('restricts survival techniques to deer and boar and replaces the normal effect', () => {
    const techs = ['survival-techniques-1', 'survival-techniques-improved-1'];
    expect(calculateRPM({ ...emptyVillagers, food_deer: 10 }, 'mo', 2, techs).food).toBe(619);
    expect(calculateRPM({ ...emptyVillagers, food_boar: 10 }, 'mo', 2, techs).food).toBe(675);
    expect(calculateRPM({ ...emptyVillagers, food_deer: 10 }, 'mo', 2, ['survival-techniques']).food).toBe(569);
    for (const source of ['food_sheep', 'food_berries', 'food_fish', 'food_deep_fish'] as const) {
      const v = { ...emptyVillagers, [source]: 10 };
      expect(calculateRPM(v, 'mo', 2, techs)).toEqual(calculateRPM(v, 'mo', 2, []));
    }
  });

  it('applies food technologies only to nonhunt villagers, not fishing boats', () => {
    const techs = ['horticulture', 'horticulture-improved', 'fertilization', 'precision-cross-breeding'];
    expect(getEffectiveRates('mo', 4, techs).food).toBeCloseTo(45 * 1.3 * 1.1 * 1.1);
    expect(calculateRPM({ ...emptyVillagers, food_sheep: 10 }, 'mo', 4, techs).food).toBe(708);
    expect(calculateRPM({ ...emptyVillagers, food_fish: 10 }, 'mo', 4, techs).food).toBe(944);
    expect(calculateRPM({ ...emptyVillagers, food_deep_fish: 10 }, 'mo', 4, techs).food).toBe(450);
    expect(calculateRPM({ ...emptyVillagers, food_deer: 10 }, 'mo', 4, techs).food).toBe(495);
    expect(getEffectiveRates('mo', 2, ['horticulture']).food).toBeCloseTo(49.5);
  });

  it('uses shaft-mining and precision IDs and does not stack improved first-tier techs', () => {
    const techs = ['specialized-pick', 'specialized-pick-improved', 'shaft-mining-3', 'cupellation',
      'double-broadax', 'double-broadax-improved', 'lumber-preservation', 'crosscut-saw'];
    expect(getEffectiveRates('mo', 4, techs).gold).toBeCloseTo(45 * 1.35 * 1.15 * 1.15);
    expect(getEffectiveRates('mo', 4, techs).wood).toBeCloseTo(45 * 1.35 * 1.15 * 1.15);
    expect(getEffectiveRates('mo', 4, ['acid-distillation', 'cross-breeding']).food).toBe(45);
  });

  it('does not invent raw gather-rate gains for carry, movement or chopping upgrades', () => {
    const techs = ['wheelbarrow', 'wheelbarrow-improved', 'forestry', 'forestry-improved'];
    expect(getEffectiveRates('mo', 4, techs, { deerStones: true })).toEqual(getEffectiveRates('mo', 4, []));
  });

  it('applies academy speed to output and all drains, replacing the normal upgrade', () => {
    const normal = calculateProductionDrain(production, [keshik], 'mo', {}, ['military-academy']);
    const improved = calculateProductionDrain(production, [keshik], 'mo', {},
      ['military-academy-3', 'military-academy-improved-3']);
    expect(normal.perUnit[0].upm).toBeCloseTo(4 * 1.33);
    expect(improved.perUnit[0].upm).toBeCloseTo(4 * 1.53);
    expect(improved.total.food).toBeCloseTo(240 * 1.53);
    expect(improved.total.gold).toBeCloseTo(160 * 1.53);
    expect(improved.total.stone).toBeCloseTo(400 * 1.53);
    const support = { ...keshik, classes: ['religious', 'cavalry'] };
    expect(calculateProductionDrain(production, [support], 'mo', {}, ['military-academy']).perUnit[0].upm).toBe(4);
  });

  it('preserves invalid-time diagnostics with academy selected', () => {
    for (const time of [undefined, 0, -1, NaN, Infinity]) {
      const u = { ...keshik, costs: { ...keshik.costs, time } };
      const result = calculateProductionDrain(production, [u], 'mo', {}, ['military-academy']);
      expect(result.missingTimeUnits).toEqual([keshik.id]);
      expect(result.total).toEqual(expectedZeroResources);
    }
  });

  it('uses normal or improved Tithe Barns income in forward and reverse calculations', () => {
    expect(calculateRPM(emptyVillagers, 'mo', 4, ['tithe-barns'], 0, 0, 0, {}, 2))
      .toEqual({ ...expectedZeroResources, food: 80, wood: 80, gold: 200, stone: 20 });
    expect(calculateRPM(emptyVillagers, 'mo', 4, ['tithe-barns', 'tithe-barns-improved'], 0, 0, 0, {}, 2))
      .toEqual({ ...expectedZeroResources, food: 120, wood: 120, gold: 200, stone: 30 });
    const required = calculateRequiredVillagers(production, [keshik], 'mo', 4,
      ['tithe-barns-improved'], 0, 0, 0, 0, {}, 2);
    expect(required.food).toBe(3);
    expect(required.gold).toBe(0);
    expect(required.stoneDeficit).toBe(370);
  });

  it('gates hunters and excludes Khan, free Khaganate spawns and field-only siege', () => {
    expect(isTrainableUnit(keshik, 'mo', 2)).toBe(true);
    expect(isTrainableUnit(keshik, 'mo', 1)).toBe(false);
    expect(isTrainableUnit(hunter, 'mo', 2)).toBe(false);
    expect(isTrainableUnit(hunter, 'mo', 2, { deerStones: true })).toBe(true);
    expect(isTrainableUnit({ ...keshik, baseId: 'khan', producedBy: [] }, 'mo', 4)).toBe(false);
    expect(isTrainableUnit({ ...keshik, classes: ['military', 'khaganate'] }, 'mo', 4)).toBe(false);
    expect(isTrainableUnit({ ...keshik, producedBy: ['khaganate-palace'] }, 'mo', 4)).toBe(false);
    expect(isTrainableUnit({ ...keshik, producedBy: ['spearman', 'archer'] }, 'mo', 4)).toBe(false);
    const ram = { ...keshik, age: 2, producedBy: ['siege-workshop'], classes: ['military', 'siege'] };
    expect(isTrainableUnit(ram, 'mo', 2)).toBe(false);
    expect(isTrainableUnit(ram, 'mo', 3)).toBe(true);
    expect(isTrainableUnit({ ...horseman, classes: ['military', 'ship'] }, 'en', 4)).toBe(false);
  });

  it('keeps exclusive double production distinct from the normal alternative', () => {
    const rpm = { ...expectedZeroResources, food: 240, gold: 160, stone: 100 };
    expect(calculateMaxProduction(rpm, [keshik], 'mo', false)[0].maxSustainable).toBe(2);
    expect(calculateMaxProduction(rpm, [keshik], 'mo', true)[0].maxSustainable).toBe(1);
    expect(calculateMaxProduction(rpm, [keshik], 'mo', true, { whiteStupa: true })[0].maxSustainable).toBe(2);
  });

  it('calculates the tradeoff solely from supplied live building costs', () => {
    expect(calculateBuildingTradeoff({ costs: { wood: 750 } }, { costs: { wood: 150 } }))
      .toEqual({ pastures: 5, remainingWood: 0 });
    expect(calculateBuildingTradeoff({ costs: { wood: 650 } }, { costs: { wood: 175 } }))
      .toEqual({ pastures: 3, remainingWood: 125 });
    for (const wood of [0, -1, NaN, Infinity])
      expect(calculateBuildingTradeoff({ costs: { wood: 900 } }, { costs: { wood } }).pastures).toBe(0);
  });

  it('preserves other-civ rates and Golden Horde Ovoo counts', () => {
    expect(calculateRPM(emptyVillagers, 'gol', 1, [], 2).stone).toBe(160);
    expect(calculateRPM(emptyVillagers, 'gol', 2, [], 2).stone).toBe(210);
    expect(getEffectiveRates('en', 4, ['horticulture']).food).toBeCloseTo(45 * 1.15 * 1.3);
    expect(getEffectiveRates('en', 4, ['wheelbarrow']).wood).toBeCloseTo(49.5);
    expect(calculateRPM({ ...emptyVillagers, stone: 2, food_farms: 2 }, 'en', 4, []))
      .toEqual({ ...expectedZeroResources, food: 117, stone: 90 });
    expect(calculateProductionDrain([{ id: horseman.id, buildings: 1, doubleProduced: true }],
      [horseman], 'en', { whiteStupa: true }, ['military-academy']).perUnit[0].upm).toBe(2);
  });
});
