/**
 * Dates in this app are school days, not UTC days.
 *
 * Every date was previously derived with `new Date().toISOString().split('T')[0]`,
 * which is the UTC date. The school is in Edmonton (UTC-6 in summer), so UTC
 * midnight falls at 6pm local - in the middle of an evening class. From 6pm the
 * app believed it was already tomorrow, so lessons marked earlier stopped
 * matching "today" and students reappeared under Needing Attention, and
 * attendance was filed against the following day.
 *
 * Pinned to the school's zone rather than the browser's so a teacher marking
 * from a laptop set to another timezone still records the correct school day.
 */
export const SCHOOL_TIME_ZONE = 'America/Edmonton';

// en-CA formats as YYYY-MM-DD, and Intl handles DST for us.
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SCHOOL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The school-local date of a timestamp, as YYYY-MM-DD. */
export const schoolDateOf = (value: string | Date): string =>
  formatter.format(typeof value === 'string' ? new Date(value) : value);

/** Today's date at the school, as YYYY-MM-DD. */
export const schoolToday = (): string => formatter.format(new Date());

/** First and last day of the school-local month containing `ref`. */
export const schoolMonthBounds = (ref: Date = new Date()) => {
  const [year, month] = schoolDateOf(ref).split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    first: `${year}-${pad(month)}-01`,
    last: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
};
