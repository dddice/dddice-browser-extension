/** @format */

import createLogger from './log';
import { ThreeDDice } from 'dddice-js';
import { setStorage } from './storage';
import SdkBridge from './SdkBridge';

const log = createLogger('Tabyltop');
log.info('DDDICE Tabyltop loaded');

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'health') {
    window.postMessage(message, document.location.origin);
    sendResponse(true);
  } else if (message.type === 'queryCustomConfiguration') {
    window.postMessage(message, document.location.origin);
  } else {
    log.info(message);
    sendResponse(false);
  }
  return true;
});

window.addEventListener('message', async function (event) {
  if (event.source !== window) {
    return;
  }
  const messageData = event.data;
  if (messageData.type !== 'dddice') {
    return;
  }
  if (messageData.action === 'healthRequest') {
    chrome.runtime.sendMessage({ type: 'healthRequest' });
    return;
  }
  if (messageData.action === 'enableCustomConfiguration') {
    chrome.runtime.sendMessage({
      type: 'enableCustomConfiguration',
      customConfiguration: messageData.customConfiguration,
    });
    return;
  }
  if (messageData.action === 'openCharacterSheet') {
    chrome.runtime.sendMessage({
      type: 'openCharacterSheet',
      url: messageData.url,
    });
    return;
  }
  if (messageData.action === 'configure') {
    document.body.classList.add('dddice');

    const { apiKey, roomSlug, themeID } = messageData;
    const dddice = new ThreeDDice().initialize(null, apiKey, undefined, 'Browser Extension');
    const room = await dddice.api.room.get(roomSlug);
    const theme = await dddice.api.theme.get(themeID);

    setStorage({ apiKey });
    setStorage({ room: room.data });
    setStorage({ theme: theme.data });
    setStorage({ 'render mode': false });
    try {
      new SdkBridge().reloadDiceEngine();
    } catch (e) {
      //that's okay, the tabs weren't initialized yet
    }
  }
});
