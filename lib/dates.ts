import {
  format,
  parse,
  isValid,
  addDays,
  addWeeks,
  addMonths,
  startOfISOWeek,
  getISOWeek,
  getISOWeekYear,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TZ = 'Asia/Taipei'

export function getTaipeiNow(): Date {
  return toZonedTime(new Date(), TZ)
}

export function getCurrentMonthParam(): string {
  return format(getTaipeiNow(), 'yyyy-MM')
}

export function getCurrentWeekParam(): string {
  const now = getTaipeiNow()
  return `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`
}

/** Parses "YYYY-MM" → Date (1st of that month), or null if invalid */
export function parseMonthParam(param: string): Date | null {
  const d = parse(param, 'yyyy-MM', new Date())
  return isValid(d) ? d : null
}

/** Parses "YYYY-Www" → Monday of that ISO week, or null if invalid */
export function parseWeekParam(param: string): Date | null {
  const match = param.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null
  const d = parse(`${match[1]}-${match[2]}`, 'RRRR-II', new Date())
  return isValid(d) ? startOfISOWeek(d) : null
}

/** Returns 7 "YYYY-MM-DD" strings Mon–Sun for the ISO week starting at weekStart */
export function getWeekDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  )
}

/** Returns { start, end } as "YYYY-MM-DD" for the full calendar month */
export function getMonthDateRange(monthDate: Date): { start: string; end: string } {
  return {
    start: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
    end: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
  }
}

export function formatWeekParam(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

export function formatMonthParam(date: Date): string {
  return format(date, 'yyyy-MM')
}

/** "2025 W24 · 6/9–6/15" */
export function formatWeekLabel(weekStart: Date): string {
  const year = getISOWeekYear(weekStart)
  const week = String(getISOWeek(weekStart)).padStart(2, '0')
  const first = format(weekStart, 'M/d')
  const last = format(addDays(weekStart, 6), 'M/d')
  return `${year} W${week} · ${first}–${last}`
}

/** "2025年 6月" */
export function formatMonthLabel(monthDate: Date): string {
  return format(monthDate, 'yyyy年 M月')
}

export function prevWeekParam(weekStart: Date): string {
  return formatWeekParam(addWeeks(weekStart, -1))
}

export function nextWeekParam(weekStart: Date): string {
  return formatWeekParam(addWeeks(weekStart, 1))
}

export function prevMonthParam(monthDate: Date): string {
  return formatMonthParam(addMonths(monthDate, -1))
}

export function nextMonthParam(monthDate: Date): string {
  return formatMonthParam(addMonths(monthDate, 1))
}