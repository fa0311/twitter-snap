import {expect} from 'chai'
import * as fs from 'node:fs/promises'

import {access, count, run} from './utils'

describe('Pixiv test', () => {
  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr, error, result, stdout} = await run('https://www.pixiv.net/artworks/0', 'temp/aa.png')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')

    expect(stderr).to.contain("✖️ TypeError: Cannot read properties of undefined (reading '0')")
    expect(stderr).to.contain("✖️ Cannot read properties of undefined (reading '0')")
  })

  it('single_illust_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/124498022',
      'temp/single_illust_to_image/{count}.png',
    )
    await count('temp/single_illust_to_image', 1)
    await access('temp/single_illust_to_image/0.png')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_illust_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/124498022',
      'temp/single_illust_to_video/{count}.mp4',
    )
    await count('temp/single_illust_to_video', 1)
    await access('temp/single_illust_to_video/0.mp4')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_ugoira_to_image', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/single_ugoira_to_image/{count}.png',
    )
    await count('temp/single_ugoira_to_image', 1)
    await access('temp/single_ugoira_to_image/0.png')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('single_ugoira_to_video', async () => {
    const {stderr, error, result, stdout} = await run(
      'https://www.pixiv.net/artworks/44298467',
      'temp/single_ugoira_to_video/{count}.mp4',
    )
    await count('temp/single_ugoira_to_video', 1)
    await access('temp/single_ugoira_to_video/0.mp4')

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
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
    await access('temp/single_ugoira_to_video_no_cleanup/temp-1-0.mp4')
    await access('temp/single_ugoira_to_video_no_cleanup/temp-2-0.txt')
    await count('temp/single_ugoira_to_video_no_cleanup/temp-3-0', 12)

    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
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

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
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

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })
})
