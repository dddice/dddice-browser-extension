/** @format */
import React, { useState } from 'react';
import classNames from 'classnames';

interface INotification {
  messages: string[];
  onRemoveMessage(): void;
}

const Notification = (props: INotification) => {
  const { messages: messages, onRemoveMessage } = props;

  return (
    <div
      className={classNames(
        'flex flex-col items-center transition transform mx-auto w-[380px] pointer-events-auto',
      )}
    >
      {messages.map((message, n) => (
        <span
          className={classNames(
            'flex rounded-lg h-full mx-auto text-[13px] text-white bg-gray-700 p-3 my-3 w-full items-start',
          )}
          key={n}
        >
          <span className="text-error pb-1 m-1 mr-2">❌</span>
          <span className="mr-auto mt-1">{message}</span>
          <button
            className="text-gray-700 ml-1 bg-gray-300 bg-opacity-50 rounded-lg p-1"
            onClick={() => {
              onRemoveMessage(n);
            }}
          >
            DISMISS
          </button>
        </span>
      ))}
    </div>
  );
};

export default Notification;
