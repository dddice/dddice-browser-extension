/** @format */
import ReactDOM from 'react-dom';

import StorageProvider from './StorageProvider';
import SdkBridge from './SdkBridge';
import PermissionProvider from './PermissionProvider';

import DddiceSettings from './DddiceSettings';

const root = ReactDOM.createRoot(document.getElementById('dddice'));
root.render(<DddiceSettings storageProvider={new StorageProvider()} sdkBridge={new SdkBridge()}
                            permissionProvider={new PermissionProvider()} />);
