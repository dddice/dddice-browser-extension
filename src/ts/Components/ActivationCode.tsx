/** @format */

import React, { memo, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import humanReadableTimeDifference from '@@/Utilities/humanReadableTimeDifference';

import ButtonFlat from '@@/Components/Button/Flat';
import Col from '@@/Components/Layout/Col';
import Row from '@@/Components/Layout/Row';
import Or from '@@/Components/Typography/Or';
import Span from '@@/Components/Typography/Span';
import Title from '@@/Components/Typography/Title';

export interface CodeProps {
  expiresAt: string;
  code: string;
  isLoading?: boolean;
  onContinueAsGuest(): void;
}

const ActivationCode = ({ expiresAt, code, isLoading = false, onContinueAsGuest }: CodeProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Row>
        <Col size="md" className="text-center leading-tight">
          <Span size="lg" className="text-gray-200 block">
            {t('Go to')}
          </Span>
          <a href={process.env.API_URI + `/activate?code=${code}`} target="_blank" rel="noreferrer">
            <Title size="xl" className="text-white underline">
              dddice.com/activate
            </Title>
          </a>
        </Col>
      </Row>
      <Row>
        <Col size="md" className="text-center">
          <Span size="lg" className="text-gray-200 block">
            {t('Then enter this code')}
          </Span>
          {!isLoading && code ? (
            <>
              <DisplayCode>{code}</DisplayCode>
              <ExpiresIn expiresAt={expiresAt} />
            </>
          ) : (
            <>
              <DisplayCode>{'      '}</DisplayCode>
              <Row>
                <Col>
                  <Span size="lg" className="text-gray-300 block">
                    &nbsp;
                  </Span>
                </Col>
              </Row>
            </>
          )}
          <Or />
          <Row>
            <Col>
              <ButtonFlat onClick={onContinueAsGuest}>Continue as guest</ButtonFlat>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const DisplayCode = ({ children }: PropsWithChildren<any>) => (
  <span>
    {children.split('').map((letter: string, i) => (
      <span
        key={i}
        className="bg-gray-800 m-1 py-2 px-4 inline-flex items-center justify-center w-10 lg:w-16 h-10 lg:h-16"
      >
        <Title size="xl" className="text-white">
          {letter}
        </Title>
      </span>
    ))}
  </span>
);

const ExpiresIn = ({ expiresAt }: PropsWithChildren<any>) => {
  const { t } = useTranslation();

  const [expires, setExpires] = useState<string>();
  const calculateExpires = useCallback(() => {
    const { minutes, seconds } = humanReadableTimeDifference(new Date(), new Date(expiresAt));
    const minutesStr = `${minutes}`;
    const secondsStr = `${seconds}`.padStart(2, '0');
    return `${minutesStr}:${secondsStr}`;
  }, [expiresAt]);

  useEffect(() => {
    setExpires(calculateExpires());
    const interval = setInterval(() => setExpires(calculateExpires()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <Row>
      <Col>
        <Span size="lg" className="text-gray-300 block">
          {t('This code expires in ')}
          {expires}
        </Span>
      </Col>
    </Row>
  );
};

export default memo(ActivationCode);
