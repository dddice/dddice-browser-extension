/** @format */

import classNames from 'classnames';
import React, { memo, PropsWithChildren } from 'react';

interface Props {
  className?: string;
  size: Extract<Size, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
  leading?: 'tight' | 'relaxed' | 'loose';
}

const Span = ({ children, className, size, leading = 'relaxed' }: PropsWithChildren<Props>) => (
  <span
    className={classNames(
      size === 'xs' && 'text-xs lg:text-xs',
      size === 'sm' && 'text-xs lg:text-sm',
      size === 'md' && 'text-sm lg:text-base',
      size === 'lg' && 'text-base lg:text-lg',
      size === 'xl' && 'text-lg lg:text-xl',
      leading === 'loose' && 'lg:leading-loose',
      leading === 'relaxed' && 'lg:leading-relaxed',
      leading === 'tight' && 'lg:leading-tight',
      className,
    )}
  >
    {children}
  </span>
);

export default memo(Span);
