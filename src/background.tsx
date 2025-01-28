/** @format */
import { HealthMessage } from './schema/health_message';
import { getStorage, setStorage } from './storage';
import createLogger from './log';
import SdkBridge from './SdkBridge';

const log = createLogger('background');
log.info('Background initialized');

const healthMessageByCharacterId: Record<string, HealthMessage> = {};

async function pollForCode(data): Promise<string> {
  const now = new Date().getTime();
  const expiresAt = new Date(data?.expires_at).getTime();

  while (data && expiresAt - now > 5000) {
    if (data && !data.token && data.code && data.secret) {
      try {
        const newData = (
          await (
            await fetch(`${process.env.API_URI}/api/1.0/activate/${data.code}`, {
              headers: {
                Authorization: `Secret ${data.secret}`,
              },
            })
          ).json()
        ).data;
        if (newData.token) {
          return newData.token;
        } else {
          await new Promise(r => setTimeout(r, 5000));
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

const activate = async (): Promise<{
  expires_at: string;
  code: string;
  secret: string;
}> =>
  (await (await fetch(`${process.env.API_URI}/api/1.0/activate`, { method: 'post' })).json()).data;

const pollForActivationCode = async () => {
  let data = await getStorage('activate');
  const now = new Date().getTime();
  const expiresAt = new Date(data?.expires_at).getTime();

  if (isNaN(expiresAt) || expiresAt - now < 0) {
    data = await activate();
  }
  await chrome.runtime.sendMessage({ type: 'activation_code', data });
  await setStorage({ activate: data });
  const apiKey = await pollForCode(data);
  if (apiKey) {
    new SdkBridge().reloadDiceEngine();
    await setStorage({ apiKey });
  }
};

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

function openURLInNewWindow(url: string, newWindowWidth: number = 500) {
  let originalState = 'normal';
  let currentWindowID: string | undefined;

  const updateWindowSizeAndOpenNewWindow = currentWindow => {
    const top = currentWindow.top;
    const left = currentWindow.left;
    const width = currentWindow.width;
    const height = currentWindow.height;

    const currentWindowWidth = width - newWindowWidth;
    chrome.windows.update(Number(currentWindowID), { width: currentWindowWidth });
    chrome.windows.create(
      {
        url: url,
        width: newWindowWidth,
        height,
        top,
        left: left + currentWindowWidth,
      },
      createdWindow => {
        const detectClosedWindow = windowId => {
          if (windowId === createdWindow.id) {
            chrome.windows.get(Number(currentWindowID), { populate: false }, currentWindow => {
              chrome.windows.update(
                Number(currentWindowID),
                { width: currentWindow.width + 500 },
                () => {
                  if (originalState !== 'normal') {
                    chrome.windows.update(Number(currentWindowID), { state: originalState });
                  }
                },
              );
            });
            chrome.windows.onRemoved.removeListener(detectClosedWindow);
          }
        };
        chrome.windows.onRemoved.addListener(detectClosedWindow);
      },
    );
  };

  chrome.windows.getLastFocused({ populate: false }, currentWindow => {
    currentWindowID = currentWindow.id;
    originalState = currentWindow.state;
    chrome.runtime.getPlatformInfo((platform: PlatformInfo) => {
      if (originalState === 'maximized' && platform.os === 'mac') {
        //on macos we can resize a maximized window, so we don't need to unmaximize it
        originalState = 'normal';
      }
      if (originalState !== 'normal') {
        chrome.windows.update(
          currentWindowID,
          {
            state: 'normal',
          },
          () => {
            chrome.windows.get(currentWindowID, { populate: false }, currentWindow2 => {
              updateWindowSizeAndOpenNewWindow(currentWindow2);
            });
          },
        );
      } else {
        updateWindowSizeAndOpenNewWindow(currentWindow);
      }
    });
  });
}

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.type === 'activate') {
    pollForActivationCode();
  }
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
    openURLInNewWindow(message.url, message.width ?? 500);
    sendResponse(true);
  } else {
    sendResponse(false);
  }
  return true;
});
