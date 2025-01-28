/** @format */

import classNames from 'classnames';
import React, { memo, PropsWithChildren } from 'react';

interface Props {
  className?: string;
  size: Extract<Size, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>;
}

const Title = ({ children, className, size }: PropsWithChildren<Props>) => (
  <span
    className={classNames(
      size === 'xs' && 'font-bold text-sm lg:text-lg',
      size === 'sm' && 'font-bold text-base lg:text-xl',
      size === 'md' && 'font-bold text-lg lg:text-2xl',
      size === 'lg' && 'font-bold text-xl lg:text-3xl',
      size === 'xl' && 'font-bold text-2xl lg:text-4xl',
      size === '2xl' && 'font-extrabold text-3xl lg:text-5xl',
      className,
    )}
  >
    {children}
  </span>
);

export default memo(Title);
