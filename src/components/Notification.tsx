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
        'font-sans flex flex-col items-center mx-auto w-96 pointer-events-auto !p-2 rounded-lg box-border',
        messages.length > 0 && 'bg-gray-900 bg-opacity-60',
      )}
    >
      {messages.map((message, n) => (
        <span
          className={classNames(
            'flex rounded-lg mx-auto text-sm text-white bg-gray-700 !p-2 my-1 w-full items-start box-border',
          )}
          key={n}
        >
          <span className="text-error pb-0.5 m-0.5 mr-1 box-border">❌</span>
          <span className="mr-auto m-0.5 box-border">{message}</span>
          <button
            className="bg-transparent text-gray-300 m-0.5 py-0.5 px-1 box-border"
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
