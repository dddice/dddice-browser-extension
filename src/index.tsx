/** @format */

import './index.css';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import imageLogo from 'url:./assets/dddice-48x48.png';
import Loading from './assets/loading.svg';

import API, { IStorage, DefaultStorage } from './api';
import { getStorage, setStorage } from './storage';
import Splash from './components/Splash';
import Rooms from './components/Rooms';
import Themes from './components/Themes';

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
        setVTT('roll20');
      }
    }

    connect();
  }, []);

  useEffect(() => {
    async function initStorage() {
      const [apiKey, room, theme] = await Promise.all([
        getStorage('apiKey'),
        getStorage('room'),
        getStorage('theme'),
      ]);

      currentRoom.current = room;
      currentTheme.current = theme;

      setState((storage: IStorage) => ({
        ...storage,
        apiKey,
        room,
        theme,
      }));
    }

    if (isConnected) {
      initStorage();
    }
  }, [isConnected]);

  useEffect(() => {
    if (state.apiKey) {
      api.current = new API(state.apiKey);

      const load = async () => {
        setIsLoading(true);

        try {
          await api.current.user().get();
        } catch (error) {
          setError('Problem connecting with dddice');
          return;
        }

        let themes = [];
        let [rooms, _themes] = await Promise.all([
          api.current.room().list(),
          api.current.diceBox().list(),
        ]);
        rooms = rooms.sort((a, b) => a.name.localeCompare(b.name));
        while (_themes) {
          themes = [...themes, ..._themes].sort((a, b) => a.name.localeCompare(b.name));
          _themes = await api.current.diceBox().next();
        }

        setRooms(rooms);
        setThemes(themes);
        setIsLoading(false);
      };

      load();
    }
  }, [state.apiKey]);

  const reloadDiceEngine = async apiKey => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'reloadDiceEngine', apiKey });
    });
  };

  const onSearch = useCallback((value: string) => {
    async function search() {
      if (value) {
        const themes = await api.current.diceBox().list(value);
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
    <div className="p-4">
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
            <div className="flex justify-center text-gray-700 mt-4">
              <Loading className="h-10 w-10 animate-spin-slow" />
            </div>
          ) : (
            <>
              {!state.apiKey ? (
                <Splash onSuccess={onKeySuccess} />
              ) : (
                <>
                  <Rooms selected={state.room} onChange={onChangeRoom} rooms={rooms} />
                  <Themes
                    selected={state.theme}
                    onChange={onChangeTheme}
                    onSearch={onSearch}
                    themes={themes}
                  />
                </>
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
