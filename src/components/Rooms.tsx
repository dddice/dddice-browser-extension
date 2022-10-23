/**
 * List Rooms
 *
 * @format
 */

import React from 'react';

import { IRoom } from '../api';

interface IRooms {
  rooms: IRoom[];
  onChange(room: string): any;
  selected?: string;
}

const Rooms = (props: IRooms) => {
  const { rooms, onChange, selected } = props;
  /**
   * Render
   */
  return (
    <label className="text-gray-300 mt-2 block">
      Room
      <select
        className="p-2 bg-gray-800 rounded w-full text-gray-100"
        value={selected}
        onChange={e => onChange(e.target.value)}
      >
        <option>--- Select Room ---</option>
        {rooms.map(room => (
          <option key={room.slug} value={room.slug}>
            {room.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default Rooms;
