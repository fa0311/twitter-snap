import {expect} from 'chai'
import * as fs from 'node:fs/promises'

import {access, count, run} from '../utils.js'

describe('Command test', () => {
  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {error: {message} = {}} = await run('aa', 'temp/aa.png')
    expect(message).to.contain('Unsupported URL')
  })

  it('single test tweet', async () => {
    const {stdout} = await run('https://x.com/elonmusk/status/1349129669258448897', 'temp/{id}.png')
    await access('temp/1349129669258448897.png')
    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')
  })

  it('single test tweet to video', async () => {
    const {stdout} = await run('https://x.com/elonmusk/status/1349129669258448897', 'temp/{id}.mp4')
    await access('temp/1349129669258448897.png')
    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')
  })

  it('single video tweet', async () => {
    const {stdout} = await run('https://x.com/SpaceX/status/1768794901586804837', 'temp/{id}.png')
    await access('temp/1768794901586804837.png')
    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')
  })

  it('single video tweet to video', async () => {
    const {stdout} = await run('https://x.com/SpaceX/status/1768794901586804837', 'temp/{id}.mp4')
    await access('temp/1768794901586804837.mp4')
    expect(stdout).to.contain('✔ Initializing API')
    expect(stdout).to.contain('✔ Loading font')
    expect(stdout).to.contain('✔ Logging in')
    expect(stdout).to.contain('✔ Initializing render')
    expect(stdout).to.contain('✔ Rendering')
  })

  it('single video tweet no clean up', async () => {
    const {stdout} = await run(
      'https://x.com/SpaceX/status/1768794901586804837',
      'temp/no-cleanup/{id}.mp4',
      '--noCleanup',
    )
    await count('temp/no-cleanup', 3)
    await access('temp/no-cleanup/1768794901586804837.mp4')
    await access('temp/no-cleanup/temp-0-1768794901586804837.png')
    await access('temp/no-cleanup/temp-1-1768794901586804837.mp4')
  })

  it('placeholder test', async () => {
    const {stdout} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/{time-tweet-yyyy}/{time-tweet-mm}/{time-tweet-dd}/{time-tweet-hh}-{time-tweet-mi}-{time-tweet-ss}.png',
    )
    await fs.access('temp/2021/01/13/08-02-33.png')
  })

  it('get uset tweet', async () => {
    const {stdout} = await run('https://x.com/elonmusk', 'temp/user/{id}.png', '--limit', '10')
    await count('temp/user', 10)
  })
})
