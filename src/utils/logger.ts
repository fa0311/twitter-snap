import ora from 'ora'

export class Logger {
  ora: ora.Ora | undefined
  raw: typeof console.log

  constructor() {
    this.raw = console.log
    this.ora = undefined
  }

  log(e: any) {
    this.ora?.clear()
    this.raw(e)
    this.ora?.start()
  }

  async wrap<T>(text: string, fn: Promise<T>) {
    try {
      this.ora = ora(text).start()
      const res = await fn
      this.ora?.succeed()
      return res
    } catch (e) {
      this.ora?.fail()
      throw e
    }
  }
}
