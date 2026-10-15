import clc from 'cli-color'
import logSymbols from 'log-symbols'
import ora, {type Ora} from 'ora'

const HINT = '💡'

type ProgressState = 'fail' | 'loading' | 'succeed'

class Progress {
  index: number
  max: number
  value: ProgressState[]
  constructor(max: number) {
    this.max = max
    this.index = 0
    this.value = Array.from({length: this.max > 100 ? 100 : this.max}, () => 'loading')
  }

  color(value: ProgressState) {
    switch (value) {
      case 'loading': {
        return ['-', clc.white] as const
      }

      case 'succeed': {
        return ['|', clc.green] as const
      }

      case 'fail': {
        return ['|', clc.red] as const
      }
    }
  }

  fail() {
    this.value[this.getIndex()] = 'fail'
    this.index++
  }

  get() {
    const res = this.value.map((v) => this.color(v))
    const parcent = Math.floor((this.index / this.max) * 100)
    return `[${res.map(([v, c]) => c(v)).join('')}] ${parcent}%`
  }

  getIndex() {
    if (this.max > 100) {
      return Math.floor((this.index / this.max) * 100)
    }

    return this.index
  }

  succeed() {
    if (this.value[this.getIndex()] === 'loading') {
      this.value[this.getIndex()] = 'succeed'
    }

    this.index++
  }
}

type LogType = 'error' | 'hint' | 'log' | 'warn'

export class Logger {
  protected stackHint: string[] = []
  protected stackLog: string[] = []
  private ora: Ora | undefined

  private progress: Progress | undefined
  private text: string | undefined

  log(...args: unknown[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'log')
    this.stackLogDump()
  }

  hint(...args: unknown[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'hint')
    this.stackLogDump()
  }

  warn(...args: unknown[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'warn')
    this.stackLogDump()
  }

  error(...args: unknown[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'error')
    this.stackLogDump()
  }

  catchError(e: unknown) {
    this.error(this.toString(e))
  }

  private terminal(e: string, type?: LogType) {
    const pattern = {
      error: [clc.redBright, (e: Ora) => e.fail()] as const,
      hint: [clc.cyanBright, (e: Ora) => e.stopAndPersist({symbol: HINT})] as const,
      log: [clc.blackBright, (e: Ora) => e.info()] as const,
      undefined: [clc.blackBright, (e: Ora) => e.stopAndPersist({symbol: ''})] as const,
      warn: [clc.yellowBright, (e: Ora) => e.warn()] as const,
    }
    const spinning = this.ora?.isSpinning ? this.ora : undefined
    spinning?.clear()

    const pat = pattern[type ?? 'undefined']
    const text = type ? `[${type.toUpperCase()}] ${e}` : e
    pat[1](ora(pat[0](text)))

    spinning?.start()
  }

  async guard<T>({text, callback}: {callback: Promise<T>; text: string}) {
    try {
      this.ora = ora(text).start()
      const res = await callback
      this.succeed()
      return res
    } catch (error) {
      this.catchFail(error)
      throw error
    }
  }

  async guardProgress<T>({max, text, callback}: {callback: Promise<T>; max: number; text: string}) {
    try {
      this.ora = ora(text).start()
      this.progress = new Progress(max)
      this.update(text)
      const res = await callback
      this.progress = undefined
      this.succeed()
      return res
    } catch (error) {
      this.progress = undefined
      this.catchFail(error)
    }
  }

  update(text?: string) {
    if (this.ora) this.ora.text = this.format(text)
  }

  succeed() {
    if (this.progress) {
      this.progress.succeed()
      this.update()
    } else {
      this.ora?.succeed(this.format())
    }
  }

  catchFail(e: unknown) {
    this.fail(this.toString(e))
  }

  private fail(text?: string) {
    if (this.progress) {
      this.progress.fail()
      this.error(text)
      this.update()
      this.stackLogDump()
    } else {
      this.ora?.fail()
    }
  }

