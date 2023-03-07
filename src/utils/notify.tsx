/** @format */

import ReactDOM from 'react-dom/client';

import Notification from '../components/Notification';

let messages = [];

const onRemoveMessage = messageIndex => {
  messages = messages.filter((m, i) => i !== messageIndex);
  root.render(<Notification messages={messages} onRemoveMessage={onRemoveMessage} />);
};

const notify = message => {
  console.error(message);
  messages = [...messages, message];
  console.error(messages);
  root.render(<Notification messages={messages} onRemoveMessage={onRemoveMessage} />);
};

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
notificationElement.style.fontSize = '16px';

document.body.appendChild(notificationElement);
const root = ReactDOM.createRoot(document.getElementById('dddice-notifications'));

export default notify;
