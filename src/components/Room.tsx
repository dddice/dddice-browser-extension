/** @format */

import { useEffect } from 'react';

import { IRoom } from 'dddice-js';
import RoomCard from './RoomCard';

interface IRoomProps {
  room: IRoom;
  onSwitchRoom();
}

const Room = (props: IRoomProps) => {
  const { room, onSwitchRoom } = props;
  if (room) {
    return (
      <div className="text-white">
        <div className="flex text-xl my-auto justify-center mt-3">Room</div>
        <div className="flex-grow border-t border-gray-700" />
        <RoomCard room={room} onClick={() => onSwitchRoom()} key={room.slug} />
      </div>
    );
  }
};

export default Room;
