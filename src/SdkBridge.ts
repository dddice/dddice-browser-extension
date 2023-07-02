/** @format */

import { ITheme } from 'dddice-js';

export default class SdkBridge {
  reloadDiceEngine() {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'reloadDiceEngine' }));
    });
  }

  queryCustomConfiguration(): void {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'queryCustomConfiguration' }));
    });
  }

  preloadTheme(theme: ITheme) {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { type: 'preloadTheme', theme }));
    });
  }

  async detectPlatform() {
    return new Promise(resolve =>
      chrome.tabs.query({ active: true, currentWindow: true }, function ([tab]) {
        if (/dndbeyond.com/.test(tab.url)) {
          resolve('D&DBeyond');
        } else if (/roll20.net/.test(tab.url)) {
          resolve('Roll20');
        } else if (/www.dungeonmastersvault.com/.test(tab.url)) {
          resolve("Dungeon Master's Vault");
        } else if (/dddice.com/.test(tab.url)) {
          resolve('dddice');
        } else if (/pathbuilder2e.com/.test(tab.url)) {
          resolve('Pathbuilder 2e');
        } else if (/tabyltop.com/.test(tab.url)) {
          resolve('Tabyltop');
        }
      }),
    );
  }
}
