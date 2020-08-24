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

export interface IDateRange {
  direction: IDateRangeDirection
  max: string
  min: string
  today: 'max' | 'min' | false
}

export interface IPreferences {
  locale: string
}

export interface IDistance {
  unit: DurationUnit
}

export interface IComputed {
  duration: Ref<number>
}

export type IDistanceDatesModel = IDateRange & IDistance & IPreferences

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
  locale: 'en-CA',
}

export const createDateTime = (
  count: number,
  unit: DurationUnit,
  direction: DateRangeDirection,
): DateTime => {
  const inTheFuture = isFuture(direction)
  if (inTheFuture) {
    return DateTime.local().plus({ [unit]: count })
  } else {
    return DateTime.local().minus({ [unit]: count })
  }
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
    logger.debug(`use-distance-dates: changeDateRange`, {
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
    changeDateRange(changeset)
  })

  watchEffect(() => {
    const unit = distanceDates.unit
    const max = DateTime.fromISO(distanceDates.max)
    const min = DateTime.fromISO(distanceDates.min)
    const interval = Interval.fromDateTimes(min, max)
    const computedDuration = Math.ceil(interval.length(unit))
    duration.value = computedDuration
    logger.debug(`use-distance-dates: watchEffect`, {
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
