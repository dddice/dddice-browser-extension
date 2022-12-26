/** @format */
import { ThreeDDiceAPI } from 'dddice-js';

export async function getStorage(key: string): Promise<any> {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key]);
    });
  });
}

export async function setStorage(payload: object): Promise<any> {
  return new Promise(resolve => {
    chrome.storage.local.set(payload, () => {
      resolve(payload);
    });
  });
}

export async function migrateStorage() {
  try {
    const { apiKey, theme, room } = await chrome.storage.sync.get(['apiKey', 'theme', 'room']);
    if (apiKey) {
      await chrome.storage.local.set({ apiKey });
      await chrome.storage.sync.remove('apiKey');
    }
    if (apiKey && theme) {
      const api = new ThreeDDiceAPI(apiKey);
      const themeObject = (await api.theme.get(theme)).data;
      await chrome.storage.local.set({ theme: themeObject });
      await chrome.storage.sync.remove('theme');
    }
    if (apiKey && room) {
      const api = new ThreeDDiceAPI(apiKey);
      const roomObject = (await api.room.get(room)).data;
      await chrome.storage.local.set({ room: roomObject });
      await chrome.storage.sync.remove('room');
    }
  } catch (e) {
    return;
  }
}
