import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";

import './index.css';

import imageLogo from 'url:./assets/dddice-48x48.png'
import Loading from './assets/loading.svg'

import API, { IUser, IStorage } from './api';
import useLocalStorage from './useLocalStorage'
import Splash from './components/Splash'
import Rooms from './components/Rooms'
import Themes from './components/Themes'

const DefaultStorage: IStorage = {
  apiKey: undefined,
  room: undefined,
  theme: undefined,
}

const App = () => {
  /**
   * API
   */
  const api = useRef();

  /**
   * Local Storage
   */
  const [storage, setStorage] = useLocalStorage('dddice', DefaultStorage);

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
  const currentRoomRef = useRef(storage.room); // for instant access to rooms

  /**
   * Themes
   */
  const [themes, setThemes] = useState([])
  const currentThemeRef = useRef(storage.theme); // for instant access to themes

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

  /**
   * Fetch information from API once we have an API key
   */
  useEffect(() => {
    if (storage.apiKey) {
      api.current = new API(storage.apiKey);

      const load = async () => {
        setIsLoading(true)
        const [rooms, themes] = await Promise.all([
          api.current.room().list(),
          api.current.diceBox().list()
        ])

        setThemes(themes)
        setRooms(rooms)
        setIsLoading(false)

        chrome.runtime.onMessage.addListener(onMessage)
      }

      load()
    }
  }, [storage.apiKey])

  /**
   * Call the dddice API
   */
  const onMessage = useCallback((request, sender, senderResponse) => {
    const {type, modifier} = request

    const room = currentRoomRef.current
    const dice = [{
      type,
      theme: currentThemeRef.current,
    }]

    console.log(type, modifier, room, dice)
    api.current.roll().create(dice, room)
  }, [])

  const onKeySuccess = useCallback((apiKey: string) => {
    setStorage((storage: IStorage) => ({
      ...storage,
      apiKey,
    }))
  }, [])

  const onChangeRoom = useCallback((room: string) => {
    setStorage((storage: IStorage) => ({
      ...storage,
      room,
    }))

    currentRoomRef.current = room
  }, [])

  const onChangeTheme = useCallback((theme: string) => {
    setStorage((storage: IStorage) => ({
      ...storage,
      theme,
    }))

    currentThemeRef.current = theme
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
            {!storage.apiKey ? (
              <Splash onSuccess={onKeySuccess} />
            ) : (
              <>
                <Rooms selected={storage.room} onChange={onChangeRoom} rooms={rooms} />
                <Themes selected={storage.theme} onChange={onChangeTheme} themes={themes} />
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
