import fs from 'node:fs/promises'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import type {SnapRenderItem, SnapRenderStream} from '../../src/app.js'
import {getSnapAppRender} from '../../src/main.js'
import {LoggerSimple} from '../../src/utils/logger.js'

const mock = () => {
  let output = ''
  return {
    put(message: string) {
      output += `${message}\n`
    },
    get: () => output,
  }
}

const first = async (render: SnapRenderStream): Promise<SnapRenderItem> => {
  for await (const item of render) return item
  throw new Error('No data')
}

const getSnap = (url: string) => {
  const snap = getSnapAppRender({url})
  const font = snap.getFont()
  const item = snap
    .login({sessionType: 'guest'})
    .then((session) => snap.getRender({limit: 1, session}))
    .then((render) => first(render))
  console.debug = () => {}

  return async (name: string, theme: string) => {
    const {error, log, warn} = {error: mock(), log: mock(), warn: mock()}
    const logger = new LoggerSimple({
      error: error.put.bind(error),
      log: log.put.bind(log),
      warn: warn.put.bind(warn),
    })
    const res = await (await item).next({
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
  beforeAll(async () => {
    await fs.rm('stdout_is_not_supported_in_this_theme.mp4').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.png').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.jpg').catch(() => {})

    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  afterAll(async () => {
    await fs.rm('stdout_is_not_supported_in_this_theme.mp4').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.png').catch(() => {})
    await fs.rm('stdout_is_not_supported_in_this_theme.jpg').catch(() => {})

    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  const imageSnap = getSnap('https://x.com/elonmusk/status/1349129669258448897')
  const videoSnap = getSnap('https://x.com/SpaceX/status/1768794901586804837')

  it('replace_format_image_with_png', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.png', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_image_with_jpg', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.jpg', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Unsupported format: jpg, output as png')
  })

  it('replace_format_image_with_mp4', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.mp4', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_image_without', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Output as png')
  })

  it('replace_format_video_with_stdout', async () => {
    const {error, log, warn} = await imageSnap('{stdout}', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Output as png')
  })

  it('replace_format_video_with_png', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa.png', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_video_with_jpg', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa.jpg', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Unsupported format: jpg, output as png')
  })

  it('replace_format_video_with_mp4', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa.mp4', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_video_without', async () => {
    const {error, log, warn} = await videoSnap('temp/aaa', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Output as mp4')
  })

  it('replace_format_video_with_stdout', async () => {
    const {error, log, warn} = await videoSnap('{stdout}', 'RenderOceanBlueColor')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Output as mp4')
  })

  it('replace_format_json_with_json', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.json', 'Json')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_json_without', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa', 'Json')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Output as json')
  })

  it('replace_format_json_with_pdf', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.pdf', 'Json')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Unsupported format: pdf, output as json')
  })

  it('replace_format_json_with_stdout', async () => {
    const {error, log, warn} = await imageSnap('{stdout}', 'Json')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_other_with_png', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa.png', 'Media')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toContain('💡 Extension is ignored')
  })

  it('replace_format_other_without', async () => {
    const {error, log, warn} = await imageSnap('temp/aaa', 'Media')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })

  it('replace_format_other_with_stdout', async () => {
    const {error, log, warn} = await imageSnap('{stdout}', 'Media')
    expect(error).toBe('')
    expect(log).toBe('')
    expect(warn).toBe('')
  })
})
