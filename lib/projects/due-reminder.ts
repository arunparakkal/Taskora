export function getAppTimezone() {
  return process.env.APP_TIMEZONE?.trim() || "Asia/Kolkata";
}

/** YYYY-MM-DD in the given IANA timezone. */
export function formatCalendarDateInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getHourInTz(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(date);

  return Number(hour);
}

/** Add calendar days to a YYYY-MM-DD string. */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

/**
 * Send reminder on the day before the due date, starting 12 hours before
 * midnight on the due date (noon on the day before).
 */
export function shouldSendProjectDueReminder(
  dueDate: string,
  now: Date = new Date()
): boolean {
  const timeZone = getAppTimezone();
  const today = formatCalendarDateInTz(now, timeZone);
  const dayBeforeDue = addDaysToDateString(dueDate, -1);

  if (today !== dayBeforeDue) return false;

  return getHourInTz(now, timeZone) >= 12;
}
