export async function getStorage(key: string): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

export async function setStorage(payload: object): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(payload, () => {
      resolve(payload);
    });
  });
}
