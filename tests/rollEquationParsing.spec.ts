/** @format */

import { convertRoll20RollToDddiceRoll, processRoll20InlineRollText } from '../src/rollConverters';

describe('Roll20 /roll', () => {
  it('2d20kh1', async () => {
    const element = document.createElement('div');
    element.innerHTML =
      '<div class="message rollresult you player--NIQ1NLsipuivg28Shbz quantumRoll" data-messageid="-NjrBORWdQf1u3Ja0jpv" data-playerid="-NIQ1NLsipuivg28Shbz"><div class="formula" style="margin-bottom: 3px;">rolling 2d20kh1</div><div class="clear"></div><div class="formula formattedformula"><div class="dicegrouping ui-sortable" data-groupindex="0">(<div data-origindex="0" class="diceroll d20"><div class="dicon"><div class="didroll">12</div><div class="backing"></div></div>+</div><div data-origindex="1" class="diceroll d20 dropped "><div class="dicon"><div class="didroll">9</div><div class="backing"></div></div></div>)</div><div class="clear"></div></div><div class="clear"></div><strong>=</strong><div class="rolled ui-draggable ui-draggable-handle">12</div></div>';
    const actual = await convertRoll20RollToDddiceRoll(element, 'test-theme');
    expect(actual).toEqual({
      dice: [
        { theme: 'test-theme', type: 'd20', value: 12 },
        { theme: 'test-theme', type: 'd20', value: 9 },
      ],
      operator: { k: 'h1' },
    });
  });

  it('2d20kh', async () => {
    const element = document.createElement('div');
    element.innerHTML =
      '<div class="message rollresult you player--NIQ1NLsipuivg28Shbz quantumRoll" data-messageid="-NjrBORWdQf1u3Ja0jpv" data-playerid="-NIQ1NLsipuivg28Shbz"><div class="formula" style="margin-bottom: 3px;">rolling 2d20kh</div><div class="clear"></div><div class="formula formattedformula"><div class="dicegrouping ui-sortable" data-groupindex="0">(<div data-origindex="0" class="diceroll d20"><div class="dicon"><div class="didroll">12</div><div class="backing"></div></div>+</div><div data-origindex="1" class="diceroll d20 dropped "><div class="dicon"><div class="didroll">9</div><div class="backing"></div></div></div>)</div><div class="clear"></div></div><div class="clear"></div><strong>=</strong><div class="rolled ui-draggable ui-draggable-handle">12</div></div>';
    const actual = await convertRoll20RollToDddiceRoll(element, 'test-theme');
    expect(actual).toEqual({
      dice: [
        { theme: 'test-theme', type: 'd20', value: 12 },
        { theme: 'test-theme', type: 'd20', value: 9 },
      ],
      operator: { k: 'h1' },
    });
  });

  it('round(3d6/3)', async () => {
    const element = document.createElement('div');
    element.innerHTML =
      '<div class="message rollresult you player--NIQ1NLsipuivg28Shbz quantumRoll" data-messageid="-NjpZkx__cu6B6-EX4aT" data-playerid="-NIQ1NLsipuivg28Shbz"><div class="formula" style="margin-bottom: 3px;">rolling round(3d6/3)</div><div class="clear"></div><div class="formula formattedformula">round(<div class="dicegrouping ui-sortable" data-groupindex="1">(<div data-origindex="0" class="diceroll d6"><div class="dicon"><div class="didroll">3</div><div class="backing"></div></div>+</div><div data-origindex="1" class="diceroll d6"><div class="dicon"><div class="didroll">2</div><div class="backing"></div></div>+</div><div data-origindex="2" class="diceroll d6 critsuccess "><div class="dicon"><div class="didroll">6</div><div class="backing"></div></div></div>)</div>/3)<div class="clear"></div></div><div class="clear"></div><strong>=</strong><div class="rolled ui-draggable ui-draggable-handle">4</div></div>';
    const actual = await convertRoll20RollToDddiceRoll(element, 'test-theme');
    expect(actual).toEqual({
      dice: [
        { theme: 'test-theme', type: 'd6', value: 3 },
        { theme: 'test-theme', type: 'd6', value: 2 },
        { theme: 'test-theme', type: 'd6', value: 6 },
      ],
      operator: { '/': '3', round: 'nearest' },
    });
  });

  it('2d6', async () => {
    const element = document.createElement('div');
    element.innerHTML =
      '<div class="message rollresult you player--NIQ1NLsipuivg28Shbz quantumRoll" data-messageid="-NjpZigEMdtXtJq3roWq" data-playerid="-NIQ1NLsipuivg28Shbz"><div class="formula" style="margin-bottom: 3px;">rolling 2d6</div><div class="clear"></div><div class="formula formattedformula"><div class="dicegrouping ui-sortable" data-groupindex="0">(<div data-origindex="0" class="diceroll d6 critsuccess "><div class="dicon"><div class="didroll">6</div><div class="backing"></div></div>+</div><div data-origindex="1" class="diceroll d6 critsuccess "><div class="dicon"><div class="didroll">6</div><div class="backing"></div></div></div>)</div><div class="clear"></div></div><div class="clear"></div><strong>=</strong><div class="rolled ui-draggable ui-draggable-handle">12</div></div>';
    const actual = await convertRoll20RollToDddiceRoll(element, 'test-theme');
    expect(actual).toEqual({
      dice: [
        { theme: 'test-theme', type: 'd6', value: 6 },
        { theme: 'test-theme', type: 'd6', value: 6 },
      ],
      operator: {},
    });
  });

  it('4d4rr', async () => {
    const element = document.createElement('div');
    element.innerHTML =
      '<div class="message rollresult you player--NIQ1NLsipuivg28Shbz quantumRoll" data-messageid="-NjrTCLQhaCl3N0pYTgF" data-playerid="-NIQ1NLsipuivg28Shbz"><div class="formula" style="margin-bottom: 3px;">rolling 4d4rr</div><div class="clear"></div><div class="formula formattedformula"><div class="dicegrouping ui-sortable" data-groupindex="0">(<div data-origindex="0" class="diceroll d4"><div class="dicon"><div class="didroll">3</div><div class="backing"></div></div>+</div><div data-origindex="1" class="diceroll d4"><div class="dicon"><div class="didroll">2</div><div class="backing"></div></div>+</div><div data-origindex="2" class="diceroll d4 dropped  critfail "><div class="dicon"><div class="didroll">1</div><div class="backing"></div></div>+</div><div data-origindex="3" class="diceroll d4"><div class="dicon"><div class="didroll">3</div><div class="backing"></div></div>+</div><div data-origindex="4" class="diceroll d4"><div class="dicon"><div class="didroll">3</div><div class="backing"></div></div></div>)</div><div class="clear"></div></div><div class="clear"></div><strong>=</strong><div class="rolled ui-draggable ui-draggable-handle">11</div></div>';
    const actual = await convertRoll20RollToDddiceRoll(element, 'test-theme');
    // this is technically incorrect, but we don't support re-roll
    // yet so this is it I guess?
    // TODO: fix this when we try to support re-rolls
    expect(actual).toEqual({
      dice: [
        { theme: 'test-theme', type: 'd4', value: 3 },
        { theme: 'test-theme', type: 'd4', value: 2 },
        { theme: 'test-theme', type: 'd4', value: 1 },
        { theme: 'test-theme', type: 'd4', value: 3 },
      ],
      operator: {},
    });
  });
});

