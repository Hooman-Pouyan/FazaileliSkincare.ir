import { toGregorian, toJalaali, jalaaliMonthLength } from "jalaali-js";
import { toPersianDigits } from "./money";

/**
 * The ONLY module in the codebase that touches calendar conversion.
 *
 * Storage is UTC `timestamptz`. Jalali is a rendering concern. Storing Shamsi
 * is a trap. (AGENTS.md rule 2.)
 *
 * `date-fns-jalali` was rejected: it has never published a non-prerelease
 * version. See docs/07-dependency-audit.md.
 */

export const TEHRAN = "Asia/Tehran"; // Iran no longer observes DST.

const FA_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
const FA_WEEKDAYS = [
  "شنبه",
  "یک‌شنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
] as const;

export interface JalaliParts {
  jy: number;
  jm: number;
  jd: number;
}

export function toJalali(date: Date): JalaliParts {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TEHRAN,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number) as [number, number, number];
  return toJalaali(y, m, d);
}

export function fromJalali({ jy, jm, jd }: JalaliParts): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(Date.UTC(gy, gm - 1, gd));
}

/** Platform-native formatting — no library needed, always correct. */
export function formatJalali(
  date: Date,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: TEHRAN,
    ...opts,
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: TEHRAN,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function jalaliMonthName(jm: number): string {
  return FA_MONTHS[jm - 1]!;
}
export function jalaliWeekdayName(index: number): string {
  return FA_WEEKDAYS[index]!;
}
export function daysInJalaliMonth(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}
export function persianNumber(n: number): string {
  return toPersianDigits(String(n));
}
