import {runCommand} from '@oclif/test'
import {expect} from 'chai'

import * as fs from 'node:fs/promises'

describe('Command test', () => {
  const videoCommand = ['--simpleLog', '--ffmpegAdditonalOption', '-preset ultrafast']

  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const cmd = ['--simpleLog', '-o', 'temp/aa.png', 'aa']
    const {stdout} = await runCommand(cmd)
    expect(stdout).to.contain('✖ ResponseError: Response returned an error code')
  })

  it('single tweet', async () => {
    const cmd = ['--simpleLog', '-o', 'temp/{id}.png', '1349129669258448897']
    const {stdout} = await runCommand(cmd)
    await fs.access('temp/1349129669258448897.png').then(() => {
      expect(true).to.equal(true)
    })
    expect(stdout).to.contain('✔ Rendering tweet')
  })

  it('get uset tweet', async () => {
    const cmd = ['--simpleLog', '-o', 'temp/user/{id}.png', '44196397', '--api', 'getUserTweets', '--limit', '10']
    const {stdout} = await runCommand(cmd)
    await fs.readdir('temp/user').then((files) => {
      expect(files.length).to.equal(10)
    })
    expect(stdout).to.contain('✔ Rendering tweet')
  })

  it('single video tweet', async () => {
    const cmd = [...videoCommand, '-o', 'temp/{id}.mp4', '1768794901586804837']
    const {stdout} = await runCommand(cmd)
    await fs.access('temp/1768794901586804837.mp4').then(() => {
      expect(true).to.equal(true)
    })
    expect(stdout).to.contain('✔ Rendering tweet')
  })

  it('single video tweet no clean up', async () => {
    const cmd = [...videoCommand, '-o', 'temp/no-cleanup/{id}.mp4', '1768794901586804837', '--noCleanup']
    const {stdout} = await runCommand(cmd)
    await fs.access('temp/no-cleanup/1768794901586804837.png').then(() => {
      expect(true).to.equal(true)
    })
    await fs.access('temp/no-cleanup/1768794901586804837.mp4').then(() => {
      expect(true).to.equal(true)
    })
    await fs.access('temp/no-cleanup/temp-1768794901586804837-0.mp4').then(() => {
      expect(true).to.equal(true)
    })
    expect(stdout).to.contain('✔ Rendering tweet')
  })

  it('output test 1', async () => {
    const cmd = [
      '--simpleLog',
      '-o',
      'temp/{time-tweet-yyyy}/{time-tweet-mm}/{time-tweet-dd}/{time-tweet-hh}-{time-tweet-mi}-{time-tweet-ss}.png',
      '1349129669258448897',
    ]
    const {stdout} = await runCommand(cmd)
    await fs.access('temp/2021/01/13/08-02-33.png')
    expect(stdout).to.contain('✔ Rendering tweet')
  })

  it('input user url', async () => {
    const cmd = ['--simpleLog', '-o', 'temp/{id}.png', 'https://twitter.com/faa0311']
    const {stdout} = await runCommand(cmd)
    expect(stdout).to.contain('✔ Rendering tweet')
  })
})
