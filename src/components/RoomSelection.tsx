/**
 * List Rooms
 *
 * @format
 */

import React from 'react';

import { IRoom } from 'dddice-js';
import DddiceButton from './DddiceButton';
import classNames from 'classnames';
import RoomCard from './RoomCard';

interface IRooms {
  rooms: IRoom[];
  onSelectRoom(room: string): any;
}

const RoomSelection = (props: IRooms) => {
  const { rooms, onSelectRoom } = props;
  /**
   * Render
   */
  return (
    <div className="text-white">
      <div className="flex text-xl my-auto justify-center mt-3">Recent Rooms</div>
      <div className="overflow-y-auto scroll">
        {rooms.map((room: IRoom) => (
          <RoomCard room={room} onClick={() => onSelectRoom(room.slug)} key={room.slug} />
        ))}
      </div>
      <div className="flex flex-row items-center text-gray-300">
        <div className="flex-grow border-t border-gray-700" />
        <div className="pt-0 p-1">or</div>
        <div className="flex-grow border-t border-gray-700" />
      </div>
      <label className="text-gray-300 m-2 flex flex-row justify-center">
        <div className="mr-2">Via Link</div>
        <input className="bg-gray-800 rounded text-gray-100" />
      </label>
      <div className="text-gray-300">
        Don't see your rooms?{' '}
        <DddiceButton size="small" isSecondary>
          connect your account
        </DddiceButton>
      </div>
    </div>
  );
};

export default RoomSelection;
