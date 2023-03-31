/** @format */

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
