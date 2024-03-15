import clc from 'cli-color'
import ora from 'ora'

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
  private ora: ora.Ora | undefined
  private progress: Progress | undefined
  private text: string | undefined

  private raw: typeof console.log

  constructor() {
    this.raw = console.log
    this.ora = undefined
    this.progress = undefined
    this.text = undefined
  }

  log(e: any) {
    if (this.ora?.isSpinning) {
      this.ora!.clear()
    }
    this.raw(clc.blackBright(`[LOG] ${e}`))
    if (this.ora?.isSpinning) {
      this.ora!.start()
    }
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
      this.update(text)
    } else {
      this.ora!.fail(this.format(text))
    }
  }

  error(e: any) {
    if (e instanceof Error) {
      this.fail(e.message)
    } else {
      this.fail('Unknown Error')
    }
  }

  async guard<T>({text}: {text: string}, fn: Promise<T>) {
    try {
      this.ora = ora(text).start()
      const res = await fn
      this.succeed(text)
      return res
    } catch (e) {
      this.error(e)
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
      this.error(e)
    }
  }
}
