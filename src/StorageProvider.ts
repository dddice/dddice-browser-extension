/** @format */

// @ts-ignore
import browser from 'webextension-polyfill';

import { getStorage, setStorage } from './storage';
import { useEffect, useState } from 'react';
import StorageChange = chrome.storage.StorageChange;
import AreaName = chrome.storage.AreaName;

export default class StorageProvider {
  async getStorage(key: string): Promise<any> {
    return getStorage(key);
  }

  async setStorage(payload: object): Promise<any> {
    return setStorage(payload);
  }

  async removeStorage(key: string): Promise<any> {
    await chrome.storage.local.remove(key);
  }
}

const useStorage = key => {
  const [value, setValue] = useState();
  useEffect(() => {
    const listener = (changes: { [p: string]: StorageChange }, areaName: AreaName) => {
      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.error(
          `Storage key "${key}" in namespace "${areaName}" changed.`,
          `Old value was "${oldValue}", new value is "${newValue}".`,
        );
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);
  return [value];
};

export { useStorage };
