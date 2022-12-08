/** @format */

import createLogger from './log';
import { getStorage } from './StorageProvider';
import { IRoll, ThreeDDiceRollEvent, ThreeDDice, ITheme } from 'dddice-js';

import './index.css';
import './dndbeyond.css';
import imageLogo from 'url:./assets/dddice-32x32.png';

const log = createLogger('d&db');
log.info('DDDICE D&D BEYOND');

const RETRY_TIMEOUT = 100;
const FADE_TIMEOUT = 100;
let dddice: ThreeDDice;

let customRoll: Record<string, number> = {};

const DEFAULT_THEME = 'dddice-standard';

/**
 * Initialize listeners on all attacks
 */
function init() {
  const diceMenuDiceElements = document.querySelectorAll('.dice-die-button');
  const characterSheetDiceElements = document.querySelectorAll('.integrated-dice__container');
  const rollButton = document.querySelector('.MuiButtonGroup-root > button:first-child');
  const customRollMenuButton = document.querySelector('.dice-toolbar__dropdown-die');
  if (
    characterSheetDiceElements.length === 0 ||
    diceMenuDiceElements.length === 0 ||
    !rollButton ||
    !customRollMenuButton
  )
    return setTimeout(init, RETRY_TIMEOUT); // retry if missing

  // Add listeners to character sheet roll buttons
  characterSheetDiceElements.forEach(element => {
    // Add listener to send roll to dddice
    element.addEventListener('pointerover', onPointerOver, true);
    element.addEventListener('pointerout', onPointerOut, true);
    element.removeEventListener('click', rollFromCharacterSheet, true);
    element.addEventListener('click', rollFromCharacterSheet, true);
  });

  // Add listeners to the left-hand dice menu
  diceMenuDiceElements.forEach(element => {
    element.addEventListener('click', addDieToRoll, true);
    element.addEventListener('auxclick', removeDieFromRoll, true);
  });

  // Add roll button listeners
  rollButton.addEventListener('click', executeCustomRoll, true);
  customRollMenuButton.addEventListener('click', clearCustomRoll, true);

  if (dddice) dddice.resize(window.innerWidth, window.innerHeight);
}

function clearCustomRoll() {
  customRoll = {};
}

function addDieToRoll() {
  const dieType = this.dataset.dice;
  log.info(`add ${dieType} to roll`);
  if (customRoll[dieType]) {
    customRoll[dieType]++;
  } else {
    customRoll[dieType] = 1;
  }
}

function removeDieFromRoll() {
  const dieType = this.dataset.dice;
  log.info(`remove ${this.dataset.dice} from roll`);
  if (customRoll[dieType]) {
    customRoll[dieType]--;
  }
}

function executeCustomRoll(e) {
  e.preventDefault();
  e.stopPropagation();
  log.info('executing custom roll', customRoll);
  rollCreate({ ...customRoll });
  customRoll = {};

  (document.querySelector('.dice-toolbar__dropdown-die') as HTMLElement).click();
}

function onPointerOver() {
  log.debug('onPointerOver');
  if (!this.id) {
    this.id = Date.now().toString(36);
  }

  const { top, right } = this.getBoundingClientRect();

  const overlayId = `ddd-${this.id}`;
  const overlayElement = document.getElementById(overlayId);
  if (!overlayElement) {
    const text = (this as HTMLDivElement).textContent;

    let dieType = 'd20';
    if (/\d*d\d*/.test(text)) {
      const [_, type] = text.split('d');
      dieType = `d${type.replace(/[+-].*/, '')}`;
    }

    const node = document.createElement('div');
    node.id = overlayId;
    node.className = 'fixed z-10 top-0 left-0 flex items-center justify-center text-sm rounded';
    node.style.marginTop = `${top}px`;
    node.style.marginLeft = `${right}px`;

    const img = document.createElement('img');
    img.src = imageLogo;
    img.className = 'h-auto w-auto';

    const buttonRoll = document.createElement('button');
    buttonRoll.addEventListener('pointerup', onPointerUp(overlayId));
    buttonRoll.appendChild(img);
    buttonRoll.className =
      'h-8 w-8 bg-gray-900 rounded-l flex items-center justify-center p-1 hover:bg-gray-700 transition-colors duration-80';
    buttonRoll.dataset.text = text;
    node.appendChild(buttonRoll);

    if (dieType === 'd20') {
      const buttonAdv = document.createElement('button');
      buttonAdv.addEventListener('pointerup', onPointerUp(overlayId, { k: 'h1' }));
      buttonAdv.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-bold';
      buttonAdv.textContent = 'adv';
      buttonAdv.dataset.text = text;
      node.appendChild(buttonAdv);

      const buttonDis = document.createElement('button');
      buttonDis.addEventListener('pointerup', onPointerUp(overlayId, { k: 'l1' }));
      buttonDis.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 rounded-r p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-bold';
      buttonDis.textContent = 'dis';
      buttonDis.dataset.text = text;

      node.appendChild(buttonDis);
    } else {
      const buttonCrit = document.createElement('button');
      buttonCrit.addEventListener('pointerup', onPointerUp(overlayId, {}, true));
      buttonCrit.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-bold';
      buttonCrit.textContent = 'crit';
      buttonCrit.dataset.text = text;
      node.appendChild(buttonCrit);
    }

    document.body.appendChild(node);
  } else {
    overlayElement.style.display = 'flex';
    overlayElement.style.marginTop = `${top}px`;
    overlayElement.style.marginLeft = `${right}px`;
  }
}

