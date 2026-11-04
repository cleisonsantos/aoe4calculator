import { beforeEach, describe, expect, it } from 'vitest';
import { useCalculatorStore } from './useCalculatorStore';

const store = () => useCalculatorStore.getState();
beforeEach(() => store().loadFromUrl('?civ=mo&age=4'));

describe('Mongol economy state', () => {
  it('loads and clamps landmark URL options', () => {
    store().loadFromUrl('?civ=mo&age=4&ms=true&mr=true&md=true&oc=3&stone=50&food_farms=50');
    expect(store().mongolEconomy).toEqual({ whiteStupa: true, steppeRedoubt: true, deerStones: true });
    expect(store().ovooCount).toBe(1);
    expect(store().villagers.stone).toBe(0);
    expect(store().villagers.food_farms).toBe(0);
    store().setAge(2);
    expect(store().mongolEconomy).toEqual({ whiteStupa: false, steppeRedoubt: false, deerStones: true });
    store().setAge(1);
    expect(store().mongolEconomy.deerStones).toBe(false);
  });
  it('rejects early landmarks and unavailable allocations', () => {
    store().setAge(1);
    store().setMongolEconomy({ whiteStupa: true, deerStones: true, steppeRedoubt: true });
    expect(Object.values(store().mongolEconomy).some(Boolean)).toBe(false);
    store().setVillagers('stone', 20);
    store().setVillagers('food_farms', 20);
    expect(store().villagers.stone + store().villagers.food_farms).toBe(0);
    store().setOvoo(99, true);
    expect(store().ovooCount).toBe(1);
  });
  it('replaces normal and improved upgrades rather than stacking', () => {
    store().toggleTech('wheelbarrow');
    store().toggleTech('wheelbarrow-improved');
    expect(store().activeTechs).toEqual(['wheelbarrow-improved']);
    store().toggleTech('wheelbarrow');
    expect(store().activeTechs).toEqual(['wheelbarrow']);
  });
  it('resets options and preserves Golden Horde Ovoo behavior', () => {
    store().setMongolEconomy({ whiteStupa: true });
    store().setCiv('gol');
    expect(store().mongolEconomy).toEqual({});
    store().setOvoo(3, true);
    expect(store().ovooCount).toBe(3);
    store().loadFromUrl('?civ=en&age=4&ms=true&mr=true&md=true&food_farms=20&stone=10');
    expect(store().mongolEconomy).toEqual({});
    expect(store().villagers.food_farms).toBe(20);
    expect(store().villagers.stone).toBe(10);
  });
});
