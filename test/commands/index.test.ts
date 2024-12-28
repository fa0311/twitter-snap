import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs/promises'

const access = async (path: string) => {
  await fs
    .access(path)
    .then(() => expect(true).to.equal(true))
    .catch(() => expect(false).to.equal(true))
}

const count = async (path: string, length: number) => {
  return fs.readdir(path).then((files) => {
    expect(files.length).to.equal(length)
  })
}

const run = (url: string, output: string, ...args: string[]) => {
  return runCommand([
    url,
    '--simpleLog',
    '--ffmpegAdditonalOption="-preset ultrafast"',
    `-o="${output}"`,
    // '--cookiesFile="cookies.json"',
    '--sessionType="guest"',
    ...args,
  ])
}

describe('Command test', () => {
  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr, error, result, stdout} = await run('aa', 'temp/aa.png')
    expect(stderr).to.contain('✖️ Unsupported URL')
  })

  it('run command', async () => {
    const {stderr, error, result, stdout} = await run('https://x.com/elonmusk/status/114514', 'temp/aa.png')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')

    expect(stderr).to.contain('✖️ Error: No data')
  })

  it('single_text_tweet_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/single_text_tweet_to_image/{count}.png',
    )
    await count('temp/single_text_tweet_to_image', 1)
    await access('temp/single_text_tweet_to_image/0.png')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_text_tweet_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/single_text_tweet_to_video/{count}.mp4',
    )
    await count('temp/single_text_tweet_to_video', 1)
    await access('temp/single_text_tweet_to_video/0.mp4')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_video_tweet_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/single_video_tweet_to_image/{count}.png',
    )
    await count('temp/single_video_tweet_to_image', 1)
    await access('temp/single_video_tweet_to_image/0.png')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_video_tweet_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/single_video_tweet_to_video/{count}.mp4',
    )
    await count('temp/single_video_tweet_to_video', 1)
    await access('temp/single_video_tweet_to_video/0.mp4')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_video_tweet_to_video_no_cleanup', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/single_video_tweet_to_video_no_cleanup/{count}.mp4',
      '--noCleanup',
    )
    await count('temp/single_video_tweet_to_video_no_cleanup', 3)
    await access('temp/single_video_tweet_to_video_no_cleanup/0.mp4')
    await access('temp/single_video_tweet_to_video_no_cleanup/temp-0-0.png')
    await access('temp/single_video_tweet_to_video_no_cleanup/temp-1-0.mp4')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('placeholder_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/placeholder_test/{time-tweet-yyyy}/{time-tweet-mm}/{time-tweet-dd}/{time-tweet-hh}-{time-tweet-mi}-{time-tweet-ss}.png',
    )
    await count('temp/placeholder_test', 1)
    await access('temp/placeholder_test/2021/01/13/08-02-33.png')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  // it('multiple_tweets_to_image', async () => {
  //   const {error, result, stderr} = await run(
  //     'https://x.com/elonmusk',
  //     'temp/multiple_tweets_to_image/{count}.png',
  //     '--limit',
  //     '10',
  //   )
  //   await count('temp/multiple_tweets_to_image', 10)

  //   expect(stderr).to.be.empty
  //   expect(error).to.be.undefined
  //   expect(result).to.be.undefined
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

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
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

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
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
    expect(stdout).not.to.contain('SpaceX')
    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('json_theme_stdout', async () => {
    const {stdout, error, result, stderr} = await run(
      'https://x.com/SpaceX/status/1871085036168257745',
      '{stdout}',
      '--theme',
      'Json',
    )
    expect(stdout).to.contain('SpaceX')
    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })
})