function onPointerOut() {
  const closeOverlay = () => {
    const overlayElement = document.getElementById(`ddd-${this.id}`);
    if (overlayElement.querySelector(':hover') === null) {
      overlayElement.style.display = 'none';
    } else {
      this.timeout = setTimeout(closeOverlay, FADE_TIMEOUT);
    }
  };
  this.timeout = setTimeout(closeOverlay, FADE_TIMEOUT);
}

function rollFromCharacterSheet(e) {
  onPointerUp().bind(this)(e);
}

/**
 * Pointer Up
 * Send roll event to dddice extension which will send to API
 */
function onPointerUp(overlayId = undefined, operator = {}, isCritical = false) {
  return function (e) {
    log.debug('onPointerUp');
    if (e.button === 2) return;

    e.preventDefault();
    e.stopPropagation();

    const text = (this as HTMLDivElement).dataset.text ?? (this as HTMLDivElement).textContent;
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
      modifier = Math.floor(Number(text) / 2) - 5;
    }

    // close the overlay
    let overlayElement;
    if (overlayId) {
      overlayElement = document.getElementById(overlayId);
    } else {
      const overlayId = `ddd-${this.id}`;
      overlayElement = document.getElementById(overlayId);
    }
    if (overlayElement) {
      overlayElement.style.display = 'none';
    }

    rollCreate({ [dieType]: dieCount }, modifier, operator);
  };
}

async function rollCreate(roll: Record<string, number>, modifier: number = null, operator = {}) {
  const [room, _theme] = await Promise.all([getStorage('room'), getStorage('theme')]);

  const theme = _theme && _theme.id != '' ? _theme.id : DEFAULT_THEME;

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

  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
  await dddice.api.roll.create(dice, { operator });
}

/**
 * Translate d10xs into d100s for icon purposes
 */
function translateD10xs(die) {
  return die === 'd10x' ? 'd100' : die;
}

function diceSizeCompare(die1, die2) {
  return translateD10xs(die1).split('d')[1] - translateD10xs(die2).split('d')[1];
}

function generateChatMessage(roll: IRoll) {
  const diceBreakdown = roll.values
    .filter(die => !die.is_dropped)
    .reduce(
      (prev, current) =>
        prev +
        (prev !== '' && current.value_to_display[0] !== '-' ? '+' : '') +
        (typeof current.value_to_display === 'object' ? '⚠' : current.value_to_display),
      '',
    );

  const largestDie = translateD10xs(
    roll.values.reduce(
      (prev, current) => (diceSizeCompare(prev, current.type) > 0 ? prev : current.type),
      'd4',
    ),
  );

  const chatMessageElement = document.createElement('div');
  chatMessageElement.id = `noty_bar_${crypto.randomUUID()}`;
  chatMessageElement.className =
    'noty_bar noty_type__alert noty_theme__valhalla noty_close_with_click animated faster bounceInUp';
  chatMessageElement.addEventListener('click', () => removeChatMessage(chatMessageElement));
  chatMessageElement.innerHTML =
    "    <div class='noty_body'>\n" +
    "      <div class='dice_result '>\n" +
    "        <div class='dice_result__info'>\n" +
    "          <div class='dice_result__info__title'>\n" +
    "            <span class='dice_result__info__rolldetail'>dddice: </span><span\n" +
    "            class='dice_result__rolltype rolltype_roll' style='color:#35cce6'>roll</span>\n" +
    '          </div>\n' +
    '\n' +
    "          <div class='dice_result__info__results'>\n" +
    '\n' +
    `            <span class='dice-icon-die dice-icon-die--${largestDie}' alt=''></span>\n` +
    '\n' +
    `            <span class='dice_result__info__breakdown' title='${diceBreakdown}'>${diceBreakdown}</span>\n` +
    '          </div>\n' +
    `          <span class='dice_result__info__dicenotation' title='${roll.equation}'>${roll.equation}</span>\n` +
    '        </div>\n' +
    "        <span class='dice_result__divider dice_result__divider--'></span>\n" +
    "        <div class='dice_result__total-container'>\n" +
    '\n' +
    `          <span class='dice_result__total-result dice_result__total-result-'>${
      typeof roll.total_value === 'object' ? '⚠' : roll.total_value
    }</span>\n` +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    "    <div class='noty_progressbar'></div>\n";
  return chatMessageElement;
}

