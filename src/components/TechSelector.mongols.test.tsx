import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { TechSelector } from './TechSelector';

vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: () => [false, () => {}] };
});
vi.mock('../store/useCalculatorStore', async importOriginal => {
  const actual = await importOriginal<typeof import('../store/useCalculatorStore')>();
  return { ...actual, useCalculatorStore: Object.assign(() => actual.useCalculatorStore.getState(), actual.useCalculatorStore) };
});
const techs = [
  ['wheelbarrow', 1, 'mo'], ['wheelbarrow-improved', 1, 'mo'],
  ['military-academy', 3, 'mo'], ['military-academy-improved', 3, 'mo'],
  ['tithe-barns', 4, 'mo'], ['tithe-barns-improved', 4, 'mo'],
  ['precision-cross-breeding', 4, 'mo'], ['cross-breeding', 4, 'en'],
].map(([id, age, civ]) => ({ baseId: id, id, name: id, age, civs: [civ], costs: {}, icon: 'test.png' }));
beforeEach(() => useCalculatorStore.getState().loadFromUrl('?civ=mo&age=1'));
describe('Mongol technology controls', () => {
  it('requires exact civ data, age and influence for improved research', () => {
    const early = renderToStaticMarkup(<TechSelector techs={techs} />);
    expect(early).toContain('>wheelbarrow<');
    expect(early).not.toContain('>wheelbarrow-improved<');
    expect(early).not.toContain('>military-academy<');
    useCalculatorStore.getState().setOvoo(1, false);
    expect(renderToStaticMarkup(<TechSelector techs={techs} />)).toContain('>wheelbarrow-improved<');
  });
  it('shows the real precision, military and tithe IDs at the correct age', () => {
    useCalculatorStore.getState().setAge(4);
    useCalculatorStore.getState().setMongolEconomy({ whiteStupa: true });
    const html = renderToStaticMarkup(<TechSelector techs={techs} />);
    expect(html).toContain('>precision-cross-breeding<');
    expect(html).not.toContain('>cross-breeding<');
    expect(html).toContain('>military-academy-improved<');
    expect(html).toContain('>tithe-barns-improved<');
    expect(html).toContain('Monastic Shrines influence is not modeled');
  });
  it('retains a researched improved upgrade after influence is lost', () => {
    useCalculatorStore.getState().toggleTech('wheelbarrow-improved');
    const html = renderToStaticMarkup(<TechSelector techs={techs} />);
    expect(html).toContain('>wheelbarrow-improved<');
    expect(html).toContain('Researched upgrades remain active');
  });
});
