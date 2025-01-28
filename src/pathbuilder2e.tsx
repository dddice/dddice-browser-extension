/** @format */

import ReactDOM from 'react-dom/client';
import browser from 'webextension-polyfill';

import createLogger from './log';
import { getStorage } from './storage';
import {
  IRoll,
  ThreeDDiceRollEvent,
  ThreeDDice,
  ITheme,
  ThreeDDiceAPI,
  IDiceRoll,
  parseRollEquation,
} from 'dddice-js';

import notify from './utils/notify';
import {
  convertDiceRollButtons,
  getThemeSlugFromStorage,
  pathbuilder2eToDddice,
} from './rollConverters';

const log = createLogger('pb2e');
log.info('DDDICE PATHBUILDER');

let dddice: ThreeDDice;
let canvasElement: HTMLCanvasElement;
let lastRoll: IRoll;
let postMessageAPIEnabled: boolean = false;

function buildShadowElement(renderMode: Promise<any>, elementId: string) {
  const shadowElementId = `dddice-${elementId}`;
  const element = document.getElementById(elementId);
  // hide their dice canvas result overlay. Removing causes errors in pathbuilder's code
  element.style.display = 'none';

  // add dddice-canvas-total element to document
  if (!document.getElementById(shadowElementId) && renderMode) {
    const canvasTotal = document.createElement('div');
    canvasTotal.id = shadowElementId;
    canvasTotal.classList.add('dddice');

    element.insertAdjacentElement('afterend', canvasTotal);
  }
}

/**
 * Initialize listeners on all attacks
 */
async function init() {
  if (/\/(app.html)$/.test(window.location.pathname)) {
    log.debug('init');

    if (/\/beta\//.test(window.location.pathname)) {
      postMessageAPIEnabled = true;
    }

    // remove their dice canvas
    document
      .querySelectorAll('#canvas > canvas')
      .forEach(element => element.id !== 'dddice-canvas' && element.remove());

    const renderMode = getStorage('render mode');
    buildShadowElement(renderMode, 'canvas-total');
    buildShadowElement(renderMode, 'dice-result');

    // add our own canvas element to document
    if (!document.getElementById('dddice-canvas') && renderMode) {
      initializeSDK();
    }

    const diceTrayButtons = document.querySelectorAll('#dice-buttons-0 div');
    diceTrayButtons.forEach(element => {
      element.removeEventListener('click', diceTrayRoll, true);
      element.addEventListener('click', diceTrayRoll, true);
    });

    const resetButton = document.querySelector('#dice-buttons-1 div');
    if (resetButton) {
      resetButton.removeEventListener('click', resetRoll, true);
      resetButton.addEventListener('click', resetRoll, true);
    }

    //  click on the dice backdrop closes the dice tray
    const diceBackdrop: HTMLElement = document.getElementById('dice-backdrop') as HTMLElement;
    diceBackdrop.addEventListener('click', () => closeDiceTray());

    if (!postMessageAPIEnabled) {
      const characterSheetDiceElements = document.querySelectorAll(
        '.section-skill .dice-proficiency',
      );
      const multiAttackButtons = document.querySelectorAll(
        '#dice-buttons-roll div div.grid-container:nth-child(2) div',
      );
      const damageButton = document.querySelectorAll(
        '#dice-buttons-roll div div.grid-container:nth-child(3) div:nth-child(1)',
      );
      const criticalButton = document.querySelectorAll(
        '#dice-buttons-roll div div.grid-container:nth-child(3) div:nth-child(2)',
      );

      const inlineRollButtons = document.querySelectorAll('.dice-button.named-roll');
      const profModalRollSection = document.querySelectorAll('.modal .prof-layout');

      criticalButton.forEach((element: HTMLElement) => {
        element.style.opacity = '0.5';
        //element.style.pointerEvents = 'none';
        element.style.cursor = 'not-allowed';
        element.setAttribute('title', '⚠ dddice | criticals are not yet supported');
        element.addEventListener(
          'click',
          e => {
            e.preventDefault();
            e.stopPropagation();
          },
          true,
        );
      });

      log.debug('multiAttackButtons', multiAttackButtons);

      characterSheetDiceElements.forEach(element => {
        element.removeEventListener('click', skillRoll, true);
        element.addEventListener('click', skillRoll, true);
      });

      diceTrayButtons.forEach(element => {
        element.removeEventListener('click', diceTrayRoll, true);
        element.addEventListener('click', diceTrayRoll, true);
      });

      inlineRollButtons.forEach(element => {
        element.removeEventListener('click', inlineRoll, true);
        element.addEventListener('click', inlineRoll, true);
      });

      multiAttackButtons.forEach(element => {
        element.removeEventListener('click', multiAttackRoll, true);
        element.addEventListener('click', multiAttackRoll, true);
      });

      damageButton.forEach(element => {
        element.removeEventListener('click', damageRoll, true);
        element.addEventListener('click', damageRoll, true);
      });

      profModalRollSection.forEach(element => {
        const button = element.parentElement.querySelector('.dice-button');
        const [context, equation] = element.querySelector('.prof-name').textContent.split(' ');
        button.removeEventListener('click', profModalRoll(context, equation), true);
        button.addEventListener('click', profModalRoll(context, equation), true);
      });
    }
  } else {
    log.debug('uninit');
    const currentCanvas = document.getElementById('dddice-canvas');
    if (currentCanvas) {
      currentCanvas.remove();
      dddice = undefined;
    }
  }
}

