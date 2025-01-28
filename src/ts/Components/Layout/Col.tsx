/** @format */

import classNames from 'classnames';
import React, { memo, PropsWithChildren } from 'react';

interface Props {
  className?: string;
  shrink?: boolean;
  size?: Size;
}

const Col = ({ children, className, shrink, size = 'md' }: PropsWithChildren<Props>) => {
  return (
    <div
      className={classNames(
        size === 'xs' && 'p-0',
        size === 'sm' && 'p-1',
        size === 'md' && 'p-3',
        size === 'lg' && 'p-5',
        size === 'xl' && 'p-8',
        !shrink ? 'flex-1' : 'flex-shrink',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default memo(Col);
