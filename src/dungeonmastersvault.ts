/** @format */

// @ts-ignore
import browser from 'webextension-polyfill';

import createLogger from './log';
import { getStorage } from './storage';
import { IRoll, ThreeDDiceRollEvent, ThreeDDice, ITheme, ThreeDDiceAPI } from 'dddice-js';

import imageLogo from 'url:./assets/dddice-32x32.png';

import notify from './utils/notify';

import { Notify } from 'notiflix/build/notiflix-notify-aio';

Notify.init({
  useIcon: false,
  fontSize: '16px',
  timeout: 10000,
  clickToClose: true,
});

const log = createLogger('dungeonmastersvault');
log.info('DDDICE DUNGEON MASTERS VAULT');

const FADE_TIMEOUT = 100;
let dddice: ThreeDDice;
let canvasElement: HTMLCanvasElement;
const DEFAULT_THEME = 'dddice-bees';

/**
 * Initialize listeners on all attacks
 */
async function init() {
  if (
    /^\/(pages\/dnd\/5e\/character-builder|pages\/dnd\/5e\/characters(\/.+)?)/.test(
      window.location.pathname,
    )
  ) {
    log.debug('init');
    // add canvas element to document
    const renderMode = getStorage('render mode');
    if (!document.getElementById('dddice-canvas') && renderMode) {
      initializeSDK();
    }

    const characterSheetDiceElements = document.querySelectorAll('.roll-button');

    // Add listeners to character sheet roll buttons
    characterSheetDiceElements.forEach(element => {
      // Remove tooltips since dddice will handle rolls
      if (element.nextSibling) {
        element.nextSibling.remove();
      }
      // Add listener to send roll to dddice
      element.addEventListener('pointerover', onPointerOver, true);
      element.addEventListener('pointerout', onPointerOut, true);
      element.removeEventListener('click', rollFromCharacterSheet, true);
      element.addEventListener('click', rollFromCharacterSheet, true);
    });

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
    node2.appendChild(buttonRoll);

    if (dieType === 'd20') {
      const buttonAdv = document.createElement('button');
      buttonAdv.addEventListener('pointerup', onPointerUp(overlayId, { k: 'h1' }));
      buttonAdv.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-sans font-bold';
      buttonAdv.textContent = 'adv';
      buttonAdv.dataset.text = text;
      node2.appendChild(buttonAdv);

      const buttonDis = document.createElement('button');
      buttonDis.addEventListener('pointerup', onPointerUp(overlayId, { k: 'l1' }));
      buttonDis.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 rounded-r p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-sans font-bold';
      buttonDis.textContent = 'dis';
      buttonDis.dataset.text = text;

      node2.appendChild(buttonDis);
    } else {
      const buttonCrit = document.createElement('button');
      buttonCrit.addEventListener('pointerup', onPointerUp(overlayId, {}, true));
      buttonCrit.className =
        'flex-1 h-8 flex items-center justify-center uppercase bg-gray-900 p-1 hover:bg-gray-700 transition-colors duration-80 text-gray-100 font-bold';
      buttonCrit.textContent = 'crit';
      buttonCrit.dataset.text = text;
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
    log.debug('equation', text);
    let modifier: number;
    let dieCount = Object.keys(operator).length === 0 ? 1 : 2;
    let dieType = 'd20';

    if (/\d*d\d*/.test(text)) {
      const [count, type] = text.split('d');
      /* Keep dieCount as 2 if we already determined roll has a `k` (h1|l1) operator */
      dieCount = dieCount === 2 ? dieCount : Number(count);
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

    rollCreate({ [dieType]: dieCount }, modifier, operator);
  };
}

async function rollCreate(roll: Record<string, number>, modifier: number = null, operator = {}) {
  log.debug('creating a roll', { roll, modifier, operator });
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
      await dddice.api.roll.create(dice, { operator });
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

function generateNotificationMessage(roll: IRoll) {
  const roller = roll.room.participants.find(
    participant => participant.user.uuid === roll.user.uuid,
  );

  return `${roller.username}: ${roll.equation} = ${
    typeof roll.total_value === 'object' ? '⚠' : roll.total_value
  }`;
}

function notifyRollFinished(roll: IRoll) {
  Notify.success(generateNotificationMessage(roll));
}

function notifyRollCreated(roll: IRoll) {
  Notify.info(generateNotificationMessage(roll));
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
        canvasElement.style.top = '0px';
        canvasElement.style.position = 'fixed';
        canvasElement.style.pointerEvents = 'none';
        canvasElement.style.zIndex = '100000';
        canvasElement.style.opacity = '100';
        canvasElement.style.height = '100vh';
        canvasElement.style.width = '100vw';
        document.body.appendChild(canvasElement);
        try {
          dddice = new ThreeDDice().initialize(
            canvasElement,
            apiKey,
            undefined,
            "Dungeon Master's Vault",
          );
          dddice.on(ThreeDDiceRollEvent.RollFinished, (roll: IRoll) => notifyRollFinished(roll));
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
          dddice.api = new ThreeDDiceAPI(apiKey, "Dungeon Master's Vault");
          if (room) {
            dddice.api.connect(room.slug);
          }
        } catch (e) {
          console.error(e);
          notify(`${e.response?.data?.data?.message ?? e}`);
        }
        dddice.api.listen(ThreeDDiceRollEvent.RollCreated, (roll: IRoll) =>
          setTimeout(() => notifyRollCreated(roll), 1500),
        );
      }
    } else {
      log.debug('no api key');
    }
  });
}

// clear all dice on any click, just like d&d beyond does
document.addEventListener('click', () => {
  if (dddice && !dddice?.isDiceThrowing) dddice.clear();
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

// Subscribe to any DOM mutations and re-run init. We have to
// observe the `app` div because the tables don't have IDs.
const observer = new MutationObserver(() => init());
window.addEventListener('load', () => {
  observer.observe(document.getElementById('app'), {
    attributes: true,
    childList: true,
    subtree: true,
  });
});