describe('Roll20 Pathfinder Character Sheet', () => {
  it('STR roll', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + (2)[ABILITY MODIFIER] + (0)[BONUS] = (<span class="basicdiceroll">5</span>)+(2)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 5 },
      { type: 'mod', value: 2 },
      { type: 'mod', value: 0 },
    ]);
    expect(operator).toEqual({});
  });

  it('Fortitude Save', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d20cs20cf1 + [ ] (0)[MODIFIER] + (0)[BONUS] = (<span class="basicdiceroll">18</span>)+(0)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd20', value: 18 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
    ]);
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
      { type: 'mod', value: 0 },
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
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
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
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
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
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
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
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { theme: 'test-theme', type: 'd8', value: 1 },
    ]);
    expect(operator).toEqual({ '*': { '2': [0, 1, 2, 3, 4, 5] } });
  });

  it('Custom Spell', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d6 + (0)[ABILITY MODIFIER] + ()[MISC] + (0)[OTHER] + (0)[BONUS TO DAMAGE] = (<span class="basicdiceroll critfail ">1</span>)+(0)+(0)',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd6', value: 1 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
      { type: 'mod', value: 0 },
    ]);
    expect(operator).toEqual({});
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

  it('Reroll Damage', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling 1d10rr+3 = (<span class="basicdiceroll">5</span>)"',
      'test-theme',
    );
    expect(dice).toEqual([
      { theme: 'test-theme', type: 'd10', value: 5 },
      { type: 'mod', value: 3 },
    ]);
    expect(operator).toEqual({});
  });

  it('Round Damage', async () => {
    const { dice, operator } = await processRoll20InlineRollText(
      '<img src="/images/quantumrollwhite.png" class="inlineqroll"> Rolling round(1d10) = (<span class="basicdiceroll">5</span>)"',
      'test-theme',
    );
    expect(dice).toEqual([{ theme: 'test-theme', type: 'd10', value: 5 }]);
    expect(operator).toEqual({ round: 'nearest' });
  });
});
