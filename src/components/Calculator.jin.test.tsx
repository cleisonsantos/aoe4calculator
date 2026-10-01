import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { OutputDashboard, RequiredVillagersBar, ProductionSummary, RpmBar, MaxProductionGrid } from './OutputDashboard';
import { PassiveGenerationSelector } from './PassiveGenerationSelector';
import { TownCenterSelector } from './TownCenterSelector';
import { VillagerAllocator } from './VillagerAllocator';
vi.mock('../store/useCalculatorStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/useCalculatorStore')>();
  return {
    ...actual,
    useCalculatorStore: Object.assign(
      () => actual.useCalculatorStore.getState(),
      actual.useCalculatorStore
    ),
  };
});

vi.mock('../hooks/useAoE4Data', () => ({
  useAoE4Data: () => ({
    loading: false,
    error: null,
    technologies: [],
    units: [
      { id: 'villager-1', baseId: 'villager', name: 'Villager', civs: ['jin', 'en'],
        costs: { food: 50, gold: 0, time: 20 }, classes: ['villager'], age: 1 },
      { id: 'mounted-villager-1', baseId: 'mounted-villager', name: 'Mounted Villager', civs: ['jin'],
        costs: { food: 65, gold: 50, time: 35 }, classes: ['villager', 'mounted_villager'], age: 1 },
      { id: 'horseman-2', baseId: 'horseman', name: 'Horseman', civs: ['jin'],
        costs: { food: 75, wood: 20 }, classes: ['military'], age: 2 },
      { id: 'spearman-2', baseId: 'spearman', name: 'Spearman', civs: ['jin'],
        costs: { food: 60, wood: 20, time: 15 }, classes: ['military'], age: 2 },
    ],
  }),
}));

beforeEach(() => useCalculatorStore.getState().loadFromUrl('?civ=jin&age=2'));

describe('Jin UI integration', () => {
  it('renders an explicit unavailable warning instead of partial economy totals', () => {
    useCalculatorStore.getState().setUnitProduction('horseman-2', 1);
    useCalculatorStore.getState().setUnitProduction('spearman-2', 1);
    const html = renderToStaticMarkup(<><RequiredVillagersBar /><ProductionSummary /><OutputDashboard /></>);
    expect(html).toContain('Production calculation unavailable');
    expect(html).toContain('Horseman');
    expect(html).not.toContain('Total Villagers Needed');
    expect(html).not.toContain('Required Villagers:');
    expect(html).not.toContain('Can Produce Both Simultaneously');
  });

  it('renders valid required economy with its regular-worker assumption', () => {
    useCalculatorStore.getState().setUnitProduction('spearman-2', 1);
    const html = renderToStaticMarkup(<RequiredVillagersBar />);
    expect(html).toContain('Required Villagers:');
    expect(html).toContain('Economy expressed in regular villagers');
  });

  it('renders Resource Mode without depending on training time', () => {
    useCalculatorStore.getState().loadFromUrl('?civ=jin&age=2&mode=resource&food_sheep=0&wood=10&mv_food_sheep=6');
    const html = renderToStaticMarkup(<><RpmBar /><MaxProductionGrid /></>);
    expect(html).toContain('594');
    expect(html).toContain('Horseman');
    expect(html).not.toContain('Production calculation unavailable');
  });

  it('checks gold as well as food for mounted TCs in Resource Mode', () => {
    useCalculatorStore.getState().loadFromUrl('?civ=jin&age=3&mode=resource&mv_food_sheep=6&vt=mounted');
    const html = renderToStaticMarkup(<TownCenterSelector />);
    expect(html).toContain('Not enough resources for TCs');
    expect(html).toContain('gold surplus:');
    expect(html).not.toContain('Can sustain TC production');
  });

  it('includes relics and tributaries in Resource Mode TC sustainability', () => {
    useCalculatorStore.getState().loadFromUrl('?civ=jin&age=3&mode=resource&food_sheep=0&vt=mounted&tb=2&tfr=80&rl=1');
    const html = renderToStaticMarkup(<TownCenterSelector />);
    expect(html).toContain('Can sustain TC production');
  });

  it('renders the chosen TC costs from live data', () => {
    useCalculatorStore.getState().setVillagerType('mounted');
    const html = renderToStaticMarkup(<TownCenterSelector />);
    expect(html).toContain('65F + 50G');
    expect(html).toContain('35s each');
  });

  it('disables early tributary controls and limits their inputs to Jin', () => {
    const jin = renderToStaticMarkup(<PassiveGenerationSelector />);
    expect(jin).toContain('Tributary States');
    expect(jin).toContain('Food/min per state (user-provided)');
    expect((jin.match(/disabled=""/g) ?? []).length).toBe(5);
    useCalculatorStore.getState().setCiv('en');
    const english = renderToStaticMarkup(<PassiveGenerationSelector />);
    expect(english).not.toContain('Tributary States');
    expect(english).not.toContain('Food/min per state');
  });

  it('renders separate worker inputs and disclosed estimates only for Jin', () => {
    const html = renderToStaticMarkup(<VillagerAllocator />);
    expect(html).toContain('Wood regular villagers');
    expect(html).toContain('Wood mounted villagers');
    expect(html).toContain('not verified for the current patch');
    useCalculatorStore.getState().setCiv('en');
    expect(renderToStaticMarkup(<VillagerAllocator />)).not.toContain('Mounted');
  });
});
