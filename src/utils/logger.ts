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

  constructor() {
    this.raw = console.log
    this.ora = undefined
    this.progress = undefined
    this.text = undefined
  }

  terminal(e: string, type: 'log' | 'warn' | 'error' | 'debug') {
    const prefix = {
      log: clc.blackBright,
      warn: clc.yellowBright,
      error: clc.redBright,
      debug: clc.black,
    }
    if (this.ora?.isSpinning) {
      this.ora!.clear()
    }
    this.raw(prefix[type](`[${type.toUpperCase()}] ${e}`))
    if (this.ora?.isSpinning) {
      this.ora!.start()
    }
  }

  log(e: any) {
    this.terminal(this.toString(e), 'log')
  }

  warn(e: any) {
    this.terminal(this.toString(e), 'warn')
  }

  error(e: any) {
    this.terminal(this.toString(e), 'error')
  }

  debug(e: any) {
    this.terminal(this.toString(e), 'debug')
  }

  private format(text?: string) {
    this.text = text ?? this.text!
    if (this.progress) {
      return `${this.text} ${this.progress.get()}`
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
  }

  toString(e: any) {
    if (e instanceof Error) {
      return e.message
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
