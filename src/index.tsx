/** @format */

import './index.css';
import ReactDOM from 'react-dom/client';

import StorageProvider from './StorageProvider';
import SdkBridge from './SdkBridge';
import PermissionProvider from './PermissionProvider';

import DddiceSettings from './DddiceSettings';
import React from 'react';

const root = ReactDOM.createRoot(document.getElementById('dddice'));
root.render(
  <DddiceSettings
    storageProvider={new StorageProvider()}
    sdkBridge={new SdkBridge()}
    permissionProvider={new PermissionProvider()}
  />,
);
