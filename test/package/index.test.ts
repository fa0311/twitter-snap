import fs from 'node:fs/promises'

import {getSnapAppRender} from '../../src/main.js'
import {access} from '../utils.js'

describe('Package test', () => {
  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('README example', async () => {
    const snap = getSnapAppRender({url: 'https://x.com/elonmusk/status/1349129669258448897'})
    const font = await snap.getFont()
    const session = await snap.login({sessionType: 'guest'})
    const render = await snap.getRender({limit: 1, session})

    await snap.run(render, async (run) => {
      const res = await run({
        width: 650,
        theme: 'RenderOceanBlueColor',
        font,
        output: 'temp/{id}.{if-photo:png:mp4}',
      })
      await res.file.tempCleanup()
    })

    await access('temp/1349129669258448897.png')
  })
})