function removeChatMessage(element: HTMLElement) {
  element.className += ' animated faster bounceOutRight';
  setTimeout(
    element => {
      stopObservingChatMessages();
      element.remove();
      const chatMessages = document.getElementsByClassName('noty_bar');
      if (chatMessages.length === 0) clearChat();
      startObservingChatMessages();
    },
    500,
    element,
  );
}

function startObservingChatMessages() {
  chatObserver.observe(document.body, { childList: true, subtree: true });
}

function stopObservingChatMessages() {
  chatObserver.disconnect();
}

function pruneChat() {
  stopObservingChatMessages();
  const chatMessages = document.getElementsByClassName('noty_bar');

  const messagesToRemove = [];
  for (let i = 0; i < chatMessages.length - 1; i++) {
    // if there are more than 3 messages remove some
    if (i < chatMessages.length - 3) {
      // need to delay the removal as removing them during iteration can change the iteration order
      messagesToRemove.push(chatMessages[i]);
    } else {
      chatMessages[i].classList.replace('noty_theme__valhalla', 'noty_theme__valhalla-min');
    }
  }
  messagesToRemove.forEach(element => removeChatMessage(element));
  startObservingChatMessages();
}

function clearChat() {
  const chatMessages = document.getElementsByClassName('noty_bar');

  const elementsToRemove = [];
  for (let i = 0; i < chatMessages.length; i++) {
    elementsToRemove.push(chatMessages[i]);
    chatMessages[i].className += ' animated faster bounceOutRight';
  }
  const controls = document.getElementsByClassName('dice_notification_controls');
  for (let i = 0; i < controls.length; i++) {
    elementsToRemove.push(controls[i]);
    controls[i].className += ' animated bounceOutRight';
  }
  setTimeout(() => {
    stopObservingChatMessages();
    elementsToRemove.forEach(element => removeChatMessage(element));
    startObservingChatMessages();
  }, 500);
}

function updateChat(roll: IRoll) {
  // add canvas element to document
  let chatDiv = document.getElementById('noty_layout__bottomRight');

  if (!chatDiv) {
    chatDiv = document.createElement('div');
    chatDiv.id = 'noty_layout__bottomRight';
    chatDiv.className = 'noty_layout uncollapse';
    document.body.appendChild(chatDiv);
  }

  if (document.getElementsByClassName('dice_notification_controls').length === 0) {
    const collapseButton = document.createElement('div');
    collapseButton.className = 'dice_notification_control dice_notification_controls__uncollapse';
    collapseButton.innerHTML = '<i></i>';
    collapseButton.addEventListener('click', () => {
      chatDiv.classList.toggle('uncollapse');
      chatDiv.classList.toggle('collapse');
    });

    const clearAllButton = document.createElement('div');
    clearAllButton.className = 'dice_notification_control dice_notification_controls__clear';
    clearAllButton.innerHTML = '<span>Clear All</span><i></i>';
    clearAllButton.addEventListener('click', () => clearChat());

    const notificationControls = document.createElement('div');
    notificationControls.className = 'dice_notification_controls';

    notificationControls.appendChild(clearAllButton);
    notificationControls.appendChild(collapseButton);
    chatDiv.appendChild(notificationControls);
  } else {
    const clearAllButton = document.getElementsByClassName('dice_notification_controls__clear')[0];
    clearAllButton.addEventListener('click', () => clearChat());
  }

  const notificationControls = chatDiv.getElementsByClassName('dice_notification_controls')[0];

  notificationControls.insertAdjacentElement('beforebegin', generateChatMessage(roll));
}

function preloadTheme(theme: ITheme) {
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
canvasElement.className = 'fixed top-0 z-50 h-screen w-screen opacity-100 pointer-events-none';
document.body.appendChild(canvasElement);

// clear all dice on any click, just like d&d beyond does
document.addEventListener('click', () => {
  if (!dddice.isDiceThrowing) dddice.clear();
});
// init dddice object
initializeSDK();

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

// subscribe to any dom mutations and re-run init. May be overkill
// to observe the body, but getting more specific hooks us into
// implementation details of D&D Beyond
const observer = new MutationObserver(() => init());
observer.observe(document.getElementById('site-main'), {
  attributes: true,
  childList: true,
  subtree: true,
});

const chatObserver = new MutationObserver(() => pruneChat());
startObservingChatMessages();
