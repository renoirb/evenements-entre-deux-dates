import {
  reactive,
  onMounted,
  watchEffect,
  toRefs,
  ToRefs,
  unref,
  ref,
  readonly,
} from 'vue'
import { DateTime, Interval, DurationUnit } from 'luxon'
import { IComputed, ILogger, NoOpLogger } from './utils'

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
  isPregnancy: boolean
}

export interface IDateRangeData {
  durationUnits: ReadonlyArray<DurationUnit>
}

export type IDurationUnit = IDateRangeData['durationUnits'][number]

export const assertsIsDirection = (
  value: DateRangeDirection,
): /*asserts*/ value is DateRangeDirection => {
  switch (isDirection(value)) {
    case true:
      // If it was TypeScript 3.7+ we could use asserts ^
      return true
    default:
      throw new TypeError('Unsupported value: ' + JSON.stringify(value))
  }
}

export const isDirection = (
  direction: unknown,
): direction is DateRangeDirection =>
  directionUnits.includes(direction as DateRangeDirection)

export const isFuture = (
  direction: unknown,
): direction is DateRangeDirection.Future => {
  return isDirection(direction) && direction === DateRangeDirection.Future
}

export const isDateTimeString = (input: unknown): input is DateTime => {
  let outcome = false
  try {
    const _ = DateTime.fromISO(input as string)
    outcome = true
  } catch {
    // Nothing to do
  }
  return outcome
}

export const toDateTimeInterval = (dateRange: IDateRange): Interval => {
  const minDate = DateTime.fromISO(dateRange.min)
  const maxDate = DateTime.fromISO(dateRange.max)
  const interval = Interval.fromDateTimes(minDate, maxDate)
  return interval
}

export const verbalizeDurationText = (
  interval: Interval,
  durationKeys: DurationUnit[] = ['years', 'months', 'days'],
): string => {
  const { years = 0, months = 0, weeks = 0, days = 0 } = interval
    .toDuration([...durationKeys])
    .toObject()
  const parts = [
    years !== 0 ? `${Math.ceil(years)} ${years > 1 ? 'annés' : 'an'}` : '',
    months !== 0 ? `${Math.ceil(months)} mois` : '',
    weeks !== 0
      ? `${Math.ceil(weeks)} ${weeks > 1 ? 'semaines' : 'semaine'}`
      : '',
    days !== 0 ? `${Math.ceil(days)} jours` : '',
  ].filter((i) => i !== '')
  return parts.join(', ')
}

