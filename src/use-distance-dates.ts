import {
  reactive,
  onMounted,
  watchEffect,
  toRefs,
  ToRefs,
  unref,
  ref,
  Ref,
  readonly,
} from 'vue'
import { DateTime, Interval, DurationUnit } from 'luxon'

export const localesUnits: [string, string][] = [
  ['fr-CA', 'Français Canada'],
  ['en-CA', 'English Canada'],
  ['en-CA-u-ca-buddhist', 'English Canada with Budhist calendar'],
  ['pt-BR', 'Português'],
  ['ja-JP', '日本語 (Japanese)'],
  [
    'ja-Jpan-JP-u-ca-japanese-hc-h12',
    '日本語 (Japanese with Japanese calendar)',
  ],
  ['hi-IN', 'हिन्दी (Hindi)'],
]

export const durationUnits: ReadonlyArray<DurationUnit> = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
] as const

const durationUnitsSet = new Set([...durationUnits] as string[])

export const isInDurationUnits = (value: string): boolean =>
  durationUnitsSet.has(value)

export type IDateRangeDirection = 'FUTURE' | 'PAST'

export const directionUnits: ReadonlyArray<IDateRangeDirection> = [
  'FUTURE',
  'PAST',
] as const

export const enum DateRangeDirection {
  Future = 'FUTURE',
  Past = 'PAST',
}

export interface IDateRangeComponentProps {
  distanceDates: IDistanceDatesModel
}

export interface IDateRangeData {
  durationUnits: ReadonlyArray<DurationUnit>
}

export const assertsIsDirection = (
  value: DateRangeDirection,
): /*asserts*/ value is DateRangeDirection => {
  switch (directionUnits.includes(value)) {
    case true:
      // If it was TypeScript 3.7+ we could use asserts ^
      return true
    default:
      throw new TypeError('Unsupported value: ' + JSON.stringify(value))
  }
}

export const isFuture = (direction: DateRangeDirection): boolean => {
  assertsIsDirection(direction)
  return direction === DateRangeDirection.Future
}

export const toDateTimeInterval = (dateRange: IDateRange): Interval => {
  const minDate = DateTime.fromISO(dateRange.min)
  const maxDate = DateTime.fromISO(dateRange.max)
  const interval = Interval.fromDateTimes(minDate, maxDate)
  return interval
}

/**
 * e.g.
 * https://calendar.google.com/calendar/r/eventedit?text=Hello&details=Descr&location=home&dates=2020-08-23/2020-08-23
 *
 * Bookmarks:
 * - https://stackoverflow.com/a/23495015
 * - https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/master/services/google.md
 * - https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens
 */
export const formatCalendarLink = (
  dateRange: IDateRange,
  date: DateTime,
): string => {
  const FORMAT = 'yyyyMMdd'
  const urlObj = new URL('https://calendar.google.com/calendar/r/eventedit')
  const { locale = 'en-CA' } = dateRange
  urlObj.searchParams.append('ctz', 'America/New_York')
  urlObj.searchParams.append('text', 'Rendez-vous avec')
  const minDate = DateTime.fromISO(dateRange.min, { locale })
  const min = minDate.toFormat('DDD')
  const max = DateTime.fromISO(dateRange.max, { locale }).toFormat('DDD')
  const interval = Interval.fromDateTimes(minDate, date)
  const when = interval.toDuration(['months', 'days']).toObject()
  const details = `
----
Début de période: ${min}
Fin de période: ${max}
Moment du rendez-vous: ${when.months} mois, ${Math.ceil(when.days)} jours
  `
  urlObj.searchParams.append('details', details)
  const dates = [
    date.toFormat(FORMAT) + 'T190000',
    date.toFormat(FORMAT) + 'T200000',
  ]
  urlObj.searchParams.append('dates', dates.join('/'))

  return urlObj.toString()
}

export interface IDateRange {
  direction: IDateRangeDirection
  locale?: string
  max: string
  min: string
  today: 'max' | 'min' | false
}

export interface IDistance {
  unit: DurationUnit
}

export interface IComputed {
  duration: Ref<number>
}

export type IDistanceDatesModel = IDateRange & IDistance

export const distanceDatesModelFields = new Set([
  'direction',
  'locale',
  'max',
  'min',
  'today',
  'unit',
])

export const isInDistanceDatesModelFields = (field: string): boolean =>
  distanceDatesModelFields.has(field)

export type ILoggerFn = (message?: any, ...optionalParams: any[]) => void
export type ILogger = Record<'info' | 'log' | 'debug' | 'warn', ILoggerFn>

const noOpLogger: ILoggerFn = (message?: any, ...optionalParams: any[]) =>
  void 0

export class NoOpLogger implements ILogger {
  info = noOpLogger
  log = noOpLogger
  debug = noOpLogger
  warn = noOpLogger
}

export interface IDistanceDatesSurface extends IComputed {
  distanceDates: ToRefs<IDistanceDatesModel>
  changeDirection(direction: DateRangeDirection): void
  changeDateRange(dateRange: Partial<IDateRange>): void
  logger?: ILogger
}

