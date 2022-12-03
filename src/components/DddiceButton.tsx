/** @format */
import classNames from 'classnames';

const DddiceButton = props => {
  const { onClick, children, size, isSecondary } = props;

  return (
    <button
      className={classNames(
        'relative inline-block transition transform hover:scale-105 lg:mt-12',
        size == 'small' ? 'mt-2 m-2' : 'mt-3 m-3',
      )}
      onClick={onClick}
    >
      <span
        className={classNames(
          'block rounded-lg bg-gradient-to-tr h-full w-full absolute z-10',
          size === 'small' ? 'mt-1 ml-1' : 'mt-2 ml-2',
          isSecondary ? 'from-neon-blue to-neon-green' : 'from-neon-yellow to-neon-pink',
        )}
      >
        &nbsp
      </span>
      <span
        className={classNames(
          'block rounded-lg flex items-center bg-black shadow relative z-20 h-full border-2',
          isSecondary ? 'border-neon-blue' : 'border-neon-yellow',
        )}
      >
        <span
          className={classNames(
            'flex-1 font-bold',
            size === 'small' ? 'text-xs p-1' : 'text-sm lg:text-md p-3',
            isSecondary ? 'text-neon-blue' : 'text-neon-yellow',
          )}
        >
          {children}
        </span>
      </span>
    </button>
  );
};

export default DddiceButton;
