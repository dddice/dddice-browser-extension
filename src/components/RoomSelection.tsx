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

  onSelectRoom(room: string): void;

  onJoinRoom(room: string): void;

  onError(message: string): void;

  onConnectAccount(): void;

  onCreateRoom(): void;
}

const RoomSelection = (props: IRooms) => {
  const { rooms, onSelectRoom, onJoinRoom, onError, onConnectAccount, onCreateRoom } = props;

  const onChangeLink = event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const link = formData.get('link') as string;
    const match = link.match(/\/room\/([a-zA-Z0-9]{7,14})/);
    if (match) {
      onJoinRoom(match[1]);
    } else {
      onError('Invalid room link.');
    }
  };

  /**
   * Render
   */
  return (
    <div className="text-white flex flex-col">
      {rooms?.length > 0 ? (
        <>
          <div className="flex text-xl my-auto justify-center mt-3">Join A Room</div>
          <div className="overflow-y-auto scroll">
            {rooms.map((room: IRoom) => (
              <RoomCard room={room} onClick={() => onSelectRoom(room.slug)} key={room.slug} />
            ))}
          </div>
        </>
      ) : (
        <DddiceButton onClick={onCreateRoom}>Create A Room</DddiceButton>
      )}
      <div className="flex flex-row items-center text-gray-300">
        <div className="flex-grow border-t border-gray-700" />
        <div className="pt-0 p-1">or</div>
        <div className="flex-grow border-t border-gray-700" />
      </div>
      <form onSubmit={onChangeLink}>
        <label className="text-gray-300 m-2 flex flex-row justify-center">
          <div className="mr-2">Join Via Link</div>
          <input name="link" className="bg-gray-800 rounded text-gray-100" />
        </label>
      </form>
      <div className="text-gray-300">
        Don't see your rooms?{' '}
        <DddiceButton size="small" onClick={onConnectAccount} isSecondary>
          connect your account
        </DddiceButton>
      </div>
    </div>
  );
};

export default RoomSelection;
