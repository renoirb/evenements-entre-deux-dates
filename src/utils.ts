import { Ref } from 'vue'

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

export interface IComputed {
  duration: Ref<number>
}
