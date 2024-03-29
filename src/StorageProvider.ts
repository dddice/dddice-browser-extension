/** @format */

import browser from 'webextension-polyfill';

import { getStorage, setStorage } from './storage';

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
