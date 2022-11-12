/** @format */

import { getStorage } from './storage';
import { Parser } from '@dice-roller/rpg-dice-roller';
import createLogger from './log';
const log = createLogger('roll converter');

function convertD100toD10x(theme, value) {
  return [
    {
      theme,
      type: 'd10x',
      value: Math.ceil(value / 10 - 1) === 0 ? 10 : Math.ceil(value / 10 - 1),
      value_to_display: `${Math.ceil(value / 10 - 1) * 10}`,
    },
    { theme, type: 'd10', value: ((value - 1) % 10) + 1 },
  ];
}

export async function convertRoll20RollToDddiceRoll(roll20Roll: Element) {
  const theme = await getStorage('theme');
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

export async function convertCoCRollToDddiceRoll(equation, result) {
  const theme = await getStorage('theme');
  const dice = [];

  const parsedEquation = Parser.parse(equation);

  let sign = 1;
  parsedEquation.forEach(term => {
    if (term.sides && term.qty) {
      for (let i = 0; i < term.qty; i++) {
        if (term.sides === 100) {
          convertD100toD10x(theme, result).map(die => dice.push(die));
        } else {
          dice.push({
            theme,
            type: `d${term.sides}`,
            value: parseInt(result) + 1, // super hack because CoC always rolls d10-1
          });
        }
      }
    } else if (term === '+') {
      sign = 1;
    } else if (term === '-') {
      sign = -1;
    } else {
      dice.push({
        theme,
        type: 'mod',
        value: sign * parseInt(term),
      });
    }
  });
  return dice;
}

export async function convertInlineRollToDddiceRoll(equation, result) {
  const theme = await getStorage('theme');
  const dice = [];

  const parsedEquation = Parser.parse(equation);
  const roll20Roll = document.createElement('div');
  roll20Roll.innerHTML = result;

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
        if (term.sides === 100) {
          convertD100toD10x(theme, values[dieIndex++]).map(die => dice.push(die));
        } else {
          dice.push({
            theme,
            type: `d${term.sides}`,
            value: parseInt(values[dieIndex++]),
          });
        }
      }
    } else if (term === '+') {
      sign = 1;
    } else if (term === '-') {
      sign = -1;
    } else {
      dice.push({
        theme,
        type: 'mod',
        value: sign * parseInt(term),
      });
    }
  });
  return hasDice ? dice : [];
}
