import { beforeEach, describe, expect, it } from 'vitest';
import { useCalculatorStore } from './useCalculatorStore';

const store = () => useCalculatorStore.getState();
const mountedTotal = () => Object.values(store().mountedVillagers).reduce((sum, count) => sum + count, 0);

beforeEach(() => store().loadFromUrl('?civ=jin&age=1'));

describe('Jin state and URL', () => {
  it('loads legacy links as regular workers without an assumed tributary income', () => {
    store().loadFromUrl('?civ=jin&age=3&wood=40&tb=3');
    expect(store().villagers.wood).toBe(40);
    expect(mountedTotal()).toBe(0);
    expect(store().villagerType).toBe('regular');
    expect(store().tributaryFoodRate).toBe(0);
  });

  it('loads explicit mounted allocation, TC choice, and user-provided income', () => {
    store().loadFromUrl('?civ=jin&age=3&food_sheep=0&wood=10&mv_wood=5&mv_food_farms=3&vt=mounted&tb=2&tfr=80&tc=0');
    expect(store().villagers.food_sheep).toBe(0);
    expect(store().villagers.wood).toBe(10);
    expect(store().mountedVillagers.wood).toBe(5);
    expect(store().mountedVillagers.food_farms).toBe(3);
    expect(store().villagerType).toBe('mounted');
    expect(store().tributaries).toBe(2);
    expect(store().tributaryFoodRate).toBe(80);
    expect(store().tcProducingVillagers).toBe(0);
  });

  it('rejects early tributaries from URL and actions', () => {
    store().loadFromUrl('?civ=jin&age=2&tb=3&mv_wood=99');
    expect(store().tributaries).toBe(0);
    expect(store().tributaryFoodRate).toBe(0);
    expect(mountedTotal()).toBe(20);
    store().setTributaries(3);
    expect(store().tributaries).toBe(0);
  });

  it('limits the sum of mounted allocations without reducing other inputs', () => {
    store().setMountedVillagers('wood', 15);
    store().setMountedVillagers('gold', 15);
    expect(store().mountedVillagers.wood).toBe(15);
    expect(store().mountedVillagers.gold).toBe(5);
    expect(mountedTotal()).toBe(20);
    store().setMountedVillagers('wood', -1);
    expect(store().mountedVillagers.wood).toBe(0);
  });

  it('renormalizes mounted workers when tributaries or age decrease', () => {
    store().setAge(3);
    store().setTributaries(3);
    store().setMountedVillagers('wood', 29);
    expect(mountedTotal()).toBe(29);
    store().setTributaries(1);
    expect(mountedTotal()).toBe(23);
    store().setAge(2);
    expect(store().tributaries).toBe(0);
    expect(mountedTotal()).toBe(20);
  });

  it('resets Jin-only settings when changing civilization', () => {
    store().loadFromUrl('?civ=jin&age=3&mv_wood=10&vt=mounted&tb=2&tfr=80');
    store().setCiv('en');
    expect(mountedTotal()).toBe(0);
    expect(store().tributaries).toBe(0);
    expect(store().villagerType).toBe('regular');
    expect(store().tributaryFoodRate).toBe(0);
    store().setMountedVillagers('wood', 10);
    store().setTributaries(3);
    store().setVillagerType('mounted');
    expect(mountedTotal()).toBe(0);
    expect(store().tributaries).toBe(0);
    expect(store().villagerType).toBe('regular');
  });

  it('preserves fishing and relic URL parameters with Jin settings', () => {
    store().loadFromUrl('?civ=jin&age=3&food_fish=2&food_deep_fish=3&rl=2&mv_food_fish=4&mv_food_deep_fish=10');
    expect(store().villagers.food_fish).toBe(2);
    expect(store().villagers.food_deep_fish).toBe(3);
    expect(store().relics).toBe(2);
    expect(store().mountedVillagers.food_fish).toBe(4);
    expect(store().mountedVillagers.food_deep_fish).toBe(0);
  });

  it('sanitizes malformed mounted inputs', () => {
    store().loadFromUrl('?civ=jin&age=3&tb=NaN&tfr=Infinity&mv_wood=Infinity&mv_gold=-5&mv_food_farms=nope');
    expect(mountedTotal()).toBe(0);
    expect(store().tributaries).toBe(0);
    store().setTributaryFoodRate(Infinity);
    expect(store().tributaryFoodRate).toBe(0);
  });
});
