/**
 * List Themes
 */

import React from "react";

import { ITheme } from '../api'

interface IThemes {
    themes: ITheme[]
    onChange(theme: string): any
    selected?: string;
}

const Themes = (props: IThemes) => {
    const { themes, onChange, selected } = props

  /**
   * Render
   */
  return (
      <label className="text-gray-300 mt-2 block">
        Theme
        <select className="p-2 bg-gray-800 rounded w-full text-gray-100" value={selected} onChange={e => onChange(e.target.value)}>
            <option>--- Select Theme ---</option>
            {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                    {theme.name}
                </option>
            ))}
        </select>
      </label>
  );
};

export default Themes
