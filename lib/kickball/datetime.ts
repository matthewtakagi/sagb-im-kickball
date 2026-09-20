export const TEAM_TIME_ZONE = "America/Los_Angeles";

const GAME_TIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: TEAM_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export function formatGameDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", GAME_TIME_OPTS);
}

function tzOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asUtc - date.getTime();
}

/** Interpret a date + HH:MM wall clock as Pacific Time. */
export function pacificWallClockToIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = tzOffsetMs(new Date(utcGuess), TEAM_TIME_ZONE);
  return new Date(utcGuess - offset).toISOString();
}
