/** @format */

import { getStorage } from './storage';
import createLogger from './log';
import { parseRollEquation } from 'dddice-js';

const log = createLogger('roll converter');

const DEFAULT_THEME = 'dddice-bees';

export async function getThemeSlugFromStorage() {
  const theme = await getStorage('theme');
  return theme && theme.id != '' ? theme.id : DEFAULT_THEME;
}

function convertD100toD10x(theme, value?) {
  if (value) {
    return [
      {
        theme,
        type: 'd10x',
        value: Math.ceil(value / 10 - 1) === 0 ? 10 : Math.ceil(value / 10 - 1),
        value_to_display: `${Math.ceil(value / 10 - 1) * 10}`,
      },
      { theme, type: 'd10', value: ((value - 1) % 10) + 1 },
    ];
  } else {
    return [
      { theme, type: 'd10x' },
      { theme, type: 'd10' },
    ];
  }
}

export async function convertRoll20RollToDddiceRoll(roll20Roll: Element, equation: string) {
  const theme = await getThemeSlugFromStorage();
  const values = [];
  roll20Roll.querySelectorAll('.diceroll').forEach(die => {
    values.push(parseInt(die.querySelector('.didroll').textContent));
  });

  equation = equation
    // replace empty parens () with (0)
    .replace(/\(\)/g, '(0)')
    // replace cs20 and cs1 as our roll parser doesn't understand them
    .replace(/c[sf]\d+/g, '');

  return parseRollEquation(equation, theme, values);
}

export async function processRoll20InlineRollText(inlineRollText: string, theme: string) {
  const [_, equation, result] = inlineRollText
    .toLowerCase()
    // replace roll text labels
    .replace(/\[.*?]/g, '')
    // replace empty parens () with (0)
    .replace(/\(\)/g, '(0)')
    // replace cs20 and cs1 as our roll parser doesn't understand them
    .replace(/c[sf]\d+/g, '')
    .match(/rolling ([%*+\-/^.0-9dkhcsf><=(){}, ]*).* = (.*)/i) ?? [null, null, null];
  log.debug('roll equation?', _);
  if (equation && result) {
    log.debug('equation', equation);
    log.debug('result', result);

    const values = [];

    if (result) {
      // extract the roll values from the message
      [...result.matchAll(/<span class="basicdiceroll.*?">(\d+)<\/span>/g)].forEach(die => {
        log.debug('value', die[1]);
        const value = parseInt(die[1]);
        values.push(value);
      });

      (result.match(/\)([+-].\d+)/g) ?? []).forEach(modifier => {
        log.debug(modifier);
        const value = parseInt(modifier[0]);
        if (!isNaN(value)) {
          values.push();
        }
      });

      log.debug('values', values);
    }
    log.debug('equation', equation);
    return parseRollEquation(equation.replace(' ', '').toLowerCase(), theme, values);
  }
  return { dice: [], operator: {} };
}

export async function convertDiceRollButtons(element: HTMLDivElement, operator, isCritical) {
  const theme = await getThemeSlugFromStorage();

  let text;
  if (element.dataset?.text ?? element.textContent) {
    text = (element.dataset.text ?? element.textContent).replace(/[() ]/g, '');
  } else {
    text = element;
  }
  log.debug('equation', text);
  let modifier: number;
  let dieCount = Object.keys(operator).length === 0 ? 1 : 2;
  let dieType = 'd20';

  if (/\d*d\d*/.test(text)) {
    const [count, type] = text.split('d');
    dieCount = Number(count);
    dieType = `d${type.replace(/[+-].*/, '')}`;
  }

  if (isCritical) {
    dieCount *= 2;
  }

  if (/\+\d*/.test(text)) {
    const [num] = /\+(\d*)/.exec(text);
    modifier = Number(num);
  } else if (/-\d*/.test(text)) {
    const [num] = /-(\d*)/.exec(text);
    modifier = Number(num);
  } else if (!isNaN(+text)) {
    // convert raw stat into modifier
    if (Number(text) != 0) {
      modifier = Math.floor(Number(text) / 2) - 5;
    }
  }

  const roll = { [dieType]: dieCount };

  const dice = [];
  Object.entries(roll).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      if (type === 'd100') {
        dice.push({
          type: 'd10x',
          theme,
        });
        dice.push({
          type: 'd10',
          theme,
        });
      } else {
        dice.push({
          type,
          theme,
        });
      }
    }
  });

  if (modifier) {
    dice.push({
      type: 'mod',
      theme,
      value: modifier,
    });
  }
  return dice;
}

export async function pathbuilder2eToDddice(rollData) {
  const theme = await getThemeSlugFromStorage();
  const dice = [];
  const critDice = [];

  rollData.rollDiceDump.forEach((die, j) => {
    for (let i = 0; i < die.numDice; i++) {
      if (rollData.type === 'weaponDamageCritical' && die.extraCritDice === false) {
        critDice.push(j + i);
      }

      dice.push({
        type: 'd' + die.diceSize,
        theme,
      });
    }
  });

  if (rollData.rollBonus != 0) {
    dice.push({ type: 'mod', theme, value: rollData.rollBonus });
  }

  const operators = critDice ? { '*': { '2': critDice } } : null;

  return { dice, operators };
}

function convertOperators(equation: string) {
  const operator = {};
  const keep = equation.match(/k([lh])?(\d+)?/);
  if (keep) {
    if (keep.length > 0) {
      log.debug('keep.length', keep.length);
      if (keep.length == 3 && keep[1]) {
        operator['k'] = `${keep[1]}${keep[2]}`;
      } else if (keep.length == 3 && keep[2]) {
        operator['k'] = `h${keep[2]}`;
      } else {
        operator['k'] = 'h1';
      }
    }
    log.debug(operator);
    return operator;
  }
}
