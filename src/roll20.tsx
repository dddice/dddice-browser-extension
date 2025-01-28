/** @format */

import React from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore
import browser from 'webextension-polyfill';

import createLogger from './log';
import {
  convertRoll20DnD2024RollToDddiceRoll,
  convertRoll20RollToDddiceRoll,
  getThemeSlugFromStorage,
  processRoll20InlineRollText,
} from './rollConverters';
import { getStorage, setStorage } from './storage';
import {
  IDiceRoll,
  IRoll,
  IRoom,
  ITheme,
  IUser,
  Operator,
  ThreeDDice,
  ThreeDDiceAPI,
  ThreeDDiceRollEvent,
} from 'dddice-js';

import imageLogo from 'url:./assets/dddice-48x48.png';
import notify from './utils/notify';
import { AxiosError } from 'axios';
import { APIError, IApiResponse } from 'dddice-js/types';

enum RollMessageType {
  not_a_roll,
  general,
  inline,
  CoC,
  DnD5e,
  DnD2024,
}

const log = createLogger('Roll20');

log.info('DDDICE ROLL20');

let chatHasLoaded = false;

/**
 * Initialize listeners on all attacks
 */
function init() {
  log.info('init');
  if (dddice?.canvas) dddice.resize(window.innerWidth, window.innerHeight);
}

async function rollCreate(
  dice: IDiceRoll[],
  external_id: string,
  node: Element,
  operator: Operator,
) {
  const room = await getStorage('room');
  log.debug('dice.length', dice.length);
  if (dice.length > 0) {
    if (!dddice?.api) {
      notify(
        `dddice extension hasn't been set up yet. Please open the the extension pop up via the extensions menu`,
      );
      node.classList.remove('hidden');
      removeLoadingMessage();
    } else if (!room?.slug) {
      notify(
        'No dddice room has been selected. Please open the dddice extension pop up and select a room to roll in',
      );
      node.classList.remove('hidden');
      removeLoadingMessage();
    } else {
      try {
        log.debug('the die is cast');
        const roll: IRoll = (await dddice.api.roll.create(dice, { operator, external_id })).data;
        node.setAttribute('data-dddice-roll-uuid', roll.uuid);
      } catch (e) {
        console.error(e);
        notify(`${e.response?.data?.data?.message ?? e}`);
        node.classList.remove('hidden');
        removeLoadingMessage();
      }
    }
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
    chatMessageElement.className = 'dddice';
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    chatMessageElement.appendChild(spacer);
    const image = document.createElement('img');
    image.src = imageLogo;
    image.className = 'rounded-full bg-gray-700 animate-pulse h-10 mx-auto mt-4 p-2';
    chatMessageElement.appendChild(image);

    chatElement.appendChild(chatMessageElement);
    chatMessageElement.scrollIntoView(false);
  }
}

function removeLoadingMessage() {
  document.getElementById('dddice-loading-message')?.remove();
}

function generateChatMessageTemplate(roll: IRoll) {
  const characterName = roll.room.participants.find(
    participant => participant.user.uuid === roll.user.uuid,
  ).username;

  return `&{template:default} {{roller=${characterName}}}  {{${roll.label ?? 'roll'}=[[ ${
    roll.total_value
  } [${roll.equation}]]]}} {{source=dddice}}`;
}

