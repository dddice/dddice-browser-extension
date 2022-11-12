/** @format */

import './dndbeyond.css';
import './index.css';
import API from './api';
import createLogger from './log';
import { IDiceRoll, IRoll, IRollValue } from 'dddice-js';
import { ThreeDDiceRollEvent, ThreeDDice } from 'dddice-js';
import { getStorage } from './storage';

import { Parser } from '@dice-roller/rpg-dice-roller';

enum RollMessageType {
  not_a_roll,
  general,
  CoC,
  DnD5e,
}

require('dddice-js');

const log = createLogger('roll20 extension');

log.info('DDDICE ROLL20');

let chatHasLoaded = false;

/**
 * Initialize listeners on all attacks
 */
function init() {
  log.info('init');
  if (dddice) dddice.resize(window.innerWidth, window.innerHeight);
}

async function rollCreate(external_id: string, dice: IDiceRoll[], operator = {}) {
  const [apiKey, room] = await Promise.all([getStorage('apiKey'), getStorage('room')]);

  const api = new API(apiKey);

  await api.room().updateRolls(room, { is_cleared: true });
  return await api.roll().create({ dice, room, operator, external_id });
}

/**
 * Translate d10xs into d100s for icon purposes
 */
function translateD10xs(die) {
  return die === 'd10x' ? 'd10' : die;
}

function generateChatMessage(roll: IRoll) {
  const diceBreakdown = roll.values.reduce(
    (prev: string, current: IRollValue) =>
      prev +
      (prev !== '' && current.value_to_display[0] !== '-' ? '+' : '') +
      (current.type === 'mod'
        ? current.value_to_display
        : `<div class="diceroll ${translateD10xs(current.type)} ${
            current.is_dropped ? 'dropped' : ''
          } ">
          <div class="dicon">
            <div class="didroll">${
              typeof current.value_to_display === 'object' ? '⚠' : current.value_to_display
            }</div>
            <div class="backing"></div>
          </div>
        </div>`),
    '',
  );

  const chatMessageElement = document.createElement('div');
  chatMessageElement.className = 'message rollresult quantumRoll dddiceRoll';
  chatMessageElement.innerHTML = `
      <div class="spacer"></div>
      <div class="avatar" aria-hidden="true"><img src="https://cdn.dddice.com/images/logo-light-fs8.png" class="bg-gray-900"></div>
      <span class="tstamp" aria-hidden="true">3:54PM</span><span class="by">${
        roll.room.participants.find(participant => participant.user.uuid === roll.user.uuid)
          .username
      }</span>
      <div class="formula" style="margin-bottom: 3px;">rolling ${roll.equation}</div>
      <div class="clear"></div>
      <div class="formula formattedformula">
      <div class="dicegrouping ui-sortable" data-groupindex="1">
          ${diceBreakdown}
      </div>
      </div>
      <div class="clear"></div>
      <strong>=</strong>
      <div class="rolled ui-draggable ui-draggable-handle">${roll.total_value}</div>
    </div>`;
  return chatMessageElement;
}

function startObservingChatMessages() {
  chatObserver.observe(document.getElementById('textchat'), { childList: true, subtree: true });
}

function domElementIsInClass(node, classNames) {
  let classNameArray;
  if (classNames.split) classNameArray = classNames.split('.');
  else classNameArray = classNames;
  return classNameArray.reduce((prev, current) => prev && node.classList?.contains(current), true);
}

function convertD100toD10x(theme, value) {
  return [
    {
      theme,
      type: 'd10x',
      value: Math.ceil(value / 10 - 1),
      value_to_display: `${Math.ceil(value / 10 - 1) * 10}`,
    },
    { theme, type: 'd10', value: ((value - 1) % 10) + 1 },
  ];
}