  protected logNormalizer(e: unknown[]) {
    const error = e.find((e) => e instanceof Error)
    if (error) {
      return [error]
    }

    return e.map((e) => {
      if (typeof e === 'string') {
        return e.trim()
      }

      return e
    })
  }

  protected stackLogDump() {
    for (const e of this.stackLog) {
      const line = e.split('\n').filter((e) => e.startsWith('    at'))
      this.terminal(line.join('\n'))
    }

    this.stackLog = []

    for (const e of this.stackHint) {
      this.terminal(e, 'hint')
    }

    this.stackHint = []
  }

  protected toString(e: unknown): string {
    if (Array.isArray(e)) {
      if (e.length === 0) return 'no message'
      if (e.length === 1) return this._toString(e[0])
      return e.map((e) => this._toString(e)).join('\n')
    }

    return this._toString(e)
  }

  private _toString(e: unknown): string {
    if (e instanceof Error) {
      if (e.stack) {
        this.stackLog.push(e.stack)
      }

      return `${e.name}: ${e.message}`
    }

    if (Array.isArray(e)) {
      return JSON.stringify(e, null, 2)
    }

    if (e instanceof Object) {
      return JSON.stringify(e, null, 2)
    }

    return `${e}`
  }

  private format(text?: string) {
    this.text = text ?? this.text ?? ''
    if (this.progress) {
      const pad = this.text.padEnd(50, ' ')
      return `${pad} ${this.progress.get()}`
    }

    return this.text
  }
}

type LoggerSimpleParam = {
  error: (e: string) => void
  log: (e: string) => void
  warn: (e: string) => void
}

export class LoggerSimple extends Logger {
  logHandler: (e: string) => void
  warnHandler: (e: string) => void
  errorHandler: (e: string) => void

  constructor({log, warn, error}: LoggerSimpleParam) {
    super()
    this.logHandler = log
    this.warnHandler = warn
    this.errorHandler = error
  }

  log(...args: unknown[]) {
    this.logHandler(`${logSymbols.info} ${this.toString(this.logNormalizer(args))}`)
  }

  hint(...args: unknown[]) {
    this.warnHandler(`${HINT} ${this.toString(this.logNormalizer(args))}`)
  }

  warn(...args: unknown[]) {
    this.warnHandler(`${logSymbols.warning} ${this.toString(this.logNormalizer(args))}`)
  }

  error(...args: unknown[]) {
    this.errorHandler(`${logSymbols.error} ${this.toString(this.logNormalizer(args))}`)
  }

  catchError(e: unknown) {
    this.errorHandler(`${logSymbols.error} ${this.toString(e)}`)
  }

  async guard<T>({text, callback}: {callback: Promise<T>; text: string}) {
    try {
      const res = await callback
      this.logHandler(`${logSymbols.success} ${text}`)
      return res
    } catch (error) {
      this.catchFail(error)
      throw error
    }
  }

  async guardProgress<T>({text, callback}: {callback: Promise<T>; text: string}) {
    try {
      const res = await callback
      this.logHandler(`${logSymbols.success} ${text}`)
      return res
    } catch (error) {
      this.catchFail(error)
    }
  }

  update(_text?: string): void {}
  catchFail(e: unknown) {
    this.errorHandler(`${logSymbols.error} ${this.toString(e)}`)
  }

  succeed(text?: string) {
    if (text) this.logHandler(`${logSymbols.success} ${text}`)
  }
}

export class LoggerMute extends Logger {
  log(..._args: unknown[]) {}
  hint(..._args: unknown[]) {}
  warn(..._args: unknown[]) {}
  error(..._args: unknown[]) {}
  catchError(_e: unknown) {}
  async guard<T>({callback}: {callback: Promise<T>}) {
    return callback
  }

  async guardProgress<T>({callback}: {callback: Promise<T>}) {
    return callback
  }

  update(_text?: string) {}
  succeed(_text?: string) {}
  catchFail(_e: unknown) {}
}
