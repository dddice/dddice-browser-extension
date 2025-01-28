/** @format */

import ReactDOM from 'react-dom/client';

import Notification from '../components/Notification';
import React from 'react';

let messages = [];

const onRemoveMessage = messageIndex => {
  messages = messages.filter((m, i) => i !== messageIndex);
  root.render(<Notification messages={messages} onRemoveMessage={onRemoveMessage} />);
};

const notify = message => {
  messages = [...messages, message];
  root.render(<Notification messages={messages} onRemoveMessage={onRemoveMessage} />);
};
let root;
if (window == window.top) {
  // insert notification panel
  const notificationElement = document.createElement('div');
  notificationElement.id = 'dddice-notifications';
  notificationElement.style.top = '0px';
  notificationElement.style.position = 'fixed';
  notificationElement.style.pointerEvents = 'none';
  notificationElement.style.zIndex = '100001';
  notificationElement.style.opacity = '100';
  notificationElement.style.height = '100vh';
  notificationElement.style.width = '100vw';
  notificationElement.className = 'dddice';
  notificationElement.style.boxSizing = 'border-box';

  document.body.appendChild(notificationElement);
  root = ReactDOM.createRoot(document.getElementById('dddice-notifications'));
}
export default notify;