async function resetRoll(e) {
  e.preventDefault();
  e.stopPropagation();
  const room = await getStorage('room');
  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
  lastRoll = null;
  if (dddice) dddice.clear();
}

function skillRoll(e) {
  e.preventDefault();
  e.stopPropagation();

  openSkillRoll(this.parentElement.querySelector('.section-skill-name').textContent);
  onSkillRoll().bind(this)(e);
}

function profModalRoll(context, equation) {
  return async e => {
    e.preventDefault();
    e.stopPropagation();

    openSkillRoll(context);
    if (e.button === 2) return;
    const dice = await convertDiceRollButtons(equation, {}, false);
    await rollCreate(dice, {}, context);
  };
}

async function diceTrayRoll(e) {
  e.preventDefault();
  e.stopPropagation();

  onPointerUp().bind(this)(e);
}

async function inlineRoll(e) {
  e.preventDefault();
  e.stopPropagation();

  const context =
    this.parentElement.parentElement.parentElement.querySelector('.listview-title')?.textContent;
  openSkillRoll(context);
  onSpellRoll().bind(this)(e, context);
}

async function multiAttackRoll(e) {
  e.preventDefault();
  e.stopPropagation();

  const room = await getStorage('room');
  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
  onAttackRoll().bind(this)(e);
}

async function damageRoll(e) {
  e.preventDefault();
  e.stopPropagation();

  const room = await getStorage('room');
  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
  onDamageRoll().bind(this)(e);
}

/**
 * Pointer Up
 * Send roll event to dddice extension which will send to API
 */
function onDamageRoll(operator = {}, isCritical = false) {
  return async function (e) {
    if (e.button === 2) return;

    e.preventDefault();
    e.stopPropagation();

    const text = Array.from(document.getElementById('dice-summary').childNodes)
      .map(node => {
        if (node.nodeType === node.TEXT_NODE) {
          return node.textContent.trim();
        }
        return '';
      })
      .reduce((curr, prev) => `${curr}${prev}`, '');
    log.debug('equation damage roll', text);

    const { dice } = await parseRollEquation(text, await getThemeSlugFromStorage());

    log.debug('equation damage roll', dice);

    const context = document.getElementById('dice-title').textContent + ': Damage';

    await rollCreate(dice, operator, context);
  };
}

function onAttackRoll(operator = {}, isCritical = false) {
  return async function (e) {
    log.debug('onAttackRoll');
    if (e.button === 2) return;
    const dice = await convertDiceRollButtons(this, operator, isCritical);
    const context = document.getElementById('dice-title').textContent + ': To Hit';
    await rollCreate(dice, operator, context);
  };
}

