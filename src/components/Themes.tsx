/**
 * List Themes
 */

import React, { useCallback, useState, useEffect } from "react";
import classNames from 'classnames'

import { ITheme } from '../api'

interface IThemes {
    onChange(theme: string): any
    onSearch(value?: string): any
    selected?: string;
    themes: ITheme[]
}

const Themes = (props: IThemes) => {
  const { onSearch, onChange, selected, themes } = props

  const [highlight, setHighlight] = useState()

  const onSelect = useCallback((id: string) => {
    onChange(id)
    onSearch()
  }, [])

  const onKeyPress = useCallback((e) => {
    const code = e.which || e.keyCode
    if (code == '38') {
      // Up
      setHighlight(i => Math.max(0, i - 1))
    } else if (code == '40') {
      // Down
      setHighlight(i => i + 1)
    } else if (code == '13') {
      const li = document.getElementById('theme-selected')
      if (li) {
        onSelect(li.dataset.theme)
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress)

    return () => {
      window.removeEventListener('keydown', onKeyPress)
    }
  }, [])

  /**
   * Render
   */
  return (
      <label className="text-gray-300 mt-2 block">
        Theme
        <input className="p-2 bg-gray-800 rounded w-full text-gray-100" key={selected} defaultValue={selected} onChange={e => onSearch(e.target.value)} />
        <ul className="mt-2">
          {themes.map((theme, i) => (
            <li
              id={highlight === i ? 'theme-selected' : undefined}
              data-theme={theme.id}
              className={classNames('first:rounded-t last:rounded-b p-2 hover:bg-neon-blue cursor-pointer text-white', highlight === i ? 'bg-neon-blue' : 'bg-gray-900')}
              onClick={() => onSelect(theme.id)}
              key={theme.id}
            >
              {theme.name}
            </li>
          ))}
        </ul>
      </label>
  );
};

export default Themes
