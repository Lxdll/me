import { Post } from '../type';

export const getYear = (a: Date | string | number) => new Date(a).getFullYear();
export const isFuture = (a?: Date | string | number) =>
  a && new Date(a) > new Date();
const isSameYear = (a?: Date | string | number, b?: Date | string | number) =>
  a && b && getYear(a) === getYear(b);
export function isSameGroup(a: Post, b?: Post) {
  return isFuture(a.date) === isFuture(b?.date) && isSameYear(a.date, b?.date);
}
