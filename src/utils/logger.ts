import clc from 'cli-color'
import logSymbols from 'log-symbols'
import ora, {Ora} from 'ora'

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
      case 'loading':
        return ['-', clc.white] as const
      case 'succeed':
        return ['|', clc.green] as const
      case 'fail':
        return ['|', clc.red] as const
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
  protected stackLog: string[] = []
  private ora: Ora | undefined

  private progress: Progress | undefined
  private text: string | undefined

  constructor() {
    this.ora = undefined
    this.progress = undefined
    this.text = undefined
    this.stackLog = []
  }

  catchError(e: any) {
    this.error(this.toString(e))
  }

  catchFail(e: any) {
    this.fail(this.toString(e))
  }

  error(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'error')
    this.stackLogDump()
  }

  async guard<T>({text}: {text: string}, fn: Promise<T>) {
    try {
      this.ora = ora(text).start()
      const res = await fn
      this.succeed(text)
      return res
    } catch (error) {
      this.catchFail(error)
      throw error
    }
  }

  async guardProgress<T>({max, text}: {max: number; text: string}, fn: Promise<T>) {
    try {
      this.ora = ora(text).start()
      this.progress = new Progress(max)
      this.update(text)
      const res = await fn
      this.progress = undefined
      this.succeed(text)
      return res
    } catch (error) {
      this.progress = undefined
      this.catchFail(error)
    }
  }

  log(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'log')
    this.stackLogDump()
  }

  protected logNormalizer(e: any[]) {
    return e.reduce((acc, cur) => {
      const last = acc.at(-1)
      if (last === undefined) {
        return [cur]
      }

      if (typeof last === 'string' && typeof cur === 'string') {
        return [...acc.slice(0, -1), `${last} ${cur}`]
      }

      const data = JSON.stringify(cur)
      if (data.length < 30) {
        return [...acc.slice(0, -1), `${last} ${data}`]
      }

      return [...acc, cur]
    }, [])
  }

  protected stackLogDump() {
    for (const e of this.stackLog) {
      const line = e.split('\n').filter((e) => e.startsWith('    at'))
      this.terminal(line.join('\n').slice(1))
    }

    this.stackLog = []
  }

  succeed(text?: string) {
    if (this.progress) {
      this.progress.succeed()
      this.update(text)
    } else {
      this.ora!.succeed(this.format(text))
    }
  }

  protected toString(e: any): string {
    if (Array.isArray(e)) {
      if (e.length === 0) return 'no message'
      if (e.length === 1) return this._toString(e[0])
      return e.map((e) => this._toString(e)).join('\n')
    }

    return this._toString(e)
  }

  update(text?: string) {
    this.ora!.text = this.format(text)
  }

  warn(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'warn')
    this.stackLogDump()
  }

  private _toString(e: any): string {
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

  private fail(text?: string) {
    if (this.progress) {
      this.progress.fail()
      this.error(text)
      this.update()
    } else {
      this.ora!.fail(this.format(text))
    }

    this.stackLogDump()
  }

  private format(text?: string) {
    this.text = text ?? this.text!
    if (this.progress) {
      const pad = this.text.padEnd(50, ' ')
      return `${pad} ${this.progress.get()}`
    }

    return this.text
  }

  private terminal(e: string, type?: 'error' | 'log' | 'warn') {
    const pattern = {
      error: [clc.redBright, (e: Ora) => e.fail()] as const,
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
}

export class LoggerSimple extends Logger {
  handler: (e: any) => void
  constructor(handler: (e: any) => void, ...args: ConstructorParameters<typeof Logger>) {
    super(...args)
    this.handler = handler
  }

  catchError(e: any) {
    this.handler(`${logSymbols.error} ${this.toString(e)}`)
  }

  catchFail(e: any) {
    this.handler(`${logSymbols.error} ${this.toString(e)}`)
  }

  error(...args: any[]) {
    this.handler(`${logSymbols.error} ${this.toString(this.logNormalizer(args))}`)
  }

  async guard<T>({text}: {text: string}, fn: Promise<T>) {
    try {
      const res = await fn
      this.handler(`${logSymbols.success} ${text}`)
      return res
    } catch (error) {
      this.catchFail(error)
      throw error
    }
  }

  async guardProgress<T>({max, text}: {max: number; text: string}, fn: Promise<T>) {
    try {
      const res = await fn
      this.handler(`${logSymbols.success} ${text}`)
      return res
    } catch (error) {
      this.catchFail(error)
    }
  }

  log(...args: any[]) {
    this.handler(`${logSymbols.info} ${this.toString(this.logNormalizer(args))}`)
  }

  stackLogDump() {
    for (const e of this.stackLog) {
      const line = e.split('\n').filter((e) => e.startsWith('    at'))
      this.handler(line.join('\n').slice(1))
    }

    this.stackLog = []
  }

  succeed(text?: string) {
    if (text) this.handler(`${logSymbols.success} ${text}`)
  }

  update(text?: string | undefined): void {
    // if (text) this.handler(text)
  }

  warn(...args: any[]) {
    this.handler(`${logSymbols.warning} ${this.toString(this.logNormalizer(args))}`)
  }
}
