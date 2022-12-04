/** @format */

import { useEffect, useState } from 'react';

import { IRoom } from 'dddice-js';

import Share from '../assets/interface-essential-share-2.svg';

import RoomCard from './RoomCard';

interface IRoomProps {
  room: IRoom;
  onSwitchRoom();
}

const Room = (props: IRoomProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const { room, onSwitchRoom } = props;
  if (room) {
    return (
      <div className="text-white">
        <div className="mt-3 flex grid gap-4 grid-cols-3">
          <div></div>
          <div className="flex flex-row text-xl my-auto justify-center">Room</div>
          {isCopied ? (
            <div className="text-neon-green text-xs ml-auto my-auto"> copied to clipboard</div>
          ) : (
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${process.env.API_URI}/room/${room.slug}${
                    !room.is_public ? '?passcode=' + room.passcode : ''
                  }`,
                );
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="ml-auto"
            >
              <Share data-tip="Copy share link to clipboard" className="flex h-4 w-4" />
            </button>
          )}
        </div>
        <RoomCard room={room} onClick={() => onSwitchRoom()} key={room.slug} />
      </div>
    );
  }
};

export default Room;
