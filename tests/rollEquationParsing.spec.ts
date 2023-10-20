/** @format */

import { processRoll20InlineRollText } from '../src/rollConverters';

describe('Roll20 Pathfinder Character Sheet', () => {
  it('STR roll', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + (2)[ABILITY MODIFIER] + (0)[BONUS] = (<span class="basicdiceroll">5</span>)+(2)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 5 },
      { type: 'mod', value: 2 },
    ]);
    expect(operator).toEqual({});
  });

  it('Fortitude Save', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + [ ] (0)[MODIFIER] + (0)[BONUS] = (<span class="basicdiceroll">18</span>)+(0)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([{ theme: 'test-theme', type: 'd20', value: 18 }]);
    expect(operator).toEqual({});
  });

  it('Acrobatics 3rd action', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + [ ] (2)[MODIFIER] + (-10)[MAP #3] + (0)[BONUS] = (<span class="basicdiceroll">4</span>)+(2)+(-10)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 4 },
      { type: 'mod', value: 2 },
      { type: 'mod', value: -10 },
    ]);
    expect(operator).toEqual({});
  });

  it('Rapier To Hit', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + [T] 5[MODIFIER] + (0)[OTHER] + (0)[BONUS] = (<span class="basicdiceroll">11</span>)+5+(0)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 11 },
      { type: 'mod', value: 5 },
    ]);
    expect(operator).toEqual({});
  });

  it('Rapier To Hit Second Attack', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + [T] 5[MODIFIER] + (-4)[MAP #2] + (0)[OTHER] + (0)[BONUS] = (<span class="basicdiceroll">3</span>)+5+(-4)+(0)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 3 },
      { type: 'mod', value: 5 },
      { type: 'mod', value: -4 },
    ]);
    expect(operator).toEqual({});
  });

  it('Rapier Damage', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1D6 + (2)[ABILITY MODIFIER] + (0)[WEAPON SPECIALIZATION] + (0)[TEMP] + (0)[OTHER] + (0)[BONUS TO DAMAGE] = (<span class="basicdiceroll">4</span>)+(2)+(0)+(0)+(0)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd6', value: 4 },
      { type: 'mod', value: 2 },
    ]);
    expect(operator).toEqual({});
  });

  it('Rapier Crit', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling (1D6 + (2)[ABILITY MODIFIER] + (0)[WEAPON SPECIALIZATION] + (0)[TEMP] + (0)[OTHER] + (0)[BONUS TO DAMAGE])*2 + (1d8)[ADDITIONAL DAMAGE] = ((<span class="basicdiceroll">4</span>)+(2)+(0)+(0)+(0)+(0))*2+((<span class="basicdiceroll critfail ">1</span>))',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd6', value: 4 },
      { type: 'mod', value: 2 },
      { theme: 'test-theme', type: 'd8', value: 1 },
    ]);
    expect(operator).toEqual({ '*': { '2': [0, 1] } });
  });
});

describe('Roll 20 D&D Character Sheet', () => {
  it('Strength Check', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20+-1[STR] = (<span class="basicdiceroll">2</span>)+-1',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 2 },
      { type: 'mod', value: -1 },
    ]);
    expect(operator).toEqual({});
  });

  it('Con Save', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20+3 = (<span class="basicdiceroll">3</span>)+3',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 3 },
      { type: 'mod', value: 3 },
    ]);
    expect(operator).toEqual({});
  });

  it('Acrobatics', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20+2[Proficiency]+1[dexterity] = (<span class="basicdiceroll">3</span>)+2+1',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 3 },
      { type: 'mod', value: 2 },
      { type: 'mod', value: 1 },
    ]);
    expect(operator).toEqual({});
  });

  it('Acrobatics', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20+2[Proficiency]+1[dexterity] = (<span class="basicdiceroll">3</span>)+2+1',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 3 },
      { type: 'mod', value: 2 },
      { type: 'mod', value: 1 },
    ]);
    expect(operator).toEqual({});
  });

  it('Firebolt To Hit', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs>20 + 3[CHA] + 2[PROF] = (<span class="basicdiceroll">18</span>)+3+2',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 18 },
      { type: 'mod', value: 3 },
      { type: 'mod', value: 2 },
    ]);
    expect(operator).toEqual({});
  });

  it('Firebolt Damage', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d10 = (<span class="basicdiceroll">5</span>)"',
      'test-theme',
    );
    expect(dice).toEqual([{ theme: 'test-theme', type: 'd10', value: 5 }]);
    expect(operator).toEqual({});
  });
});
