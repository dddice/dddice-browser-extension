/** @format */

const humanReadableTimeDifference = (startDate: Date, endDate: Date) => {
  const timeRemaining = (endDate.getTime() - startDate.getTime()) / 1000;
  const minutes = Math.floor((((timeRemaining % 31536000) % 86400) % 3600) / 60);
  const seconds = Math.floor((((timeRemaining % 31536000) % 86400) % 3600) % 60);

  const minutesStr = `${minutes}`;
  const secondsStr = `${seconds}`.padStart(2, '0');

  return { minutes: minutesStr, seconds: secondsStr };
};

export default humanReadableTimeDifference;