function onSpellRoll(operator = {}, isCritical = false) {
  return async function (e, context) {
    log.debug('onSpellRoll');
    if (e.button === 2) return;
    const dice = await convertDiceRollButtons(this, operator, isCritical);
    await rollCreate(dice, operator, context);
  };
}

function onPointerUp(operator = {}, isCritical = false) {
  return async function (e) {
    log.debug('onPointerUp', lastRoll);
    if (e.button === 2) return;
    const dice = await convertDiceRollButtons(this, operator, isCritical);
    if (lastRoll) {
      await rollAddDice(dice);
    } else {
      await rollCreate(dice, operator);
    }
  };
}

function onSkillRoll(operator = {}, isCritical = false) {
  return async function (e) {
    log.debug('onPointerUp');
    if (e.button === 2) return;
    const dice = await convertDiceRollButtons(
      this.parentElement.querySelector('.section-skill-total'),
      operator,
      isCritical,
    );
    const context = this.parentElement.querySelector('.section-skill-name').textContent;
    await rollCreate(dice, operator, context);
  };
}

function openSkillRoll(context) {
  const diceTray: HTMLElement = document.getElementsByClassName('dice-tray')[0] as HTMLElement;
  if (diceTray.style.right !== '0px') {
    diceTray.style.right = '0px';
    const diceBackdrop: HTMLElement = document.getElementById('dice-backdrop') as HTMLElement;
    diceBackdrop.style.width = '100%';
    const diceButtonsRoll: HTMLElement = document.querySelector(
      '#dice-buttons-roll div',
    ) as HTMLElement;
    diceButtonsRoll.classList.add('hidden');
    document.getElementById('dice-title').innerText = context;
    document.getElementById('dice-summary').innerText = '';
  }
}

async function closeDiceTray() {
  const diceTray: HTMLElement = document.getElementsByClassName('dice-tray')[0] as HTMLElement;
  diceTray.style.right = '-360px';
  const diceBackdrop: HTMLElement = document.getElementById('dice-backdrop') as HTMLElement;
  diceBackdrop.style.width = '0%';
  const room = await getStorage('room');
  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
  if (dddice) dddice.clear();
}

async function callDecorator(room, call) {
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
      call();
    } catch (e) {
      console.error(e);
      notify(`${e.response?.data?.data?.message ?? e}`);
    }
  }
}

async function rollCreate(
  roll: IDiceRoll[],
  operator = {},
  label = undefined,
  external_id = undefined,
) {
  const room = await getStorage('room');
  lastRoll = null;
  log.debug('creating a roll', { roll, operator });

  await callDecorator(
    room,
    async () =>
      (lastRoll = (
        await dddice.api.roll.create(roll, {
          operator,
          label,
          external_id,
        })
      ).data),
  );
}

async function rollAddDice(roll: IDiceRoll[], operator = null) {
  const room = await getStorage('room');
  log.debug('updating a roll', { roll, operator, lastRoll });

  await callDecorator(
    room,
    async () =>
      (lastRoll = (
        await dddice.api.roll.update(lastRoll.uuid, {
          dice: roll,
          room: room.slug,
        })
      ).data),
  );
}

