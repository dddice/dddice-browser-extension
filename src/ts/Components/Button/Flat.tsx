/** @format */

import classNames from 'classnames';
import React, { memo, PropsWithChildren, ReactEventHandler } from 'react';

export type ButtonType = 'default' | 'success' | 'danger' | 'alt';

interface Props extends WithTooltip {
  className?: string;
  href?: string;
  isDisabled?: boolean;
  tabIndex?: number;
  onClick?: ReactEventHandler<HTMLButtonElement>;
  type?: ButtonType;
}

const BaseButtonFlat = ({ children, type = 'default' }: PropsWithChildren<Props>) => (
  <>
    <span className="transition block absolute w-full h-full top-0 left-0 z-10 rounded bg-gradient-to-tr from-black to-gray-900 opacity-0 group-hover/button:opacity-100 group-active/button:opacity-0">
      &nbsp;
    </span>
    <span
      className={classNames(
        'transition flex items-center justify-center p-3 rounded font-bold z-20 relative shadow-lg transform group-hover/button:-translate-x-px group-hover/button:-translate-y-px group-active/button:translate-x-0 group-active/button:translate-y-0 whitespace-nowrap',
        type === 'default' && 'bg-gradient-to-tr from-gray-200 to-gray-100 text-gray-800',
        type === 'danger' && 'bg-gradient-to-tr from-neon-red to-neon-light-red text-white',
        type === 'success' && 'bg-gradient-to-tr from-neon-green to-neon-light-green text-black',
        type === 'alt' && 'bg-gray-700 text-gray-200',
      )}
    >
      {children}
    </span>
  </>
);

const ButtonFlat = ({
  children,
  className,
  href,
  isDisabled,
  tabIndex,
  onClick,
  type,
  ...props
}: PropsWithChildren<Props>) =>
  typeof href === 'string' ? (
    <a
      href={href}
      className={classNames(
        'inline-block relative group/button',
        isDisabled && 'opacity-50 pointer-events-none',
        className,
      )}
      {...props}
    >
      <BaseButtonFlat type={type}>{children}</BaseButtonFlat>
    </a>
  ) : (
    <button
      onClick={onClick}
      tabIndex={tabIndex}
      className={classNames(
        'inline-block relative group/button',
        isDisabled && 'opacity-50 pointer-events-none',
        className,
      )}
      {...props}
    >
      <BaseButtonFlat type={type}>{children}</BaseButtonFlat>
    </button>
  );

export default memo(ButtonFlat);
