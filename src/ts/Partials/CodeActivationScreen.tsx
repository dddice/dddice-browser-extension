/** @format */
import React, { memo, useEffect, useState } from 'react';
import ActivationCode from '../Components/ActivationCode';
import { ThreeDDiceAPI } from 'dddice-js';

interface CodeActivationScreenProps {
  setApiKey: (string) => void;
}

const api = new ThreeDDiceAPI(null, 'Browser Extension');

const CodeActivationScreen = ({ setApiKey }: CodeActivationScreenProps) => {
  const [state, setState] = useState({
    code: '',
    expires_at: new Date().toISOString(),
    isLoading: true,
  });
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'activate' });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      setState({ code: message.data.code, expires_at: message.data.expires_at, isLoading: false });
    });
  }, []);

  return (
    <ActivationCode
      code={state?.code}
      expiresAt={state?.expires_at}
      isLoading={state?.isLoading}
      onContinueAsGuest={async () => {
        setApiKey((await api.user.guest()).data);
      }}
    />
  );
};

export default memo(CodeActivationScreen);
