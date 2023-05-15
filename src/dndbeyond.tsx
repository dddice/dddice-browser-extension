/** @format */

import React from 'react';
import ReactDOM from 'react-dom/client';
import browser from 'webextension-polyfill';

import createLogger from './log';
import { getStorage, setStorage } from './storage';
import { IRoll, ThreeDDiceRollEvent, ThreeDDice, ITheme, ThreeDDiceAPI, IUser } from 'dddice-js';

import imageLogo from 'url:./assets/dddice-32x32.png';

import notify from './utils/notify';

const log = createLogger('d&db');
log.info('DDDICE D&D BEYOND');

const RETRY_TIMEOUT = 100;
const FADE_TIMEOUT = 100;
let dddice: ThreeDDice;
let canvasElement: HTMLCanvasElement;
let customRoll: Record<string, number> = {};
const DEFAULT_THEME = 'dddice-standard';
let characterId;
let user: IUser;

/**
 * Initialize listeners on all attacks
 */
async function init() {
  if (
    /^\/(characters\/.+|my-encounters|encounter-builder|combat-tracker\/.+|encounters\/.+)/.test(
      window.location.pathname,
    )
  ) {
    log.debug('init');
    const characterIdMatch = window.location.pathname.match(/characters\/(.+)/);
    if (characterIdMatch.length > 0) {
      characterId = characterIdMatch[1];
    } else {
      characterId = null;
    }

    // add canvas element to document
    const renderMode = getStorage('render mode');
    if (!document.getElementById('dddice-canvas') && renderMode) {
      await initializeSDK();
    }

    const room = await getStorage('room');
    if (!user) {
      user = (await dddice.api.user.get()).data;
    }
    const characterName = document.querySelector(
      '.ddbc-character-tidbits__heading h1',
    )?.textContent;

    const userParticipant = room.participants.find(
      ({ user: { uuid: participantUuid } }) => participantUuid === user.uuid,
    );

    if (characterName && userParticipant.username != characterName) {
      userParticipant.username = characterName;
      setStorage({ room });
      await dddice.api.room.updateParticipant(room.slug, userParticipant.id, {
        username: characterName,
      });
    }

    const diceMenuDiceElements = document.querySelectorAll('.dice-die-button');
    const characterSheetDiceElements = document.querySelectorAll('.integrated-dice__container');
    const rollButton = document.querySelector('.MuiButtonGroup-root > button:first-child');
    const customRollMenuButton = document.querySelector('.dice-toolbar__dropdown-die');
    const isCharacterSheet = document.querySelector('.character-app');
    if (
      (characterSheetDiceElements.length === 0 && isCharacterSheet) ||
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
    log.debug('dice buttons', diceMenuDiceElements);
    diceMenuDiceElements.forEach(element => {
      log.debug('button?');
      element.addEventListener('click', addDieToRoll, true);
      element.addEventListener('auxclick', removeDieFromRoll, true);
    });

    // Add roll button listeners
    rollButton.addEventListener('click', executeCustomRoll, true);
    customRollMenuButton.addEventListener('click', clearCustomRoll, true);

    if (dddice?.canvas) dddice.resize(window.innerWidth, window.innerHeight);
  } else {
    log.debug('uninit');
    const currentCanvas = document.getElementById('dddice-canvas');
    if (currentCanvas) {
      currentCanvas.remove();
      dddice = undefined;
    }
  }
}

function clearCustomRoll() {
  customRoll = {};
}

function addDieToRoll() {
  log.debug('add die to roll');
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

function traverseToParentWithClass(me: HTMLElement, classNames: string[], maxLevels = 5) {
  let curr = me.parentElement;
  let level = 0;
  while (level < maxLevels) {
    if (classNames.every(className => curr.classList.contains(className))) {
      return curr;
    }
    curr = curr.parentElement;
    level = level + 1;
  }
}

function getRollContext(div: HTMLDivElement) {
  const grandparent = div.parentElement.parentElement;
  // skills
  const skillName = grandparent.querySelector('.ct-skills__col--skill')?.textContent;
  // ability rolls
  const abilityName = grandparent.querySelector(
    '.ddbc-ability-summary__heading .ddbc-ability-summary__abbr',
  )?.textContent;

  // saves
  const saveName = grandparent.querySelector(
    '.ddbc-saving-throws-summary__ability-name',
  )?.textContent;

  // initiative
  const initiative = grandparent.classList.contains('ct-combat-mobile__extra--initiative')
    ? 'Initiative'
    : div.parentElement.querySelector('h2')?.textContent;

  // spells ct-spells-spell
  const spellAttack = traverseToParentWithClass(div, [
    'ct-spells-spell__attacking',
  ])?.parentElement.querySelector('.ct-spells-spell__name .ct-spells-spell__label')?.textContent;

  const spellDamage = traverseToParentWithClass(div, [
    'ct-spells-spell__damage',
  ])?.parentElement.querySelector('.ct-spells-spell__name .ct-spells-spell__label')?.textContent;

  const isSpellHeal = grandparent.querySelector('.ddbc-spell-damage-effect__healing')?.textContent;

  // action_attack
  const actionAttack = traverseToParentWithClass(div, [
    'ddbc-combat-attack__action',
  ])?.parentElement.querySelector(
    '.ddbc-combat-attack__name .ddbc-combat-attack__label',
  )?.textContent;
  // action_damage
  const actionDamage = traverseToParentWithClass(div, [
    'ddbc-combat-attack__damage',
  ])?.parentElement.querySelector(
    '.ddbc-combat-attack__name .ddbc-combat-attack__label',
  )?.textContent;
  // actions

  let context = undefined;
  if (skillName || abilityName) {
    context = (skillName ?? abilityName) + ': Check';
  } else if (saveName) {
    context = saveName + ': Save';
  } else if (actionAttack || spellAttack) {
    context = (actionAttack ?? spellAttack) + ': To Hit';
  } else if (actionDamage || spellDamage) {
    context = (actionDamage ?? spellDamage) + (isSpellHeal ? ': Heal' : ': Damage');
  } else if (initiative) {
    context = initiative + ': Roll';
  }

  return context;
}

function onPointerOver() {
  log.debug('onPointerOver');
  if (!this.id) {
    this.id = Date.now().toString(36);
  }

  const { top, right } = this.getBoundingClientRect();

  const context = getRollContext(this);

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
    node.className = 'dddice';
    node.style.position = 'fixed';
    node.style.top = `0px`;
    node.style.left = `0px`;
    node.style.marginTop = `${top}px`;
    node.style.marginLeft = `${right}px`;
    node.style.zIndex = '10';

    const node2 = document.createElement('div');
    node2.className = 'flex items-center justify-center text-sm rounded';

    node.appendChild(node2);

    const img = document.createElement('img');
    img.src = imageLogo;
    img.className = 'h-auto w-auto';

    const buttonRoll = document.createElement('button');
    buttonRoll.addEventListener('pointerup', onPointerUp(overlayId));
    buttonRoll.appendChild(img);
    buttonRoll.className =
      'h-8 w-8 bg-gray-900 rounded-l flex items-center justify-center p-1 hover:bg-gray-700 transition-colors duration-80';
    buttonRoll.dataset.text = text;
    buttonRoll.dataset.context = context;
    node2.appendChild(buttonRoll);

    if (dieType === 'd20') {
      const buttonAdv = document.createElement('button');
      buttonAdv.addEventListener('pointerup', onPointerUp(overlayId, { k: 'h1' }));
      buttonAdv.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-sans font-bold';
      buttonAdv.textContent = 'adv';
      buttonAdv.dataset.text = text;
      buttonAdv.dataset.context = context;
      node2.appendChild(buttonAdv);

      const buttonDis = document.createElement('button');
      buttonDis.addEventListener('pointerup', onPointerUp(overlayId, { k: 'l1' }));
      buttonDis.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 rounded-r p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-sans font-bold';
      buttonDis.textContent = 'dis';
      buttonDis.dataset.text = text;
      buttonDis.dataset.context = context;

      node2.appendChild(buttonDis);
    } else {
      const buttonCrit = document.createElement('button');
      buttonCrit.addEventListener('pointerup', onPointerUp(overlayId, {}, true));
      buttonCrit.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 rounded-r p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-sans font-bold';
      buttonCrit.textContent = 'crit';
      buttonCrit.dataset.text = text;
      buttonCrit.dataset.context = context;
      node2.appendChild(buttonCrit);
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

    const text = (
      (this as HTMLDivElement).dataset.text ?? (this as HTMLDivElement).textContent
    ).replace(/[() ]/g, '');
    const rollContext = (this as HTMLDivElement).dataset.context ?? getRollContext(this);
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

    rollCreate({ [dieType]: dieCount }, modifier, operator, rollContext);
  };
}

async function rollCreate(
  roll: Record<string, number>,
  modifier: number = undefined,
  operator = {},
  label: string = undefined,
) {
  log.debug('creating a roll', { roll, modifier, operator, label });
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

  if (!dddice?.api) {
    notify(
      `dddice extension hasn't been set up yet. Please open the the extension pop up via the extensions menu`,
    );
  } else if (!room?.slug) {
    notify(
      'No dddice room has been selected. Please open the dddice extension pop up and select a room to roll in',
    );
  } else {
    try {
      await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
      await dddice.api.roll.create(dice, {
        operator,
        label,
        external_id: `dndbCharacterId:${characterId}`,
      });
    } catch (e) {
      console.error(e);
      notify(`${e.response?.data?.data?.message ?? e}`);
    }
  }
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

  const roller = roll.room.participants.find(
    participant => participant.user.uuid === roll.user.uuid,
  );

  const chatMessageElement = document.createElement('div');
  chatMessageElement.id = `noty_bar_${crypto.randomUUID()}`;
  chatMessageElement.className =
    'noty_bar noty_type__alert noty_theme__valhalla noty_close_with_click animated faster bounceInUp';
  chatMessageElement.addEventListener('click', () => removeChatMessage(chatMessageElement));

  let rollLabel: string;
  let rollType: string;
  const r = roll.label && roll.label.split(': ');
  if (r && r.length >= 2) {
    [rollLabel, rollType] = r;
  }

  const root = ReactDOM.createRoot(chatMessageElement);
  root.render(
    <>
      <div className="noty_body">
        <div className="dice_result ">
          <div className="dice_result__info">
            <div className="dice_result__info__title">
              <span className="dice_result__info__rolldetail">
                {rollLabel ?? roll.label ?? 'dddice'}:{' '}
              </span>
              <span
                className={`dice_result__rolltype rolltype_${
                  rollType?.toLowerCase().replace(' ', '') ?? 'roll'
                }`}
              >
                {rollType ?? 'custom'}
              </span>{' '}
            </div>
            <div
              className="dice_result__info__title"
              style={{ fontSize: 'smaller', paddingRight: '8px' }}
            >
              {roller.username}
            </div>
            <div className="dice_result__info__results">
              <span className={`dice-icon-die dice-icon-die--${largestDie}`} alt="" />
              <span className="dice_result__info__breakdown" title={diceBreakdown}>
                {diceBreakdown}
              </span>
            </div>
            <span className="dice_result__info__dicenotation" title="${roll.equation}">
              {roll.equation}
            </span>
          </div>
          <span className="dice_result__divider dice_result__divider--" />
          <div className="dice_result__total-container">
            <span className="dice_result__total-result dice_result__total-result-">
              {typeof roll.total_value === 'object' ? '⚠' : roll.total_value}
            </span>
          </div>
        </div>
      </div>
      <div className="noty_progressbar" />
    </>,
  );
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
    collapseButton.appendChild(document.createElement('i'));
    collapseButton.addEventListener('click', () => {
      chatDiv.classList.toggle('uncollapse');
      chatDiv.classList.toggle('collapse');
    });

    const clearAllButton = document.createElement('div');
    clearAllButton.className = 'dice_notification_control dice_notification_controls__clear';
    const clearAllText = document.createElement('span');
    clearAllText.innerText = 'Clear All';
    clearAllButton.appendChild(clearAllText);
    clearAllButton.appendChild(document.createElement('i'));
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

async function initializeSDK() {
  return Promise.all([
    getStorage('apiKey'),
    getStorage('room'),
    getStorage('theme'),
    getStorage('render mode'),
  ]).then(async ([apiKey, room, theme, renderMode]) => {
    if (apiKey) {
      log.debug('initializeSDK', renderMode);
      if (dddice) {
        // clear the board
        if (canvasElement) canvasElement.remove();
        // disconnect from echo
        if (dddice.api?.connection) dddice.api.connection.disconnect();
        // stop the animation loop
        dddice.stop();
      }
      if (renderMode === undefined || renderMode) {
        canvasElement = document.createElement('canvas');
        canvasElement.id = 'dddice-canvas';
        canvasElement.style.top = '0px';
        canvasElement.style.position = 'fixed';
        canvasElement.style.pointerEvents = 'none';
        canvasElement.style.zIndex = '100000';
        canvasElement.style.opacity = '100';
        canvasElement.style.height = '100vh';
        canvasElement.style.width = '100vw';
        document.body.appendChild(canvasElement);
        try {
          dddice = new ThreeDDice().initialize(canvasElement, apiKey, undefined, 'D&D Beyond');
          dddice.on(ThreeDDiceRollEvent.RollFinished, (roll: IRoll) => updateChat(roll));
          dddice.start();
          if (room) {
            dddice.connect(room.slug);
          }
        } catch (e) {
          console.error(e);
          notify(`${e.response?.data?.data?.message ?? e}`);
        }
        if (theme) {
          preloadTheme(theme);
        }
      } else {
        try {
          dddice = new ThreeDDice();
          dddice.api = new ThreeDDiceAPI(apiKey, 'D&D Beyond');
          if (room) {
            dddice.api.connect(room.slug);
          }
        } catch (e) {
          console.error(e);
          notify(`${e.response?.data?.data?.message ?? e}`);
        }
        dddice.api.listen(ThreeDDiceRollEvent.RollCreated, (roll: IRoll) =>
          setTimeout(() => updateChat(roll), 1500),
        );
      }
    } else {
      log.debug('no api key');
    }
  });
}

// clear all dice on any click, just like d&d beyond does
document.addEventListener('click', () => {
  if (dddice && !dddice.isDiceThrowing) dddice.clear();
});

// @ts-ignore
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'reloadDiceEngine':
      initializeSDK();
      break;
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
