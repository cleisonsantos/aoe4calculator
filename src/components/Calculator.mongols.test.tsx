import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { VillagerAllocator } from './VillagerAllocator';
import { PassiveGenerationSelector } from './PassiveGenerationSelector';
import { TownCenterSelector } from './TownCenterSelector';
import { UnitSelector } from './UnitSelector';
import { RequiredVillagersBar, OutputDashboard, MaxProductionGrid } from './OutputDashboard';
import type { UnitData } from '../data/api';

vi.mock('../store/useCalculatorStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/useCalculatorStore')>();
  return { ...actual, useCalculatorStore: Object.assign(() => actual.useCalculatorStore.getState(), actual.useCalculatorStore) };
});
const units: UnitData[] = [
  { id: 'spearman-1', baseId: 'spearman', name: 'Spearman', civs: ['mo'], costs: { food: 60, wood: 20, gold: 0, stone: 0, time: 15 }, age: 1, classes: ['military'], producedBy: ['barracks'], icon: 'unit.png' },
  { id: 'khan-1', baseId: 'khan', name: 'Khan', civs: ['mo'], costs: { food: 0, wood: 0, gold: 0, stone: 0 }, age: 1, classes: ['military'], producedBy: ['town-center'], icon: 'unit.png' },
  { id: 'villager-1', baseId: 'villager', name: 'Villager', civs: ['mo'], costs: { food: 50, wood: 0, gold: 0, stone: 0, time: 15 }, age: 1, classes: ['villager'], producedBy: ['town-center'], icon: 'unit.png' },
];
vi.mock('../hooks/useAoE4Data', () => ({
  useAoE4Data: () => ({
    units, technologies: [], loading: false, error: null,
    buildings: [
      { baseId: 'town-center', name: 'Town Center', civs: ['mo'], costs: { wood: 900 } },
      { baseId: 'pasture', name: 'Pasture', civs: ['mo'], costs: { wood: 200 } },
    ],
  }),
}));
beforeEach(() => useCalculatorStore.getState().loadFromUrl('?civ=mo&age=4&tc=1'));

describe('Mongol UI', () => {
  it('hides impossible mining and farming allocations', () => {
    const html = renderToStaticMarkup(<VillagerAllocator />);
    expect(html).not.toContain('Stone regular villagers');
    expect(html).not.toContain('Farms regular villagers');
    expect(html).toContain('Sheep regular villagers');
  });
  it('discloses landmark alternatives and influence assumptions', () => {
    const html = renderToStaticMarkup(<PassiveGenerationSelector />);
    expect(html).toContain('Silver Tree');
    expect(html).toContain('Kurultai');
    expect(html).toContain('Khaganate Palace');
    expect(html).toContain('within its influence');
  });
  it('uses fetched building costs rather than fixed game stats', () => {
    const html = renderToStaticMarkup(<TownCenterSelector />);
    expect(html).toContain('buys 4 pastures, with 100 wood remaining');
    expect(html).toContain('not direct food income');
  });
  it('excludes Khan and labels double-production cost per pair', () => {
    useCalculatorStore.getState().setUnitProduction('spearman-1', 1);
    const html = renderToStaticMarkup(<UnitSelector units={units} />);
    expect(html).not.toContain('>Khan<');
    expect(html).toContain('80 stone per pair');
  });
  it('shows unsatisfied stone without claiming complete sustainability', () => {
    useCalculatorStore.getState().setUnitProduction('spearman-1', 1);
    useCalculatorStore.getState().toggleDoubleProduction('spearman-1');
    const html = renderToStaticMarkup(<><RequiredVillagersBar /><OutputDashboard /></>);
    expect(html).toContain('Stone deficit:');
    expect(html).not.toContain('Can Produce Both Simultaneously');
  });
  it('labels the normal training building instead of a free-spawn landmark', () => {
    const keshik = { ...units[0], id: 'keshik-2', baseId: 'keshik', name: 'Keshik', producedBy: ['khaganate-palace', 'stable'] };
    useCalculatorStore.getState().setUnitProduction(keshik.id, 1);
    const html = renderToStaticMarkup(<UnitSelector units={[keshik]} />);
    expect(html).toContain('>stable<');
    expect(html).not.toContain('khaganate palace');
  });
  it('shows normal production as an alternative when double production has no stone', () => {
    useCalculatorStore.getState().loadFromUrl('?civ=mo&age=2&mode=resource&food_sheep=10&wood=10&od=true');
    const html = renderToStaticMarkup(<MaxProductionGrid />);
    expect(html).toContain('Normal: 7.5/min');
    expect(html).toContain('exclusively double-produced pairs');
  });
});
