/**
 * Submit API Key
 *
 * @format
 */

import React, { useCallback, useState } from 'react';
import classNames from 'classnames';

import { ThreeDDiceAPI, IUser } from 'dddice-js';

import Check from '../assets/interface-essential-checkmark-sqaure-copy.svg';

interface ISplash {
  onSuccess(apiKey: string, user: IUser): any;
}

const ApiKeyEntry = (props: ISplash) => {
  const { onSuccess } = props;

  /**
   * Loading
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check if API Key is valid
   */
  const checkKeyValid = useCallback(async apiKey => {
    try {
      setIsLoading(true);
      const api = new ThreeDDiceAPI(apiKey, 'browser extension');
      const user: IUser = (await api.user.get()).data;
      onSuccess(apiKey, user);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, []);

  /**
   * Submit API Key Form
   */
  const onSubmit = useCallback(e => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const apiKey = formData.get('apiKey');
    checkKeyValid(apiKey);
  }, []);

  /**
   * Render
   */
  return (
    <>
      <form className="mt-4 !text-white" onSubmit={onSubmit}>
        <label className="flex flex-row">
          <input
            autoComplete="off"
            className={classNames(
              'rounded !text-gray-100 bg-gray-800 p-2 text-base w-full',
              isLoading && 'opacity-75',
            )}
            disabled={isLoading}
            name="apiKey"
            placeholder="Enter API Key"
            type="password"
          />
          <button formaction="submit" className="!text-gray-300">
            <Check className="ml-1 flex h-10 w-10 m-auto" data-tip="Submit" data-place="right" />
          </button>
        </label>
      </form>

      {isLoading && (
        <span className="pt-2 text-center block text-gray-300 text-xxs">Connecting ...</span>
      )}

      <p className="mt-4 text-gray-200 text-xxs text-center">
        Enter your{' '}
        <a
          className="!text-neon-blue !hover:text-neon-light-blue"
          href="https://dddice.com/account/developer"
          target="_blank"
        >
          dddice API Key
        </a>{' '}
        above to roll 3D dice using your favorite VTT.
      </p>
    </>
  );
};

export default ApiKeyEntry;