export const formatCalendarEventText = (
  dateRange: IDateRange,
  date: DateTime,
): string => {
  const { locale = 'en-CA' } = dateRange
  const minDate = DateTime.fromISO(dateRange.min, { locale })
  const min = minDate.toFormat('DDD')
  const max = DateTime.fromISO(dateRange.max, { locale }).toFormat('DDD')
  const interval = Interval.fromDateTimes(minDate, date)
  const momentRendezVous = verbalizeDurationText(interval)
  return `
  Début de période: ${min}
  Fin de période: ${max}
  Moment du rendez-vous: ${momentRendezVous}
  `
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
  const details = '\n----\n' + formatCalendarEventText(dateRange, date)

  const urlObj = new URL('https://calendar.google.com/calendar/r/eventedit')
  urlObj.searchParams.append('ctz', 'America/New_York')
  urlObj.searchParams.append('text', 'Rendez-vous avec')
  urlObj.searchParams.append('details', details)
  const FORMAT = 'yyyyMMdd'
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

export type IDistanceDatesModel = IDateRange & IDistance

export interface ICreateDateTimeCollectionOptions extends IDistanceDatesModel {
  count: number
  direction: IDateRange['direction']
}

export interface IRelativeDateRangeCalculate {
  count: number
  direction: IDateRange['direction']
  unit: IDistance['unit']
}

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

export interface IDistanceDatesSurface extends IComputed {
  distanceDates: ToRefs<IDistanceDatesModel>
  changeDirection(direction: DateRangeDirection): void
  mutate(changeset: Partial<IDistanceDatesModel>): void
  logger?: ILogger
  urlObj: URL
}

export interface IDistanceDatesModelOptions {
  defaultDirection: IDateRange['direction']
  defaultDistanceUnit: IDistance['unit']
  locale: string
  logger?: ILogger
}

const defaultOptions: IDistanceDatesModelOptions = {
  defaultDirection: DateRangeDirection.Future,
  defaultDistanceUnit: 'days',
  locale: 'fr-CA',
}

export const createDateTime = (
  locale: string = 'en-CA',
  change: Partial<IRelativeDateRangeCalculate>,
): DateTime => {
  const { count = 0, unit = 'months', direction = 'FUTURE' } = change
  let d = DateTime.local()
  if (count > 0) {
    if (direction && unit) {
      if (isFuture(direction)) {
        d = d.plus({ [unit]: count })
      } else {
        d = d.minus({ [unit]: count })
      }
    } else {
      const message = `Missing properties: unit, direction`
      throw new Error(message)
    }
  }

  d.setLocale(locale)
  return d
}

export const flipMaxMin = (input: 'max' | 'min'): 'max' | 'min' =>
  input === 'max' ? 'min' : 'max'

export const createDateTimeCollection = function* dateTimeCollection(
  opts: ICreateDateTimeCollectionOptions,
  adjust: number,
): Generator<DateTime> {
  const { min, max, count, unit, locale = 'en-CA' } = opts
  let minDate = DateTime.fromISO(min, { locale })
  const today = createDateTime(locale, { count: 0 })
  if (minDate < today) {
    // What makes it so that we do not see dates in past
    minDate = today
  }
  const maxDate = DateTime.fromISO(max, { locale })
  let cur = minDate.plus({ days: adjust })
  do {
    yield cur
    cur = cur.plus({ [unit]: count })
  } while (cur < maxDate)
}

export const validateRelativeDateRangePayload = <
  T extends IRelativeDateRangeCalculate
>(
  payload: T,
) => {
  const { count, direction, unit } = payload
  if (isDirection(direction) === false) {
    const message = `The direction property must either be: 'FUTURE' or 'PAST', we got: ${direction}`
    throw new Error(message)
  }
  if (Number.isInteger(count) === false || count < 0) {
    const message = `The count property must be a number above 0, we got: ${count}`
    throw new Error(message)
  }
  if (isInDurationUnits(unit) === false) {
    const message = `The unit property must be a string describing a unit of time, we got: ${unit}`
    throw new Error(message)
  }
  return true
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

  const distanceDates = reactive({
    direction: opts.defaultDirection,
    locale: opts.locale,
    max: today,
    min: today,
    today: false,
    unit: opts.defaultDistanceUnit,
  } as IDistanceDatesModel)

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

  const mutate = (changeset: Partial<IDistanceDatesModel> = {}): void => {
    const before = { ...unref(distanceDates) }
    logger.debug(`use-distance-dates 1/2: mutate`, {
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
          // distanceDates[key] = value
          Reflect.set(distanceDates, key, value)
        }
      }
    }
    if ('today' in changeset && typeof changeset.today === 'string') {
      // distanceDates[changeset.today] = today
      Reflect.set(distanceDates, changeset.today, today, distanceDates)
    }
    logger.debug(`use-distance-dates 2/2: mutate`, {
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
        // changeset[key] = value
        Reflect.set(changeset, key, value)
      }
    }
    logger.debug(`use-distance-dates: onMounted`, {
      changeset,
      search,
      location,
    })
    mutate(changeset)
  })

  watchEffect(() => {
    const before = { ...unref(distanceDates) }
    logger.debug(`use-distance-dates 1/2: watchEffect`, {
      before,
    })
    const max = DateTime.fromISO(distanceDates.max, {
      locale: distanceDates.locale,
    })
    const min = DateTime.fromISO(distanceDates.min, {
      locale: distanceDates.locale,
    })
    const interval = Interval.fromDateTimes(min, max)
    const computedDuration = Math.ceil(interval.length(distanceDates.unit))
    duration.value = computedDuration
    logger.debug(`use-distance-dates 2/2: watchEffect`, {
      before,
      after: { ...unref(distanceDates) },
      duration: unref(duration),
    })
  })

  const urlObj = new URL(location.href)

  // https://github.com/vuejs/vue-next/blob/master/packages/reactivity/__tests__/effect.spec.ts#L117

  return {
    mutate,
    changeDirection,
    urlObj,
    distanceDates: toRefs(distanceDates),
    duration: readonly(duration),
  }
}
