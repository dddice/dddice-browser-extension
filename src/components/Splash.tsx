/** @format */

import DddiceButton from './DddiceButton';

const Splash = () => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <DddiceButton>Join Room</DddiceButton>
        <DddiceButton isSecondary>Create Room</DddiceButton>
      </div>
      <div className="flex justify-center">
        <DddiceButton size="small" isSecondary>
          Connect Your Account
        </DddiceButton>
      </div>
    </div>
  );
};

export default Splash;
