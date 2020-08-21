import {
  reactive,
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
  'quarters',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
] as const

export type IDateRangeDirection = 'FUTURE' | 'PAST'

export const directions: ReadonlyArray<IDateRangeDirection> = [
  'FUTURE',
  'PAST',
] as const

export const enum DateRangeDirection {
  Future = 'FUTURE',
  Past = 'PAST',
}

export const assertsIsDirection = (
  value: DateRangeDirection,
): /*asserts*/ value is DateRangeDirection => {
  console.log('assertsIsDirection', value)
  switch (directions.includes(value)) {
    case true:
      // If it was TypeScript 3.7+ we could use asserts ^
      return true
    default:
      throw new TypeError('Unsupported value: ' + JSON.stringify(value))
  }
}

export interface ICalculateResetForm {
  direction: IDateRangeDirection
  unit: DurationUnit
}

export const resetCalculateBasedForm = (): ICalculateResetForm => {
  const state: ICalculateResetForm = {
    direction: 'FUTURE',
    unit: 'days',
  }
  return state
}

export const isFuture = (direction: DateRangeDirection): boolean => {
  assertsIsDirection(direction)
  return direction === DateRangeDirection.Future
}

export interface IDateRange {
  direction: IDateRangeDirection
  min: string
  max: string
}

export interface IComputed {
  duration: Ref<number>
}

export interface IDistance {
  unit: DurationUnit
}

export interface IPreferences {
  locale: string
}

export type IDistanceDatesModel = IDateRange & IDistance & IPreferences

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

export default (
  options: Partial<IDistanceDatesModelOptions> = {},
): IDistanceDatesSurface => {
  const duration = ref(0)
  const min = DateTime.local().toISODate()

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
    max: min,
    min,
    unit: opts.defaultDistanceUnit,
  })

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
    change: Partial<IDateRange & IDistance> = {},
  ): void => {
    const newState: IDateRange & IDistance = {
      unit: opts.defaultDistanceUnit,
      direction: 'FUTURE',
      min,
      max: min,
      ...change,
    }
    logger.info(`use-distance-dates: changeDateRange`, {
      before: { ...unref(distanceDates) },
      after: newState,
    })
    distanceDates.min = newState.min
    distanceDates.max = newState.max
    distanceDates.direction = newState.direction
    distanceDates.unit = newState.unit
  }

  logger.info(`use-distance-dates`)

  watchEffect(() => {
    const unit = distanceDates.unit
    const max = DateTime.fromISO(distanceDates.max)
    const min = DateTime.fromISO(distanceDates.min)
    const interval = Interval.fromDateTimes(min, max)
    const computedDuration = Math.ceil(interval.length(unit))
    duration.value = computedDuration
    logger.info(`use-distance-dates: watchEffect`, {
      duration: unref(duration),
      max: unref(distanceDates.max),
      min: unref(distanceDates.min),
    })
  })

  // https://github.com/vuejs/vue-next/blob/master/packages/reactivity/__tests__/effect.spec.ts#L117

  return {
    distanceDates: toRefs(distanceDates),
    duration: readonly(duration),
    changeDirection,
    changeDateRange,
  }
}