async function convertRoll20RollToDddiceRoll(roll20Roll: Element) {
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

function convertOperators(equation: string) {
  const operator = {};
  const keep = equation.match(/k(l|h)?(\d+)?/);
  if (keep) {
    if (keep.length > 0) {
      if (keep.length == 3) {
        operator['k'] = `${keep[1]}${keep[2]}`;
      } else if (keep.length == 2) {
        operator['k'] = `${keep[1]}1`;
      } else if (keep.length == 1) {
        if (operator === 'k') {
          operator['k'] = 'h1';
        }
      }
    }
    return operator;
  }
}

function messageRollType(node: Element) {
  if (domElementIsInClass(node, 'message.rollresult')) {
    return RollMessageType.general;
  } else if (node.querySelector('.sheet-coc-roll__container')) {
    return RollMessageType.CoC;
  }
}

async function convertCoCRollToDddiceRoll(equation, result) {
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

function watchForRollToMake(mutations: MutationRecord[]) {
  let operator;
  let external_id;
  let dice;
  let equation;

  log.info('chat box updated... looking for new rolls');
  if (chatHasLoaded) {
    mutations
      .filter(record => record.addedNodes.length > 0)
      .forEach(mutation => {
        mutation.addedNodes.forEach(async (node: Element) => {
          const rollMessageType: RollMessageType = messageRollType(node);
          if (rollMessageType && !node.classList.contains('dddiceRoll')) {
            log.info('found a roll', node);
            node.classList.add('hidden');
            external_id = node.getAttribute('data-messageid');

            if (node.classList.contains('you')) {
              switch (rollMessageType) {
                case RollMessageType.general: {
                  equation = node
                    .querySelector('.formula:not(.formattedformula)')
                    .textContent.split('rolling ')[1];

                  dice = await convertRoll20RollToDddiceRoll(
                    node.querySelector('.formattedformula'),
                  );

                  break;
                }

                case RollMessageType.CoC: {
                  const rollNode = node.querySelector(
                    '.sheet-coc-roll__result > .sheet-coc-roll__roll > .inlinerollresult',
                  );
                  equation = rollNode.getAttribute('title').match(/rolling (.*?) =/i)[1];
                  const result = rollNode.textContent;

                  dice = await convertCoCRollToDddiceRoll(equation, result);
                  break;
                }
              }

              operator = convertOperators(equation);

              if (dice.length > 0) {
                log.info('the die is cast', equation);
                try {
                  const roll: IRoll = await rollCreate(external_id, dice, operator);
                  node.setAttribute('data-dddice-roll-uuid', roll.uuid);
                } catch (e) {
                  log.error(e);
                  node.classList.remove('hidden');
                }
              }
            }
          }
        });
      });
  } else {
    log.info('ignore first update as that is the load of the old chatmessages');
    chatHasLoaded = mutations.some(record => record.addedNodes.length > 0);
  }
}

function updateChat(roll) {
  const rollMessageElement = document.querySelector(`[data-messageid='${roll.external_id}']`);

  if (rollMessageElement) {
    rollMessageElement.classList.remove('hidden');
    rollMessageElement.scrollIntoView();
  } else {
    const notificationControls = document.querySelector('#textchat > div.content');

    const newChat = generateChatMessage(roll);
    notificationControls.appendChild(newChat);
    newChat.scrollIntoView();
  }
}

function initializeSDK() {
  Promise.all([getStorage('apiKey'), getStorage('room')]).then(([apiKey, room]) => {
    if (apiKey) {
      dddice = new (window as any).ThreeDDice(canvasElement, apiKey);
      dddice.addAction('roll:finished', roll => updateChat(roll));
      dddice.start();
      if (room) {
        dddice.connect(room);
      }
    }
  });
}

// add canvas element to document
const canvasElement = document.createElement('canvas');
canvasElement.id = 'dddice-canvas';
canvasElement.style.top = '0px';
canvasElement.style.position = 'fixed';
canvasElement.style.pointerEvents = 'none';
canvasElement.style.zIndex = '100000';
canvasElement.style.opacity = '100';
canvasElement.style.height = '100vh';
canvasElement.style.width = '100vw';
document.body.appendChild(canvasElement);

let dddice;
// clear all dice on any click, just like d&d beyond does
document.body.addEventListener('click', () => dddice.clear());
// init dddice object
initializeSDK();

// receive reload events from popup
// @ts-ignore
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'reloadDiceEngine':
      initializeSDK();
  }
});

window.addEventListener('load', () => init());
window.addEventListener('resize', () => init());

const chatObserver = new MutationObserver(mutations => watchForRollToMake(mutations));
startObservingChatMessages();
