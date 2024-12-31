export const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const sleepLoop = async (ms: number, hook: (count: number) => void) => {
  const sleepPeriod = 1000
  for (let i = 0; i < ms / sleepPeriod; i++) {
    hook(Math.round(ms / sleepPeriod) - i)
    await sleep(sleepPeriod)
  }

  await sleep(ms % sleepPeriod)
}
