import fs from 'node:fs/promises'
import {beforeAll, describe, expect, it} from 'vitest'

import {getSnapAppRender} from '../../src/main.js'
import {getSnapAppRenderWithCache} from '../../src/service/core.js'

const access = async (path: string) => {
  await expect(fs.access(path)).resolves.toBeUndefined()
}

describe('Package test', () => {
  beforeAll(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  // afterAll(async () => {
  //   await fs.rm('temp', {recursive: true}).catch(() => {})
  // })

  it('README example', async () => {
    const snap = getSnapAppRender({url: 'https://x.com/elonmusk/status/1349129669258448897'})
    const font = await snap.getFont()
    const session = await snap.login({sessionType: 'guest'})
    const render = await snap.getRender({limit: 1, session})

    await snap.run(render, async (run) => {
      const res = await run({
        width: 1440,
        scale: 2,
        theme: 'RenderOceanBlueColor',
        font,
        output: 'temp/{id}-{count}.{if-type:png:mp4:json:}',
      })
      await res.file.tempCleanup()
    })
    const a = await fs.readFile('temp/1349129669258448897-0.png')
    await fs.writeFile('temp/1349129669258448897-1.png', a)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const b = await fs.readFile('temp/1349129669258448897-0.png')
    expect(a).toEqual(b)

    await access('temp/1349129669258448897-0.png')
  })

  it('README example with cache', async () => {
    const snap = getSnapAppRenderWithCache({})
    await snap({
      url: 'https://x.com/elonmusk/status/1349129669258448897',
      callback: async (run) => {
        const res = await run({
          width: 1440,
          scale: 2,
          theme: 'RenderOceanBlueColor',
          output: 'temp/{id}-{count}.{if-type:png:mp4:json:}',
        })
        await res.file.tempCleanup()
      },
    })

    const a = await fs.readFile('temp/1349129669258448897-0.png')
    await fs.writeFile('temp/1349129669258448897-1.png', a)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const b = await fs.readFile('temp/1349129669258448897-0.png')
    expect(a).toEqual(b)

    await access('temp/1349129669258448897-0.png')
  })
})