function generateChatMessage(roll: IRoll) {
  const chatMessageElement = document.createElement('div');

  chatMessageElement.className = 'message rollresult dddiceRoll';
  const root = ReactDOM.createRoot(chatMessageElement);
  root.render(
    <div className="dddice">
      <div className="spacer" />
      <div className="avatar">
        <img src={imageLogo} className="rounded-full bg-gray-700 h-16 mx-auto p-1" />
      </div>
      <span className="tstamp" />
      <span className="by">
        {
          roll.room.participants.find(participant => participant.user.uuid === roll.user.uuid)
            .username
        }
      </span>
      <div className="formula" style={{ marginBottom: '3px' }}>
        rolling {roll.equation}
      </div>
      <div className="clear" />
      <div className="formula formattedformula">
        <div className="dicegrouping ui-sortable" data-groupindex="1">
          {roll.values.map((current, i) => (
            <>
              {i !== 0 && current.value_to_display[0] !== '-' ? '+' : ''}
              {current.type === 'mod' ? (
                current.value_to_display
              ) : (
                <div
                  key={i}
                  className={`diceroll ${translateD10xs(current.type)} ${
                    current.is_dropped ? 'dropped' : ''
                  } `}
                >
                  <div className="dicon">
                    <div className="didroll">
                      {typeof current.value_to_display === 'object'
                        ? '⚠'
                        : current.value_to_display}
                    </div>
                    <div className="backing" />
                  </div>
                </div>
              )}
            </>
          ))}
        </div>
      </div>
      <div className="clear" />
      <strong>=</strong>
      <div className="rolled ui-draggable ui-draggable-handle">{roll.total_value}</div>
    </div>,
  );
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

function messageRollType(node: Element): RollMessageType {
  if (domElementIsInClass(node, 'message.rollresult')) {
    return RollMessageType.general;
  }
  if (node.querySelector('.sheet-coc-roll__container')) {
    return RollMessageType.CoC;
  }
  if (node.querySelector('.inlinerollresult ')) {
    return RollMessageType.inline;
  }
  if (node.querySelector('.dnd-2024--roll')) {
    return RollMessageType.DnD2024;
  }
  return RollMessageType.not_a_roll;
}

function watchForRollToMake(mutations: MutationRecord[]) {
  let external_id;
  let equation;

  log.info('chat box updated... looking for new rolls');
  mutations
    .filter(record => record.addedNodes.length > 0)
    .forEach(mutation => {
      mutation.addedNodes.forEach(async (node: Element) => {
        // look for room links
        if (node.querySelector) {
          node.querySelectorAll('a').forEach(link => {
            log.info('found a link', link);
            const passcode = new URLSearchParams(link.href.split('?')[1]).get('passcode');
            const match = link.href.match(/\/room\/([a-zA-Z0-9]{7,14})/);
            if (match) {
              log.debug('link matched', match);
              link.addEventListener('click', async e => {
                e.preventDefault();
                e.stopPropagation();
                e.target.innerText = `joining room...`;
                let api;
                if (!dddice?.api) {
                  const apiKey = (await new ThreeDDiceAPI(undefined, 'Roll20').user.guest()).data;
                  api = new ThreeDDiceAPI(apiKey, 'Roll20');
                  await setStorage({ apiKey });
                } else {
                  api = dddice.api;
                }
                try {
                  await api.room.join(match[1], passcode);
                } catch (e) {
                  log.warn('maybe an error?', e);
                }
                const room: IRoom = (await api.room.get(match[1], passcode)).data;
                await setStorage({ room });
                initializeSDK();
                (e.target as HTMLElement).classList.add('text-success');
                (e.target as HTMLElement).innerText = `joined room ${room.name}`;
              });
            }
          });
        }
      });
    });

  if (chatHasLoaded) {
    const shouldClear = true;
    mutations
      .filter(record => record.addedNodes.length > 0)
      .forEach(mutation => {
        mutation.addedNodes.forEach(async (node: Element) => {
          const theme = await getThemeSlugFromStorage();
          if (node.querySelector) {
            setTimeout(() => {
              node.classList.remove('hidden');
              removeLoadingMessage();
            }, 1500);
            // look for roll messages
            const rollMessageType: RollMessageType = messageRollType(node);
            if (
              rollMessageType &&
              !node.classList.contains('dddiceRoll') &&
              !node.textContent.includes('dddice')
            ) {
              log.info('found a roll', node);
              node.classList.add('hidden');
              addLoadingMessage();
              if (shouldClear && dddice?.api) {
                const room = await getStorage('room');
                if (room) {
                  await dddice.api.room.updateRolls(room.slug, { is_cleared: true });
                }
              }
              external_id = node.getAttribute('data-messageid');

              if (node.classList.contains('you') && document.body.contains(node)) {
                switch (rollMessageType) {
                  case RollMessageType.general: {
                    const { dice, operator } = await convertRoll20RollToDddiceRoll(node, theme);
                    log.debug('roll create 5e');
                    await rollCreate(dice, external_id, node, operator);
                    break;
                  }

                  case RollMessageType.DnD2024: {
                    const { dice, operator } = await convertRoll20DnD2024RollToDddiceRoll(
                      node,
                      theme,
                    );
                    log.debug('roll create 2024');
                    await rollCreate(dice, external_id, node, operator);
                    break;
                  }

                  case RollMessageType.CoC:
                  case RollMessageType.inline: {
                    const rollNodes = node.querySelectorAll('.inlinerollresult');
                    for (const rollNode of rollNodes) {
                      const inlineRollText = rollNode.getAttribute('title');
                      const { dice, operator } = await processRoll20InlineRollText(
                        inlineRollText,
                        theme,
                      );
                      log.debug('roll create2');
                      await rollCreate(dice, external_id, node, operator);
                    }
                    break;
                  }
                }
              }
            }
          }
        });
      });
  } else {
    log.info('ignore first update as that is the load of the old chat messages');
    chatHasLoaded = mutations.some(record => record.addedNodes.length > 0);
  }
}

function updateChat(roll: IRoll) {
  removeLoadingMessage();
  const rollMessageElement = document.querySelector(`[data-messageid='${roll.external_id}']`);

  if (rollMessageElement) {
    rollMessageElement.classList.remove('hidden');
    rollMessageElement.scrollIntoView();
  } else if (roll.user.uuid === user.uuid) {
    const chat = document.getElementById('textchat-input');
    const txt = chat.getElementsByTagName('textarea')[0];
    const btn = chat.getElementsByTagName('button')[0];

    const old_text = txt.value;
    txt.value = generateChatMessageTemplate(roll);
    isSendingMessage = true; // so that the click on the button doesn't clear the die that was just rolled
    btn.click();
    isSendingMessage = false;
    txt.value = old_text;
  } else {
    const chatElement = document.querySelector('#textchat > div.content');

    const newChat = generateChatMessage(roll);
    chatElement.appendChild(newChat);
    const textChatContainer = document.getElementById('textchat');
    // hack to scroll to bottom
    setTimeout(
      () => textChatContainer.scrollTo(0, textChatContainer.scrollHeight + newChat.clientHeight),
      100,
    );
  }
}

function preloadTheme(theme: ITheme) {
  log.debug('Load theme', theme);
  dddice.loadTheme(theme, true);
  dddice.loadThemeResources(theme.id, true);
}

function initializeSDK() {
  Promise.all([
    getStorage('apiKey'),
    getStorage('room'),
    getStorage('theme'),
    getStorage('render mode'),
  ]).then(async ([apiKey, room, theme, renderMode]) => {
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
          dddice = new ThreeDDice().initialize(canvasElement, apiKey, undefined, 'Roll20');
          dddice.on(ThreeDDiceRollEvent.RollFinished, (roll: IRoll) => updateChat(roll));
          dddice.start();
          if (room) {
            dddice.connect(room.slug);
          }
        } catch (e) {
          console.error(e);
          notify(
            `${(e as AxiosError<IApiResponse<APIError, any>>).response?.data?.data?.message ?? e}`,
          );
        }
        if (theme) {
          preloadTheme(theme);
        }
      } else {
        try {
          dddice = new ThreeDDice();
          dddice.api = new ThreeDDiceAPI(apiKey, 'Roll20');
          if (room) {
            dddice.api.connect(room.slug);
          }
        } catch (e) {
          console.error(e);
          notify(
            `${(e as AxiosError<IApiResponse<APIError, any>>).response?.data?.data?.message ?? e}`,
          );
        }
        dddice.api.listen(ThreeDDiceRollEvent.RollCreated, (roll: IRoll) =>
          setTimeout(() => updateChat(roll), 1500),
        );
      }

      user = (await dddice.api.user.get()).data;
    } else {
      log.debug('no api key');
    }
  });
}

let dddice: ThreeDDice;
let user: IUser;
let isSendingMessage: boolean = false;
// clear all dice on any click, just like d&d beyond does
document.addEventListener('click', () => {
  if (dddice && !dddice?.isDiceThrowing && !isSendingMessage) dddice.clear();
});

// add canvas element to document
let canvasElement: HTMLCanvasElement;

// init dddice object
initializeSDK();

// receive reload events from popup
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

const chatObserver = new MutationObserver(mutations => watchForRollToMake(mutations));
startObservingChatMessages();
