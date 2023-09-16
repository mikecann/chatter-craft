import { daysInMs, hoursInMs, minutesInMs } from "./time";
import { match } from "./match";
import { pluralize } from "./misc";

export const getDurationFromRange = (start: number, end: number) => {
  start = Math.min(start, end);
  const totalMs = end - start;
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalMs / minutesInMs(1));
  const totalHours = Math.floor(totalMs / hoursInMs(1));
  const totalDays = Math.floor(totalMs / daysInMs(1));

  return {
    totalMs,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
  };
};

export type Duration = ReturnType<typeof getDurationFromRange>;

export type FormatMode = "single_long" | "single_short" | "single_micro";

export const getDuration = (ms: number) => getDurationFromRange(0, ms);

export const formatDuration = (
  { totalSeconds, totalMinutes, totalHours, totalDays }: Duration,
  mode: FormatMode,
) => {
  return match(mode, {
    single_long: () => {
      if (totalDays > 0) return `${totalDays} day${pluralize(totalDays)}`;
      if (totalHours > 0) return `${totalHours} hour${pluralize(totalHours)}`;
      if (totalMinutes > 0) return `${totalMinutes} minute${pluralize(totalMinutes)}`;
      if (totalSeconds > 0) return `${totalSeconds} second${pluralize(totalSeconds)}`;
      return `0 seconds`;
    },
    single_short: () => {
      if (totalDays > 0) return `${totalDays} day${pluralize(totalDays)}`;
      if (totalHours > 0) return `${totalHours} hour${pluralize(totalHours)}`;
      if (totalMinutes > 0) return `${totalMinutes} min${pluralize(totalMinutes)}`;
      if (totalSeconds > 0) return `${totalSeconds} sec${pluralize(totalSeconds)}`;
      return `0 sec`;
    },
    single_micro: () => {
      if (totalDays > 0) return `${totalDays}d`;
      if (totalHours > 0) return `${totalHours}h`;
      if (totalMinutes > 0) return `${totalMinutes}m`;
      if (totalSeconds > 0) return `${totalSeconds}s`;
      return `0s`;
    },
  });
};
