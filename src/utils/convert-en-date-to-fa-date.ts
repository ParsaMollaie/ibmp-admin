import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { DateObject } from 'react-multi-date-picker';

export const convertEnDateToFaDate = (
  date: Date | DateObject | string | number,
) => {
  // react-date-object's DateObject constructor silently drops the time-of-day
  // when given an ISO string with a timezone offset/suffix (e.g. the
  // "+00:00"/"Z"-suffixed strings the backend returns) — it always resolves
  // to 00:00. Routing the string through a native `Date` first parses the
  // instant correctly and yields DateObject the local wall-clock time via
  // the platform's own timezone handling.
  const normalized = typeof date === 'string' ? new Date(date) : date;
  return new DateObject(normalized).setCalendar(persian).setLocale(persian_fa);
};
