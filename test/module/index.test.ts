import {expect} from 'chai'
import fs from 'node:fs/promises'

import {getSnapAppRender} from '../../src/main.js'
import {LoggerSimple} from '../../src/utils/logger.js'

const mock = () => {
  let output = ''
  return {
    put(...args: any[]) {
      output += `${args}\n`
    },
    get: () => output,
  }
}

const getSnap = (url: string) => {
  const snap = getSnapAppRender({url})
  const font = snap.getFont()
  const render = snap.login({sessionType: 'guest'}).then((session) => snap.getRender({limit: 1, session}))
  const data = render.then((render) => render.data.next()).then((next) => next.value)
  console.debug = () => {}

  return async (name: string, theme: string) => {
    const {error, log, warn} = {error: mock(), log: mock(), warn: mock()}
    const logger = new LoggerSimple({
      error: error.put.bind(error),
      log: log.put.bind(log),
      warn: warn.put.bind(warn),
    })
    const r = await render
    const res = await r.next({
      data: await data,
      font: await font,
      logger,
      output: name,
      scale: 1,
      theme,
      width: 650,
      ffmpegAdditonalOption: ['-preset', 'ultrafast'],
    })

    await res.file.tempCleanup()

    return {error: error.get(), log: log.get(), warn: warn.get()}
  }
}

describe('hint test', () => {
  before(async () => {
    await fs.rm('stdout_is_not_supported_in_this_theme.mp4').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.png').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.jpg').catch(() => {})

    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm('stdout_is_not_supported_in_this_theme.mp4').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.png').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.jpg').catch(() => {})

    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  const imageSnap = getSnap('https://x.com/elonmusk/status/1349129669258448897')
  const videoSnap = getSnap('https://x.com/SpaceX/status/1768794901586804837')

  it('replace_format_image_with_png', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.png', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.be.empty
  })

  it('replace_format_image_with_jpg', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.jpg', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Unsupported format: jpg, output as png')
  })

  it('replace_format_image_with_mp4', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.mp4', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.empty
  })

  it('replace_format_image_without', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Output as png')
  })

  it('replace_format_video_with_stdout', async () => {
    const {error, log, warn} = await imageSnap('{stdout}', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Output as png')
  })

  it('replace_format_video_with_png', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa.png', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.be.empty
  })

  it('replace_format_video_with_jpg', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa.jpg', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Unsupported format: jpg, output as png')
  })

  it('replace_format_video_with_mp4', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa.mp4', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.be.empty
  })

  it('replace_format_video_without', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Output as mp4')
  })

  it('replace_format_video_with_stdout', async () => {
    const {error, log, warn} = await videoSnap('{stdout}', 'RenderOceanBlueColor')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Output as mp4')
  })

  it('replace_format_json_with_json', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.json', 'Json')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.be.empty
  })

  it('replace_format_json_without', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa', 'Json')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Output as json')
  })

  it

  it('replace_format_json_with_pdf', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.pdf', 'Json')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.contain('💡 Unsupported format: pdf, output as json')
  })

  it('replace_format_json_with_stdout', async () => {
    const {error, log, warn} = await imageSnap('{stdout}', 'Json')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.empty
  })

  it('replace_format_other_with_png', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.png', 'Media')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.to.contain('💡 Extension is ignored')
  })

  it('replace_format_other_without', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa', 'Media')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.be.empty
  })

  it('replace_format_other_with_stdout', async () => {
    const {error, log, warn} = await imageSnap('{stdout}', 'Media')
    expect(error).to.be.empty
    expect(log).be.empty
    expect(warn).to.be.empty
  })
})