export interface IDistanceDatesModelOptions {
  defaultDirection: IDateRangeDirection
  defaultDistanceUnit: DurationUnit
  locale: string
  logger?: ILogger
}

const defaultOptions: IDistanceDatesModelOptions = {
  defaultDirection: DateRangeDirection.Future,
  defaultDistanceUnit: 'days',
  locale: 'fr-CA',
}

export const createDateTime = (
  count: number,
  unit: DurationUnit,
  direction: DateRangeDirection,
  locale: string = 'en-CA',
): DateTime => {
  const inTheFuture = isFuture(direction)
  let d: DateTime
  if (inTheFuture) {
    d = DateTime.local().plus({ [unit]: count })
  } else {
    d = DateTime.local().minus({ [unit]: count })
  }
  d.setLocale(locale)
  return d
}

export interface ICreateDateTimeCollectionOptions
  extends Pick<IDistanceDatesModel, 'locale' | 'min' | 'max' | 'unit'> {
  count: number
}

export const createDateTimeCollection = function* dateTimeCollection(
  opts: ICreateDateTimeCollectionOptions,
): Generator<DateTime> {
  const { min, max, count, unit, locale = 'en-CA' } = opts
  const today = DateTime.local()
  today.setLocale(locale)
  let minDate = DateTime.fromISO(min, { locale })
  if (minDate < today) {
    minDate = today
  }
  const maxDate = DateTime.fromISO(max, { locale })
  let cur = minDate
  do {
    yield cur
    cur = cur.plus({ [unit]: count })
    cur.setLocale(locale)
  } while (cur < maxDate)
}

export default (
  location: Location,
  options: Partial<IDistanceDatesModelOptions> = {},
): IDistanceDatesSurface => {
  const duration = ref(0)
  const today = DateTime.local().toISODate()

  const opts: IDistanceDatesModelOptions = {
    ...defaultOptions,
    ...options,
  }

  let logger: ILogger = new NoOpLogger()
  if (opts.logger) {
    logger = opts.logger
  }

  const distanceDates = reactive<IDistanceDatesModel>({
    direction: opts.defaultDirection,
    locale: opts.locale,
    max: today,
    min: today,
    today: false,
    unit: opts.defaultDistanceUnit,
  })

  logger.debug(`use-distance-dates: startup`)

  const changeDirection = (direction: DateRangeDirection): void => {
    logger.info(`use-distance-dates: changeDirection(${direction})`)
    try {
      const isDirection = assertsIsDirection(direction)
      if (isDirection) {
        distanceDates.direction = direction
      }
    } catch (error) {
      const message = `
        use-distance-dates: changeDirection(${direction}):
        Invalid direction "${direction}": ${error}
      `
      logger.warn(message, error)
    }
  }

  const changeDateRange = (
    changeset: Partial<IDistanceDatesModel> = {},
  ): void => {
    const before = { ...unref(distanceDates) }
    logger.debug(`use-distance-dates 1/2: changeDateRange`, {
      before,
      changeset,
    })
    for (const [key, value] of Object.entries(changeset)) {
      if (distanceDatesModelFields.has(key)) {
        if (
          key === 'today' &&
          value !== false &&
          /^(max|min)$/.test(String(value)) === false
        ) {
          const message = `
            Invalid value for field today "${value}", must either be false, or 'max' or 'min'
          `
          logger.warn(message)
        } else {
          distanceDates[key] = value
        }
      }
    }
    if ('today' in changeset && typeof changeset.today === 'string') {
      distanceDates[changeset.today] = today
    }
    logger.debug(`use-distance-dates 2/2: changeDateRange`, {
      before,
      after: { ...unref(distanceDates) },
    })
  }

  onMounted(() => {
    const { search = '' } = location
    const parsed = String(search || '')
      .replace(/^\?/, '')
      .split('&')
      .map((i) => i.split('='))
    const changeset: Partial<IDistanceDatesModel> = {}
    for (const [key, value] of parsed) {
      if (distanceDatesModelFields.has(key)) {
        changeset[key] = value
      }
    }
    logger.debug(`use-distance-dates: onMounted`, {
      changeset,
    })
    changeDateRange(changeset)
  })

  watchEffect(() => {
    const unit = distanceDates.unit
    const locale = distanceDates.locale
    const max = DateTime.fromISO(distanceDates.max, {
      locale,
    })
    const min = DateTime.fromISO(distanceDates.min, {
      locale,
    })
    const interval = Interval.fromDateTimes(min, max)
    const computedDuration = Math.ceil(interval.length(unit))
    duration.value = computedDuration
    logger.debug(`use-distance-dates: watchEffect`, {
      locale,
      duration: unref(duration),
      max: unref(distanceDates.max),
      min: unref(distanceDates.min),
    })
  })

  // https://github.com/vuejs/vue-next/blob/master/packages/reactivity/__tests__/effect.spec.ts#L117

  return {
    changeDateRange,
    changeDirection,
    distanceDates: toRefs(distanceDates),
    duration: readonly(duration),
  }
}
