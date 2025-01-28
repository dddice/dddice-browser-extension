/** @format */

import classNames from 'classnames';
import React, { memo, PropsWithChildren } from 'react';

interface Props {
  className?: string;
  center?: boolean;
  responsive?: boolean;
  reverse?: boolean;
  wrap?: boolean;
}

const Row = ({
  center,
  children,
  className,
  responsive = true,
  reverse = false,
  wrap,
}: PropsWithChildren<Props>) => (
  <div
    className={classNames(
      'flex',
      center && 'items-center justify-center',
      responsive && (!reverse ? 'flex-col sm:flex-row' : 'flex-col-reverse sm:flex-row'),
      wrap && 'flex-wrap',
      className,
    )}
  >
    {children}
  </div>
);

export default memo(Row);
