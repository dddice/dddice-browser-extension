/** @format */

import createLogger from './log';
import { ITheme, ThreeDDice, ThreeDDiceAPI } from 'dddice-js';
import { getStorage, setStorage } from './storage';
import SdkBridge from './SdkBridge';

const log = createLogger('dddice-config-listener');
log.info('DDDICE config listener loaded');

const loadRoomsAndThemes = async (api: ThreeDDiceAPI) => {
  const rooms = (await api.room.list()).data;
  setStorage({ rooms });

  let themes: ITheme[] = [];

  let _themes = (await api.diceBox.list()).data;

  while (_themes) {
    themes = [...themes, ..._themes];
    _themes = (await api.diceBox.next())?.data;
  }
  setStorage({ themes });
};

window.addEventListener('message', async function (event) {
  const messageData = event.data;
  if (messageData.type !== 'dddice') {
    return;
  }
  if (messageData.action === 'configure') {
    //window.postMessage({ type: 'dddice', action: 'enabled' }, document.location.origin);

    const { apiKey, roomSlug, themeID } = messageData;
    const currentApiKey = await getStorage('apiKey');
    if (apiKey || currentApiKey) {
      await setStorage({ apiKey });
      const api = new ThreeDDiceAPI(apiKey ?? currentApiKey, 'browser extension');
      if (roomSlug) {
        try {
          await api.room.join(roomSlug);
        } catch {
          // eat error, probably already in the room
        }
        const room = await api.room.get(roomSlug);
        setStorage({ room: room.data });
      } else {
        const room = await getStorage('room');
        if (room) {
          try {
            await api.room.join(room.slug);
          } catch {
            // eat error, probably already in the room
          }
        } else {
          const rooms = await getStorage('rooms');
          if (rooms) {
            setStorage({ room: rooms[0] });
          }
        }
      }
      if (themeID) {
        const theme = await api.theme.get(themeID);
        setStorage({ theme: theme.data });
      } else {
        const theme = getStorage('theme');
        if (!theme) {
          const themes = await getStorage('themes');
          if (themes) {
            setStorage({ theme: themes[0] });
          }
        }
      }
      if (apiKey !== currentApiKey) {
        loadRoomsAndThemes(api);
      }
    }

    try {
      new SdkBridge().reloadDiceEngine();
    } catch (e) {
      //that's okay, the tabs weren't initialized yet
    }
  }
});
