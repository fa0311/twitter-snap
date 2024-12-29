import clc from 'cli-color'
import logSymbols from 'log-symbols'
import ora, {Ora} from 'ora'

const HINT = '💡'

class Progress {
  index: number
  max: number
  value: ('fail' | 'loading' | 'succeed')[]
  constructor(max: number) {
    this.max = max
    this.index = 0
    this.value = Array.from({length: this.max > 100 ? 100 : this.max}, () => 'loading')
  }

  color(value: Progress['value'][0]) {
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

export class Logger {
  protected stackHint: string[] = []
  protected stackLog: string[] = []
  private ora: Ora | undefined

  private progress: Progress | undefined
  private text: string | undefined

  constructor() {
    this.ora = undefined
    this.progress = undefined
    this.text = undefined
    this.stackLog = []
    this.stackHint = []
  }

  log(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'log')
    this.stackLogDump()
  }

  hint(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'hint')
    this.stackLogDump()
  }

  warn(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'warn')
    this.stackLogDump()
  }

  error(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'error')
    this.stackLogDump()
  }

  catchError(e: any) {
    this.error(this.toString(e))
  }

  private terminal(e: string, type?: 'error' | 'hint' | 'log' | 'warn') {
    const pattern = {
      error: [clc.redBright, (e: Ora) => e.fail()] as const,
      hint: [clc.cyanBright, (e: Ora) => e.stopAndPersist({symbol: HINT})] as const,
      log: [clc.blackBright, (e: Ora) => e.info()] as const,
      undefined: [clc.blackBright, (e: Ora) => e.stopAndPersist({symbol: ''})] as const,
      warn: [clc.yellowBright, (e: Ora) => e.warn()] as const,
    }
    if (this.ora?.isSpinning) {
      this.ora!.clear()
    }

    const pat = pattern[type ?? 'undefined']
    const text = type ? `[${type.toUpperCase()}] ${e}` : e
    const o = pat[1](ora(pat[0](text)))

    if (this.ora?.isSpinning) {
      this.ora!.start()
    }
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
    this.ora!.text = this.format(text)
  }

  succeed() {
    if (this.progress) {
      this.progress.succeed()
      this.update()
    } else {
      this.ora!.succeed(this.format())
    }
  }

  catchFail(e: any) {
    this.fail(this.toString(e))
  }

  private fail(text?: string) {
    if (this.progress) {
      this.progress.fail()
      this.error(text)
      this.update()
      this.stackLogDump()
    } else {
      this.ora!.fail()
    }
  }

  protected logNormalizer(e: any[]) {
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

  protected toString(e: any): string {
    if (Array.isArray(e)) {
      if (e.length === 0) return 'no message'
      if (e.length === 1) return this._toString(e[0])
      return e.map((e) => this._toString(e)).join('\n')
    }

    return this._toString(e)
  }

  private _toString(e: any): string {
    if (e instanceof Error) {
      if (e.stack) {
        this.stackLog.push(e.stack)
      }

      if (e.message === "No variant of TweetUnion exists with 'typename=undefined'") {
        this.stackHint.push('This tweet contains sensitive content. Please login using --session-type')
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
    this.text = text ?? this.text!
    if (this.progress) {
      const pad = this.text.padEnd(50, ' ')
      return `${pad} ${this.progress.get()}`
    }

    return this.text
  }
}
type LoggerSimpleParam = {
  error: (e: any) => void
  log: (e: any) => void
  warn: (e: any) => void
}

export class LoggerSimple extends Logger {
  logHandler: (e: any) => void
  warnHandler: (e: any) => void
  errorHandler: (e: any) => void

  constructor({log, warn, error}: LoggerSimpleParam, ...args: ConstructorParameters<typeof Logger>) {
    super(...args)
    this.logHandler = log
    this.warnHandler = warn
    this.errorHandler = error
  }

  log(...args: any[]) {
    this.logHandler(`${logSymbols.info} ${this.toString(this.logNormalizer(args))}`)
  }

  hint(...args: any[]) {
    this.warnHandler(`${HINT} ${this.toString(this.logNormalizer(args))}`)
  }

  warn(...args: any[]) {
    this.warnHandler(`${logSymbols.warning} ${this.toString(this.logNormalizer(args))}`)
  }

  error(...args: any[]) {
    this.errorHandler(`${logSymbols.error} ${this.toString(this.logNormalizer(args))}`)
  }

  catchError(e: any) {
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

  update(text?: string | undefined): void {}
  catchFail(e: any) {
    this.errorHandler(`${logSymbols.error} ${this.toString(e)}`)
  }

  succeed(text?: string) {
    if (text) this.logHandler(`${logSymbols.success} ${text}`)
  }
}

export class LoggerMute extends Logger {
  log(...args: any[]) {}
  hint(...args: any[]) {}
  warn(...args: any[]) {}
  error(...args: any[]) {}
  catchError(e: any) {}
  async guard<T>({callback}: {callback: Promise<T>}) {
    return callback
  }

  async guardProgress<T>({callback}: {callback: Promise<T>}) {
    return callback
  }

  update(text?: string) {}
  succeed(text?: string) {}
  catchFail(e: any) {}
}
