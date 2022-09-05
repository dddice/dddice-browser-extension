import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";

import './index.css';

import imageLogo from 'url:./assets/dddice-48x48.png'
import Loading from './assets/loading.svg'

import API, { IStorage, DefaultStorage } from './api';
import { getStorage, setStorage } from "./storage";
import Splash from './components/Splash'
import Rooms from './components/Rooms'
import Themes from './components/Themes'

const App = () => {
  /**
   * API
   */
  const api = useRef();

  /**
   * Storage Object
   */
  const [state, setState] = useState(DefaultStorage)

  /**
   * Loading
   */
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Connected
   */
  const [isConnected, setIsConnected] = useState(false)

  /**
   * Current VTT
   */
  const [vtt, setVTT] = useState(undefined)

  /**
   * Rooms
   */
  const [rooms, setRooms] = useState([])
  const currentRoom = useRef(state.room); // for instant access to rooms

  /**
   * Themes
   */
  const [themes, setThemes] = useState([])
  const currentTheme = useRef(state.theme); // for instant access to themes

  /**
   * Connect to VTT
   */
  useEffect(() => {
    async function connect() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (/dndbeyond.com/.test(tab.url)) {
        setIsConnected(true)
        setVTT('D&DBeyond')
      }
    }

    connect()
  }, [])

  useEffect(() => {
    async function initStorage() {
      const [apiKey, room, theme] = await Promise.all([
        getStorage("apiKey"),
        getStorage("room"),
        getStorage("theme"),
      ]);

      currentRoom.current = room
      currentTheme.current = theme

      setState((storage: IStorage) => ({
        ...storage,
        apiKey,
        room,
        theme,
      }))
    }

    if (isConnected) {
      initStorage()
    }
  }, [isConnected])

  useEffect(() => {
    if (state.apiKey) {
      api.current = new API(state.apiKey);

      const load = async () => {
        setIsLoading(true)
        const [rooms, themes] = await Promise.all([
          api.current.room().list(),
          api.current.diceBox().list()
        ])

        setThemes(themes)
        setRooms(rooms)
        setIsLoading(false)
      }

      load()
    }
  }, [state.apiKey])

  const onKeySuccess = useCallback((apiKey: string) => {
    setState((storage: IStorage) => ({
      ...storage,
      apiKey,
    }))
    setStorage({ apiKey })
  }, [])

  const onChangeRoom = useCallback((room: string) => {
    setState((storage: IStorage) => ({
      ...storage,
      room,
    }))
    setStorage({ room })
  }, [])

  const onChangeTheme = useCallback((theme: string) => {
    setState((storage: IStorage) => ({
      ...storage,
      theme,
    }))
    setStorage({ theme })
  }, [])

  /**
   * Render
   */
  return (
    <div className="p-4">
        <div className="flex flex-col items-center justify-center">
            <img src={imageLogo} />
            <span className="text-white text-lg">dddice</span>
        </div>

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
                <Themes selected={state.theme} onChange={onChangeTheme} themes={themes} />
              </>
            )}
          </>
        )}

        <p className="border-t border-gray-800 mt-4 pt-4 text-gray-700 text-xs text-center">
          {isConnected ? (
            <span className="text-gray-300">Connected to {vtt}</span>
          ) : (
            <span className="text-neon-red">Not connected</span>
          )}
          {' '} | dddice v0.0.1
        </p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('dddice'))
root.render(<App />);
