/** @format */

import { getStorage } from './storage';
import { Parser } from '@dice-roller/rpg-dice-roller';
import createLogger from './log';

const log = createLogger('roll converter');

const DEFAULT_THEME = 'dddice-standard';

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

export async function convertRoll20RollToDddiceRoll(roll20Roll: Element) {
  let theme = await getStorage('theme');
  theme = theme && theme.id != '' ? theme.id : DEFAULT_THEME;
  const dice = [];
  roll20Roll.querySelectorAll('.diceroll').forEach(die => {
    let type = null;
    const value = parseInt(die.querySelector('.didroll').textContent);
    die.classList.forEach(className => {
      if (className !== 'dropped' && className.startsWith('d')) {
        type = className;
      }
    });
    if (type === 'd100') {
      convertD100toD10x(theme, value).map(die => dice.push(die));
    } else {
      dice.push({
        theme,
        type,
        value,
      });
    }
  });
  roll20Roll.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      log.debug('modifiers', node.textContent);
      // @ts-ignore
      for (const modifier of node.textContent.matchAll(/[-+]\d/g)) {
        log.debug(modifier);
        dice.push({
          theme,
          type: 'mod',
          value: parseInt(modifier[0]),
        });
      }
    }
  });
  return dice;
}

export async function convertInlineRollToDddiceRoll(equation, result) {
  let theme = await getStorage('theme');
  theme = theme && theme.id != '' ? theme.id : DEFAULT_THEME;

  const dice = [];
  const parsedEquation = Parser.parse(equation);
  const roll20Roll = document.createElement('div');
  roll20Roll.innerText = result;

  // extract the roll values from the message
  const values = [];
  roll20Roll.querySelectorAll('.basicdiceroll').forEach(die => {
    const value = parseInt(die.textContent);
    values.push(value);
  });

  roll20Roll.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      log.debug('modifiers', node.textContent);
      // @ts-ignore
      for (const modifier of node.textContent.matchAll(/[-+]\d/g)) {
        log.debug(modifier);
        values.push(parseInt(modifier[0]));
      }
    }
  });

  // build the roll object
  let sign = 1;
  let dieIndex = 0;
  let hasDice = false;
  parsedEquation.forEach(term => {
    if (term.sides && term.qty) {
      hasDice = true;
      for (let i = 0; i < term.qty; i++) {
        if (result) {
          if (term.sides === 100) {
            convertD100toD10x(theme, values[dieIndex++]).map(die => dice.push(die));
          } else {
            dice.push({
              theme,
              type: `d${term.sides}`,
              value: parseInt(values[dieIndex++]),
            });
          }
        } else {
          if (term.sides === 100) {
            convertD100toD10x(theme).map(die => dice.push(die));
          } else {
            dice.push({
              theme,
              type: `d${term.sides}`,
            });
          }
        }
      }
    } else if (term === '+') {
      sign = 1;
    } else if (term === '-') {
      sign = -1;
    } else if (!isNaN(sign * parseInt(term))) {
      log.debug('bad mod?', term, parseInt(term));
      dice.push({
        theme,
        type: 'mod',
        value: sign * parseInt(term),
      });
    }
  });
  return hasDice ? dice : [];
}

export async function convertDiceRollButtons(element: HTMLDivElement, operator, isCritical) {
  const _theme = await getStorage('theme');

  const theme = _theme && _theme.id != '' ? _theme.id : DEFAULT_THEME;

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
