import {expect} from 'chai'
import fs from 'node:fs/promises'

import {getSnapAppRender} from '../../src/main.js'
const access = async (path: string) => {
  await fs
    .access(path)
    .then(() => expect(true).to.equal(true))
    .catch(() => expect(false).to.equal(true))
}

describe('Package test', () => {
  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  // after(async () => {
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
    expect(a).to.deep.equal(b)

    await access('temp/1349129669258448897-0.png')
  })
})
