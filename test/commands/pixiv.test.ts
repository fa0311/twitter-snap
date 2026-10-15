import * as fs from 'node:fs/promises'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {access, count, run} from './utils.js'

describe('Pixiv test', () => {
  beforeAll(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  afterAll(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr, stdout} = await run('https://www.pixiv.net/artworks/0', 'temp/aa.png')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')

    expect(stderr).toContain('TypeError: Failed to parse URL from undefined')
  })

  it('single_illust_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/124498022',
      'temp/single_illust_to_image/{count}.png',
    )
    await count('temp/single_illust_to_image', 1)
    await access('temp/single_illust_to_image/0.png')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_illust_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/124498022',
      'temp/single_illust_to_video/{count}.mp4',
    )
    await count('temp/single_illust_to_video', 1)
    await access('temp/single_illust_to_video/0.mp4')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_ugoira_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/single_ugoira_to_image/{count}.png',
    )
    await count('temp/single_ugoira_to_image', 1)
    await access('temp/single_ugoira_to_image/0.png')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_ugoira_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/single_ugoira_to_video/{count}.mp4',
    )
    await count('temp/single_ugoira_to_video', 1)
    await access('temp/single_ugoira_to_video/0.mp4')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_ugoira_to_video_no_cleanup', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/single_ugoira_to_video_no_cleanup/{count}.mp4',
      '--noCleanup',
    )
    await count('temp/single_ugoira_to_video_no_cleanup', 5)
    await access('temp/single_ugoira_to_video_no_cleanup/0.mp4')
    await access('temp/single_ugoira_to_video_no_cleanup/temp-0-0.png')
    await access('temp/single_ugoira_to_video_no_cleanup/temp-1-0.mov')
    await access('temp/single_ugoira_to_video_no_cleanup/temp-2-0.txt')
    await count('temp/single_ugoira_to_video_no_cleanup/temp-3-0', 12)

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('media_theme_image', async () => {
    const {error, result, stderr} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/media_theme_image/{count}',
      '--theme',
      'Media',
    )
    await count('temp/media_theme_image', 1)
    await access('temp/media_theme_image/0.mp4')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('media_theme_video', async () => {
    const {error, result, stderr} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/media_theme_video/{count}',
      '--theme',
      'Media',
    )

    await count('temp/media_theme_video', 1)
    await access('temp/media_theme_video/0.mp4')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })
})
