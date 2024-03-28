export const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sleepPeriod = 1000

export const sleepLoop = async (ms: number, hook: (count: number) => void) => {
  for (let i = 0; i < ms / sleepPeriod; i++) {
    hook(Math.round(ms / sleepPeriod) - i)
    await sleep(sleepPeriod)
  }

  await sleep(ms % sleepPeriod)
}
