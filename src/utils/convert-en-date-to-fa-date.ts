import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { DateObject } from 'react-multi-date-picker';

export const convertEnDateToFaDate = (
  date: Date | DateObject | string | number,
) => {
  return new DateObject(date).setCalendar(persian).setLocale(persian_fa);
};
