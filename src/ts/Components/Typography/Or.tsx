/** @format */

import React, { memo } from 'react';

const Or = () => {
  return (
    <div className="flex flex-row items-center text-gray-300 w-full">
      <div className="flex-grow border-solid border-0 border-t border-gray-700" />
      <>
        <div className="pt-0 p-1">or</div>
        <div className="flex-grow border-solid border-0 border-t border-gray-700" />
      </>
    </div>
  );
};

export default memo(Or);