function generateOrUpdateChatMessage(roll: IRoll) {
  const diceBreakdown = roll.values
    .filter(die => !die.is_dropped)
    .reduce(
      (prev, current) =>
        prev +
        (prev !== '' && current.value_to_display[0] !== '-' ? '+' : '') +
        (typeof current.value_to_display === 'object' ? '⚠' : current.value_to_display),
      '',
    );
  const roller = roll.room.participants.find(
    participant => participant.user.uuid === roll.user.uuid,
  );

  let chatMessageElement = document.getElementById(`dddice-${roll.uuid}`);
  if (!chatMessageElement) {
    chatMessageElement = document.createElement('div');
    chatMessageElement.appendChild(document.createTextNode(new Date().toLocaleTimeString()));
    chatMessageElement.className = 'dice-history-item dddice';
    chatMessageElement.id = `dddice-${roll.uuid}`;
    const notificationControls = document.getElementById('dice-history');

    notificationControls.insertAdjacentElement('afterbegin', chatMessageElement);
  }
  // TODO: refactor this, its not good react but it *works*
  const root = ReactDOM.createRoot(chatMessageElement);
  root.render(
    <>
      {new Date().toLocaleTimeString()}{' '}
      <span style={{ color: roller.color }}>{roller.username}</span> &mdash;{' '}
      {roll.label ? `${roll.label}` : roll.equation}: {roll.total_value}
      <br />
      <span className="superscript-damage">
        {roll.equation}: {diceBreakdown}
      </span>
    </>,
  );

  return chatMessageElement;
}

function updateChat(roll: IRoll) {
  generateOrUpdateChatMessage(roll);

  const result = document.getElementById('dddice-dice-result');
  result.innerText = `TOTAL: ${roll.total_value}`;
  const canvasTotal = document.getElementById('dddice-canvas-total');
  canvasTotal.classList.add('dddice');
  canvasTotal.innerText = `${roll.total_value}`;
  canvasTotal.classList.add('fade');
  setTimeout(() => canvasTotal.classList.remove('fade'), 2500);
}

function preloadTheme(theme: ITheme) {
  dddice.loadTheme(theme, true);
  dddice.loadThemeResources(theme.id, true);
}

function initializeSDK() {
  Promise.all([
    getStorage('apiKey'),
    getStorage('room'),
    getStorage('theme'),
    getStorage('render mode'),
  ]).then(([apiKey, room, theme, renderMode]) => {
    if (apiKey && room && theme) {
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
        canvasElement.style.height = '340px';
        canvasElement.style.width = '340px';
        canvasElement.className =
          'bg-gradient-radial transition-colors duration-200 bg-center bg-cover bg-no-repeat bg-gray-700 from-gray-700 to-gray-900';
        const canvasContainer = document.getElementById('canvas');
        canvasContainer.className = 'dddice';

        document.getElementById('canvas').appendChild(canvasElement);
        try {
          dddice = new ThreeDDice().initialize(
            canvasElement,
            apiKey,
            { autoClear: null, dice: { size: 1.3 } },
            'Pathbuilder 2e',
          );
          dddice.on(ThreeDDiceRollEvent.RollCreated, (roll: IRoll) => {
            openSkillRoll(roll.label ?? '');
          });
          dddice.on(ThreeDDiceRollEvent.RollFinished, (roll: IRoll) => {
            updateChat(roll);
          });
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
          dddice.api = new ThreeDDiceAPI(apiKey, 'Pathbuilder 2e');
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

if (document.getElementById('main-container')) {
  // subscribe to any dom mutations and re-run init. May be overkill
  // to observe the body, but getting more specific hooks us into
  // implementation details of Pathbuilder 2e
  const mainObserver = new MutationObserver(() => init());
  mainObserver.observe(document.getElementById('main-container'), {
    attributes: true,
    childList: true,
    subtree: true,
  });
}
const modalObserver = new MutationObserver(() => {
  if (document.getElementById('root')) {
    init();
  }
});

modalObserver.observe(document.body, {
  attributes: false,
  childList: true,
  subtree: true,
});

window.addEventListener('message', async event => {
  log.debug('postMessage', event);
  log.debug('postMessage: roll object', event?.data?.rollDiceDump);
  if (event?.data?.rollDiceDump && event?.data?.status === 'pending') {
    const context =
      {
        weaponDamage: ': Damage',
        weaponAttack: ': To Hit',
        weaponDamageCritical: ': Critical',
      }[event.data.type] ?? '';
    const room = await getStorage('room');
    await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
    const { dice, operators } = await pathbuilder2eToDddice(event.data);
    await rollCreate(dice, operators, `${event.data.title}${context}`);
  }
});
