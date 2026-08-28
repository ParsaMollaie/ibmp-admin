import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian_en from 'react-date-object/locales/persian_en';
import { DateObject } from 'react-multi-date-picker';

export const convertFaDateToEnDate = (date: Date | DateObject | string) => {
  return new DateObject(date).setCalendar(gregorian).setLocale(gregorian_en);
};

/**
 * Extracts a Jalali [year, month, day] triple from whatever the date picker
 * hands back at submit time. Prefers react-date-object's `DateObject` shape
 * (plain numeric `.year`/`.day`, `.month.number`) — reading these directly
 * avoids locale-formatted digits entirely (`persian_fa` renders `.format()`
 * output with Persian-script numerals like "۱۴۰۵", which `Number()` cannot
 * parse). Falls back to a dayjs-like `.format()` getter, then to regex
 * extraction from a raw string, for defensiveness. Never throws; returns
 * null if the shape is unrecognized.
 */
const extractJalaliYmd = (value: unknown): [number, number, number] | null => {
  if (!value) return null;

  const asDateObject = value as {
    year?: unknown;
    month?: unknown;
    day?: unknown;
  };
  if (
    typeof asDateObject.year === 'number' &&
    typeof asDateObject.day === 'number'
  ) {
    const month =
      typeof asDateObject.month === 'number'
        ? asDateObject.month
        : (asDateObject.month as { number?: unknown } | undefined)?.number;
    if (typeof month === 'number') {
      return [asDateObject.year, month, asDateObject.day];
    }
  }

  if (typeof (value as { format?: unknown }).format === 'function') {
    const formatted = (value as { format: (f: string) => string }).format(
      'YYYY-MM-DD',
    );
    const parts = formatted.split('-').map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      return parts as [number, number, number];
    }
  }

  if (typeof value === 'string') {
    const match = value.match(/(\d{3,4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return [Number(match[1]), Number(match[2]), Number(match[3])];
    }
  }

  return null;
};

/**
 * Combines a Jalali-calendar date (from antd-jalali's DatePicker) with a
 * separately-picked hour/minute/second into a Gregorian "YYYY-MM-DD HH:mm:ss"
 * string, without ever calling a dayjs setter on the jalali-tagged value —
 * antd-jalali's generateConfig has proven unreliable for that, and its
 * DatePicker's value has also intermittently arrived as a raw formatted
 * string rather than a dayjs object. The Gregorian conversion is always
 * built directly via react-date-object's own Persian calendar.
 */
export const combineFaDateAndTimeToEnDateTime = (
  jalaliDate: unknown,
  hour?: number,
  minute?: number,
  second?: number,
): string | null => {
  const ymd = extractJalaliYmd(jalaliDate);
  if (!ymd) {
    // eslint-disable-next-line no-console
    console.error(
      'combineFaDateAndTimeToEnDateTime: unrecognized date value',
      jalaliDate,
    );
    return null;
  }
  const [year, month, day] = ymd;

  const jalaliObj = new DateObject({
    year,
    month,
    day,
    hour: Number(hour) || 0,
    minute: Number(minute) || 0,
    second: Number(second) || 0,
    calendar: persian,
    locale: persian_en,
  });

  const greg = jalaliObj.convert(gregorian, gregorian_en);

  // greg's year/month/day/hour/minute/second are wall-clock values in the
  // admin's local (browser) timezone. The backend stores/expects UTC
  // (APP_TIMEZONE=UTC), so convert via the platform's own timezone database
  // instead of assuming a fixed offset.
  const localDate = new Date(
    greg.year,
    greg.month.number - 1,
    greg.day,
    greg.hour,
    greg.minute,
    greg.second,
  );

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(
      localDate.getUTCDate(),
    )} ` +
    `${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}:${pad(
      localDate.getUTCSeconds(),
    )}`
  );
};
