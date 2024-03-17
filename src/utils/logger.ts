import clc from 'cli-color'
import ora, {Ora} from 'ora'

class Progress {
  max: number
  index: number
  value: ('loading' | 'succeed' | 'fail')[]
  constructor(max: number) {
    this.max = max
    this.index = 0
    if (this.max > 100) {
      this.value = Array(100).fill('loading')
    } else {
      this.value = Array(this.max).fill('loading')
    }
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

  getIndex() {
    if (this.max > 100) {
      return Math.floor((this.index / this.max) * 100)
    } else {
      return this.index
    }
  }

  succeed() {
    if (this.value[this.getIndex()] === 'loading') {
      this.value[this.getIndex()] = 'succeed'
    }
    this.index++
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
}

export class Logger {
  private ora: Ora | undefined
  private progress: Progress | undefined
  private text: string | undefined

  private raw: typeof console.log
  private stack_log: string[] = []

  constructor() {
    this.raw = console.log
    this.ora = undefined
    this.progress = undefined
    this.text = undefined
    this.stack_log = []
  }

  terminal(e: string, type?: 'log' | 'warn' | 'error' | 'debug') {
    const prefix = {
      log: clc.blackBright,
      warn: clc.yellowBright,
      error: clc.redBright,
      debug: clc.black,
    }
    if (this.ora?.isSpinning) {
      this.ora!.clear()
    }
    if (type === undefined) {
      this.raw(prefix['log'](`${e}`))
    } else {
      this.raw(prefix[type](`[${type.toUpperCase()}] ${e}`))
    }
    if (this.ora?.isSpinning) {
      this.ora!.start()
    }
  }

  private stack_log_dump() {
    this.stack_log.forEach((e) => {
      this.terminal(e.split('\n').slice(1).join('\n'))
    })
    this.stack_log = []
  }

  log(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'log')
    this.stack_log_dump()
  }

  warn(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'warn')
    this.stack_log_dump()
  }

  error(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'error')
    this.stack_log_dump()
  }

  debug(...args: any[]) {
    this.terminal(this.toString(this.logNormalizer(args)), 'debug')
    this.stack_log_dump()
  }

  private format(text?: string) {
    this.text = text ?? this.text!
    if (this.progress) {
      const pad = this.text.padEnd(50, ' ')
      return `${pad} ${this.progress.get()}`
    } else {
      return this.text
    }
  }

  update(text?: string) {
    this.ora!.text = this.format(text)
  }

  succeed(text?: string) {
    if (this.progress) {
      this.progress.succeed()
      this.update(text)
    } else {
      this.ora!.succeed(this.format(text))
    }
  }

  fail(text?: string) {
    if (this.progress) {
      this.progress.fail()
      this.error(text)
      this.update()
    } else {
      this.ora!.fail(this.format(text))
    }
    this.stack_log_dump()
  }

  private logNormalizer(e: any[]) {
    return e.reduce((acc, cur) => {
      const last = acc[acc.length - 1]
      if (last === undefined) {
        return [cur]
      } else if (typeof last == 'string' && typeof cur == 'string') {
        return [...acc.slice(0, -1), `${last} ${cur}`]
      } else {
        const data = JSON.stringify(cur)
        if (data.length < 30) {
          return [...acc.slice(0, -1), `${last} ${data}`]
        }
        return [...acc, cur]
      }
    }, [])
  }

  toString(e: any): string {
    if (Array.isArray(e)) {
      if (e.length === 0) return 'no message'
      if (e.length === 1) return this._toString(e[0])
    }
    return this._toString(e)
  }

  _toString(e: any): string {
    if (e instanceof Error) {
      if (e.stack) {
        this.stack_log.push(e.stack)
      }
      return `${e.name}: ${e.message}`
    } else if (Array.isArray(e)) {
      return JSON.stringify(e, null, 2)
    } else if (e instanceof Object) {
      return JSON.stringify(e, null, 2)
    } else {
      return `${e}`
    }
  }

  catch(e: any) {
    this.fail(this.toString(e))
  }

  async guard<T>({text}: {text: string}, fn: Promise<T>) {
    try {
      this.ora = ora(text).start()
      const res = await fn
      this.succeed(text)
      return res
    } catch (e) {
      this.catch(e)
      throw e
    }
  }

  async guardProgress<T>({text, max}: {text: string; max: number}, fn: Promise<T>) {
    try {
      this.ora = ora(text).start()
      this.progress = new Progress(max)
      this.update(text)
      const res = await fn
      this.progress = undefined
      this.succeed(text)
      return res
    } catch (e) {
      this.progress = undefined
      this.catch(e)
    }
  }
}
