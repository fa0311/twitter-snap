import * as fs from 'node:fs/promises'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {access, count, run} from './utils.js'

describe('Twitter test', () => {
  beforeAll(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  afterAll(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr, stdout} = await run('https://x.com/elonmusk/status/114514', 'temp/aa.png')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')

    expect(stderr).toContain('Error: No data')
  })

  it('single_text_tweet_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/single_text_tweet_to_image/{count}.png',
    )
    await count('temp/single_text_tweet_to_image', 1)
    await access('temp/single_text_tweet_to_image/0.png')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('poll_tweet_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/elonmusk/status/1604617643973124097',
      'temp/poll_tweet_to_image/{count}.png',
    )
    await count('temp/poll_tweet_to_image', 1)
    await access('temp/poll_tweet_to_image/0.png')

    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('xreference_theme_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/elonmusk/status/1604617643973124097',
      'temp/xreference_theme_image/{count}.png',
      '--theme',
      'RenderXReference',
    )
    await count('temp/xreference_theme_image', 1)
    await access('temp/xreference_theme_image/0.png')

    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_text_tweet_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/single_text_tweet_to_video/{count}.mp4',
    )
    await count('temp/single_text_tweet_to_video', 1)
    await access('temp/single_text_tweet_to_video/0.mp4')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_video_tweet_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/single_video_tweet_to_image/{count}.png',
    )
    await count('temp/single_video_tweet_to_image', 1)
    await access('temp/single_video_tweet_to_image/0.png')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_video_tweet_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/single_video_tweet_to_video/{count}.mp4',
    )
    await count('temp/single_video_tweet_to_video', 1)
    await access('temp/single_video_tweet_to_video/0.mp4')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('single_video_tweet_to_video_no_cleanup', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/single_video_tweet_to_video_no_cleanup/{count}.mp4',
      '--noCleanup',
    )
    // the rendered image, the rounded-corner mask of the video frame, the downloaded video, the output
    await count('temp/single_video_tweet_to_video_no_cleanup', 4)
    await access('temp/single_video_tweet_to_video_no_cleanup/0.mp4')
    await access('temp/single_video_tweet_to_video_no_cleanup/temp-0-0.png')
    await access('temp/single_video_tweet_to_video_no_cleanup/temp-1-0.png')
    await access('temp/single_video_tweet_to_video_no_cleanup/temp-2-0.mp4')

    expect(stdout).toContain('Initializing API')
    expect(stdout).toContain('Loading font')
    expect(stdout).toContain('Logging in')
    expect(stdout).toContain('Initializing render')
    expect(stdout).toContain('Rendering')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  // it('multiple_tweets_to_image', async () => {
  //   const {error, result, stderr} = await run(
  //     'https://x.com/elonmusk',
  //     'temp/multiple_tweets_to_image/{count}.png',
  //     '--limit',
  //     '10',
  //   )
  //   await count('temp/multiple_tweets_to_image', 10)

  //   expect(stderr).toBe('')
  //   expect(error).toBeUndefined()
  //   expect(result).toBeUndefined()
  // })

  it('media_theme_image', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/SpaceX/status/1871085036168257745',
      'temp/media_theme_image/{count}',
      '--theme',
      'Media',
    )
    await count('temp/media_theme_image', 3)
    await access('temp/media_theme_image/0.jpg')
    await access('temp/media_theme_image/1.jpg')
    await access('temp/media_theme_image/2.jpg')

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('media_theme_video', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
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

  it('json_theme', async () => {
    const {stdout, error, result, stderr} = await run(
      'https://x.com/SpaceX/status/1871085036168257745',
      'temp/json_theme/{count}.json',
      '--theme',
      'Json',
    )
    await count('temp/json_theme', 1)
    await access('temp/json_theme/0.json')
    expect(stdout).not.toContain('SpaceX')
    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('json_theme_stdout', async () => {
    const {stdout, error, result, stderr} = await run(
      'https://x.com/SpaceX/status/1871085036168257745',
      '{stdout}',
      '--theme',
      'Json',
    )
    expect(stdout).toContain('SpaceX')
    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })
})
