/** @format */
import { HealthMessage } from './schema/health_message';
import { setStorage } from './storage';
import createLogger from './log';

const log = createLogger('background');
log.info('Background initialized');

const healthMessageByCharacterId: Record<string, HealthMessage> = {};

function sendMessageToAllTabs(message) {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (tab) {
      try {
        chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        // no-op, they may not be listening
        log.error("Couldn't send message to tab", e);
      }
    });
  });
}

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.type === 'health') {
    try {
      healthMessageByCharacterId[message.characterId] = message;
      sendMessageToAllTabs(message);
    } catch (e) {
      log.error("Couldn't send message to tab", e);
    }
    sendResponse(true);
  } else if (message.type === 'healthRequest') {
    log.info('Got health request', healthMessageByCharacterId);
    for (const characterId in healthMessageByCharacterId) {
      sendMessageToAllTabs(healthMessageByCharacterId[characterId]);
    }
    sendResponse(true);
  } else if (message.type === 'enableCustomConfiguration') {
    log.info('Enabling custom configuration');
    setStorage({
      customConfiguration: {
        ...message.customConfiguration,
        lastUpdated: Date.now(),
      },
    });
    sendResponse(true);
  } else if (message.type === 'openCharacterSheet') {
    chrome.windows.getLastFocused({ populate: false }, currentWindow => {
      const top = currentWindow.top;
      const left = currentWindow.left;
      const width = currentWindow.width;
      const height = currentWindow.height;

      const newWidth = width - 500;
      chrome.windows.update(currentWindow.id, { width: newWidth });
      chrome.windows.create(
        {
          url: message.url,
          width: 500,
          height,
          top,
          left: left + newWidth,
        },
        createdWindow => {
          const detectClosedWindow = windowId => {
            if (windowId === createdWindow.id) {
              chrome.windows.get(currentWindow.id, { populate: false }, currentWindow => {
                chrome.windows.update(currentWindow.id, { width: currentWindow.width + 500 });
              });
              chrome.windows.onRemoved.removeListener(detectClosedWindow);
            }
          };
          chrome.windows.onRemoved.addListener(detectClosedWindow);
        },
      );
    });

    sendResponse(true);
  } else {
    sendResponse(false);
  }
  return true;
});
