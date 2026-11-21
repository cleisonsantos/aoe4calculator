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
  ['wheelbarrow', 1, 'jin'],
  ['forestry', 1, 'jin'],
  ['mohe-ancestry', 1, 'jin'],
  ['survival-techniques', 1, 'en'],
  ['wheelbarrow-improved', 1, 'mo'],
  ['double-broadax', 2, 'jin'],
  ['horticulture', 2, 'jin'],
  ['specialized-pick', 2, 'jin'],
  ['hunting-tradition', 2, 'jin'],
  ['lumber-preservation', 3, 'jin'],
  ['draft-horses', 3, 'jin'],
  ['fertilization', 3, 'jin'],
  ['shaft-mining', 3, 'jin'],
  ['military-academy', 3, 'jin'],
  ['crosscut-saw', 4, 'jin'],
  ['precision-cross-breeding', 4, 'jin'],
  ['cupellation', 4, 'jin'],
  ['tithe-barns', 4, 'jin'],
  ['cross-breeding', 4, 'en'],
].map(([id, age, civ]) => ({ baseId: id, id, name: id, age, civs: [civ], costs: {}, icon: 'test.png' }));

beforeEach(() => useCalculatorStore.getState().loadFromUrl('?civ=jin&age=1'));

describe('Jin technology controls', () => {
  it('shows exact Age 1 Jin techs and hides other-civ or future-age techs', () => {
    const html = renderToStaticMarkup(<TechSelector techs={techs} />);
    expect(html).toContain('>wheelbarrow<');
    expect(html).toContain('>forestry<');
    expect(html).toContain('>mohe-ancestry<');
    expect(html).not.toContain('>survival-techniques<');
    expect(html).not.toContain('>wheelbarrow-improved<');
    expect(html).not.toContain('Ovoo Improved');
    expect(html).not.toContain('>hunting-tradition<');
    expect(html).not.toContain('>draft-horses<');
    expect(html).not.toContain('>military-academy<');
  });

  it('unlocks Jin-unique and production/relic techs at their real ages', () => {
    useCalculatorStore.getState().setAge(3);
    const age3 = renderToStaticMarkup(<TechSelector techs={techs} />);
    expect(age3).toContain('>hunting-tradition<');
    expect(age3).toContain('>draft-horses<');
    expect(age3).toContain('>shaft-mining<');
    expect(age3).toContain('>military-academy<');
    expect(age3).not.toContain('>tithe-barns<');
    expect(age3).not.toContain('>precision-cross-breeding<');

    useCalculatorStore.getState().setAge(4);
    const age4 = renderToStaticMarkup(<TechSelector techs={techs} />);
    expect(age4).toContain('>precision-cross-breeding<');
    expect(age4).toContain('>tithe-barns<');
    expect(age4).not.toContain('>cross-breeding<');
    expect(age4).toContain('Military Academy uses the API description');
    expect(age4).toContain('Mohe Ancestry and Hunting Tradition');
  });
});
