/** @format */

import './index.css';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import ReactTooltip from 'react-tooltip';

import imageLogo from 'url:./assets/dddice-48x48.png';
import Loading from './assets/loading.svg';
import LogOut from './assets/interface-essential-exit-door-log-out-1.svg';
import Help from './assets/support-help-question-question-square.svg';

import { getStorage, setStorage } from './storage';
import ApiKeyEntry from './components/ApiKeyEntry';
import RoomSelection from './components/RoomSelection';
import Themes from './components/Themes';
import { IRoom, ITheme, ThreeDDiceAPI } from 'dddice-js';
import Splash from './components/Splash';
import Room from './components/Room';

export interface IStorage {
  apiKey?: string;
  room?: string;
  theme?: string;
}

export const DefaultStorage: IStorage = {
  apiKey: undefined,
  room: undefined,
  theme: undefined,
};

const App = () => {
  /**
   * API
   */
  const api = useRef();

  /**
   * Storage Object
   */
  const [state, setState] = useState(DefaultStorage);

  /**
   * Loading
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loading
   */
  const [loadingMessage, setLoadingMessage] = useState('');

  /**
   * Connected
   */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Error
   */
  const [error, setError] = useState();

  /**
   * Current VTT
   */
  const [vtt, setVTT] = useState(undefined);

  /**
   * Rooms
   */
  const [rooms, setRooms] = useState([]);
  const currentRoom = useRef(state.room); // for instant access to rooms

  /**
   * Themes
   */
  const [themes, setThemes] = useState([]);
  const currentTheme = useRef(state.theme); // for instant access to themes

  const [isThemesLoading, setIsThemesLoading] = useState(false);

  const [isRoomsLoading, setIsRoomsLoading] = useState(false);

  /**
   * Connect to VTT
   */
  useEffect(() => {
    async function connect() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (/dndbeyond.com/.test(tab.url)) {
        setIsConnected(true);
        setVTT('D&DBeyond');
      } else if (/roll20.net/.test(tab.url)) {
        setIsConnected(true);
        setVTT('Roll20');
      }
    }

    connect();
  }, []);

  useEffect(() => {
    async function initStorage() {
      const [apiKey, room, theme, rooms, themes] = await Promise.all([
        getStorage('apiKey'),
        getStorage('room'),
        getStorage('theme'),
        getStorage('rooms'),
        getStorage('themes'),
      ]);

      currentRoom.current = room;
      currentTheme.current = theme;

      setState((storage: IStorage) => ({
        ...storage,
        apiKey,
        room,
        theme,
        rooms,
        themes,
      }));
    }

    if (isConnected) {
      initStorage();
    }
  }, [isConnected]);

  const refreshThemes = async () => {
    let themes = [];
    setIsThemesLoading(true);
    setLoadingMessage('Loading themes (1)');
    let _themes = await api.current.diceBox.list();

    const page = 2;
    while (_themes) {
      setLoadingMessage(`Loading themes (${page})`);
      themes = [...themes, ..._themes].sort((a, b) => a.name.localeCompare(b.name));
      _themes = await api.current.diceBox.next();
    }
    //setStorage({ themes });
    setThemes(themes);
    setIsThemesLoading(false);
  };

  const refreshRooms = async () => {
    setIsRoomsLoading(true);
    let rooms = (await api.current.room.list()).data;
    rooms = rooms.sort((a, b) => a.name.localeCompare(b.name));
    setStorage({ rooms });
    setRooms(rooms);
    setIsRoomsLoading(false);
  };

  useEffect(() => {
    if (state.apiKey) {
      api.current = new ThreeDDiceAPI(state.apiKey);

      const load = async () => {
        setIsLoading(true);

        try {
          setLoadingMessage('Logging in');
          await api.current.user.get();
        } catch (error) {
          setError('Problem connecting with dddice');
          return;
        }

        setLoadingMessage('Loading rooms list');

        if (state.rooms) {
          setRooms(state.rooms);
        } else {
          refreshRooms();
        }

        if (state.themes && state.themes.length > 0) {
          setThemes(state.themes);
        } else {
          await refreshThemes();
        }

        setIsLoading(false);
      };

      load();
    }
  }, [state.apiKey]);

  useEffect(() => ReactTooltip.rebuild());

  const reloadDiceEngine = async apiKey => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'reloadDiceEngine', apiKey });
    });
  };

  const onSearch = useCallback((value: string) => {
    async function search() {
      if (value) {
        const themes: ITheme[] = (await api.current.diceBox.list(value)).data;
        setThemes(themes);
      } else {
        setThemes([]);
      }
    }

    search();
  }, []);

  const onKeySuccess = useCallback((apiKey: string) => {
    setState((storage: IStorage) => ({
      ...storage,
      apiKey,
    }));
    setStorage({ apiKey });
    reloadDiceEngine();
  }, []);

  const onChangeRoom = useCallback((room: string) => {
    setState((storage: IStorage) => ({
      ...storage,
      room,
    }));
    setStorage({ room });
    reloadDiceEngine();
  }, []);

  const onChangeTheme = useCallback((theme: string) => {
    setState((storage: IStorage) => ({
      ...storage,
      theme,
    }));
    setStorage({ theme });
  }, []);

  const onSignOut = useCallback(() => {
    setState((storage: IStorage) => ({
      ...storage,
      apiKey: undefined,
    }));
    setStorage({ apiKey: undefined });
    setError(undefined);
    setIsLoading(false);
  }, []);

  /**
   * Render
   */
  return (
    <div className="px-4 pt-2 pb-4">
      {isConnected && (
        <>
          <ReactTooltip effect="solid" />
          <div className="flex flex-row items-baseline justify-center">
            <a
              className="text-gray-700 text-xs mr-auto"
              href="https://docs.dddice.com/guides/browser-extension.html"
              target="_blank"
            >
              <Help className="flex h-4 w-4 m-auto" data-tip="Help" data-place="right" />
            </a>
            <button className="text-gray-700 text-xs ml-auto" onClick={onSignOut}>
              <LogOut className="flex h-4 w-4 m-auto" data-tip="Logout" data-place="left" />
            </button>
          </div>
        </>
      )}
      <div className="flex flex-col items-center justify-center">
        <img src={imageLogo} alt="dddice" />
        <span className="text-white text-lg">dddice</span>
      </div>
      {error && (
        <div className="text-gray-700 mt-4">
          <p className="text-center text-neon-red">{error}</p>
          <p className="text-center text-gray-200 mt-1">
            <button className="text-neon-blue" onClick={onSignOut}>
              Click here
            </button>{' '}
            to sign out and try again.
          </p>
        </div>
      )}
      {isConnected && !error && (
        <>
          {isLoading ? (
            <div className="flex flex-col justify-center text-gray-700 mt-4">
              <Loading className="flex h-10 w-10 animate-spin-slow m-auto" />
              <div className="flex m-auto">{loadingMessage}</div>
            </div>
          ) : (
            <>
              {!state.apiKey ? (
                <ApiKeyEntry onSuccess={onKeySuccess} />
              ) : state.room ? (
                <>
                  <Room
                    room={rooms.find(room => room.slug === state.room)}
                    onSwitchRoom={() => {
                      onChangeRoom(undefined);
                    }}
                  />
                  <Themes
                    selected={state.theme}
                    onChange={onChangeTheme}
                    onSearch={onSearch}
                    themes={themes}
                  />
                </>
              ) : (
                <RoomSelection rooms={rooms} onSelectRoom={onChangeRoom} />
              )}
            </>
          )}
        </>
      )}
      {!isConnected && (
        <div className="flex justify-center text-gray-700 mt-4">
          <span className="text-center text-gray-300">
            Not connected. Please navigate to a supported VTT.
          </span>
        </div>
      )}
      <p className="border-t border-gray-800 mt-4 pt-4 text-gray-700 text-xs text-center">
        {isConnected && (
          <>
            <span className="text-gray-300">Connected to {vtt}</span>
            <span className="text-gray-700">{' | '}</span>
          </>
        )}
        dddice {process.env.VERSION}
      </p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('dddice'));
root.render(<App />);
