/** @format */

import createLogger from './log';
import { convertInlineRollToDddiceRoll, convertRoll20RollToDddiceRoll } from './rollConverters';
import { getStorage } from './storage';
import { IDiceRoll, IRoll, IRollValue, ITheme, ThreeDDice, ThreeDDiceRollEvent } from 'dddice-js';

import imageLogo from 'url:./assets/dddice-48x48.png';
import './dndbeyond.css';
import './index.css';

enum RollMessageType {
  not_a_roll,
  general,
  inline,
  CoC,
  DnD5e,
}

const log = createLogger('roll20');

log.info('DDDICE ROLL20');

let chatHasLoaded = false;

/**
 * Initialize listeners on all attacks
 */
function init() {
  log.info('init');
  if (dddice) dddice.resize(window.innerWidth, window.innerHeight);
}

async function pickUpRolls() {
  const [room] = await Promise.all([getStorage('apiKey'), getStorage('room')]);
  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
}

async function rollCreate(dice: IDiceRoll[], external_id: string, node: Element, equation: string) {
  const operator = convertOperators(equation);

  if (dice.length > 0) {
    log.info('the die is cast', equation);
    try {
      const roll: IRoll = (await dddice.api.roll.create(dice, { operator, external_id })).data;
      node.setAttribute('data-dddice-roll-uuid', roll.uuid);
    } catch (e) {
      log.error(e);
      node.classList.remove('hidden');
    }
  } else {
    node.classList.remove('hidden');
  }
}

/**
 * Translate d10xs into d100s for icon purposes
 */
function translateD10xs(die) {
  return die === 'd10x' ? 'd10' : die;
}

function addLoadingMessage() {
  if (!document.getElementById('dddice-loading-message')) {
    const chatElement = document.querySelector('#textchat > div.content');

    const chatMessageElement = document.createElement('div');
    chatMessageElement.id = 'dddice-loading-message';
    chatMessageElement.innerHTML = `
        <div class='spacer'></div>
        <img src="${imageLogo}" class="rounded-full bg-gray-700 animate-pulse h-10 mx-auto mt-4 p-2">
`;

    chatElement.appendChild(chatMessageElement);
    chatMessageElement.scrollIntoView();
  }
}

function removeLoadingMessage() {
  document.getElementById('dddice-loading-message')?.remove();
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
      <div class="avatar">
        <img src="${imageLogo}" class="rounded-full bg-gray-700 h-8 mx-auto p-2">
      </div>
      <span class="tstamp"></span><span class="by">${
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
  } else if (node.querySelector('.inlinerollresult ')) {
    return RollMessageType.inline;
  }
}

function watchForRollToMake(mutations: MutationRecord[]) {
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
            await pickUpRolls();
            addLoadingMessage();
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
                  await rollCreate(dice, external_id, node, equation);
                  break;
                }

                case RollMessageType.CoC:
                case RollMessageType.inline: {
                  const rollNodes = node.querySelectorAll('.inlinerollresult');
                  for (const rollNode of rollNodes) {
                    let _;
                    let result;
                    [_, equation, result] = rollNode
                      .getAttribute('title')
                      .replace(/\[.*?]/g, '')
                      .match(/rolling ([%*+\-/^.0-9dkh]*).* = (.*)/i) ?? [null, null, null];

                    if (equation && result) {
                      dice = await convertInlineRollToDddiceRoll(equation, result);
                      await rollCreate(dice, external_id, node, equation);
                    }
                  }
                  break;
                }
              }
            } else {
              // set a timer and unhide the message after a bit,
              // as a kludge for players not using the plugin
              setTimeout(() => {
                node.classList.remove('hidden');
                removeLoadingMessage();
              }, 3000);
            }
          }
        });
      });
  } else {
    log.info('ignore first update as that is the load of the old chatmessages');
    chatHasLoaded = mutations.some(record => record.addedNodes.length > 0);
  }
}

function updateChat(roll: IRoll) {
  removeLoadingMessage();
  const rollMessageElement = document.querySelector(`[data-messageid='${roll.external_id}']`);

  if (rollMessageElement) {
    rollMessageElement.classList.remove('hidden');
    rollMessageElement.scrollIntoView();
  } else {
    const chatElement = document.querySelector('#textchat > div.content');

    const newChat = generateChatMessage(roll);
    chatElement.appendChild(newChat);
    newChat.scrollIntoView();
  }
}

function preloadTheme(theme: ITheme) {
  log.debug('Load theme', theme);
  dddice.loadTheme(theme, true);
  dddice.loadThemeResources(theme.id, true);
}

function initializeSDK() {
  Promise.all([getStorage('apiKey'), getStorage('room'), getStorage('theme')]).then(
    ([apiKey, room, theme]) => {
      if (apiKey) {
        dddice = new ThreeDDice(canvasElement, apiKey);
        dddice.on(ThreeDDiceRollEvent.RollFinished, (roll: IRoll) => updateChat(roll));
        dddice.start();
        if (room) {
          dddice.connect(room.slug);
        }
        if (theme) {
          preloadTheme(theme);
        }
      }
    },
  );
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

let dddice: ThreeDDice;
// clear all dice on any click, just like d&d beyond does
document.addEventListener('click', () => {
  if (!dddice.isDiceThrowing) dddice.clear();
});
// init dddice object
initializeSDK();

// receive reload events from popup
// @ts-ignore
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'reloadDiceEngine':
      initializeSDK();
    case 'preloadTheme':
      preloadTheme(message.theme);
  }
});

window.addEventListener('load', () => init());
window.addEventListener('resize', () => init());

const chatObserver = new MutationObserver(mutations => watchForRollToMake(mutations));
startObservingChatMessages();
