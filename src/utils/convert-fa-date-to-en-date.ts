import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { DateObject } from 'react-multi-date-picker';

export const convertFaDateToEnDate = (date: Date | DateObject | string) => {
  return new DateObject(date).setCalendar(gregorian).setLocale(gregorian_en);
};
