/** @format */

import { getStorage, setStorage } from './storage';

export default class StorageProvider {
  async getStorage(key: string): Promise<any> {
    return getStorage(key);
  }

  async setStorage(payload: object): Promise<any> {
    return setStorage(payload);
  }
}
