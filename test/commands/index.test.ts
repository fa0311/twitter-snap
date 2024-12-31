import {expect} from 'chai'
import * as fs from 'node:fs/promises'

import {access, count, run} from './utils'

describe('Command test', () => {
  before(async () => {
    await fs.rm(`${process.env.HOME}/twitter_snap_temp`, {recursive: true}).catch(() => {})
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm(`${process.env.HOME}/twitter_snap_temp`, {recursive: true}).catch(() => {})
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr, error, result, stdout} = await run('aa', 'temp/aa.png')
    expect(stderr).to.contain('✖️ Unsupported URL')
  })

  it('placeholder_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/placeholder_test/{time-yyyy}/{time-mm}/{time-dd}/{time-hh}-{time-mi}-{time-ss}.png',
    )
    await count('temp/placeholder_test', 1)
    await access('temp/placeholder_test/2021/01/13/08-02-33.png')

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('home_path_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      '~/twitter_snap_temp/absolute_path_test/{count}.png',
    )
    await count(`${process.env.HOME}/twitter_snap_temp/absolute_path_test`, 1)
    await access(`${process.env.HOME}/twitter_snap_temp/absolute_path_test/0.png`)

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })

  it('absolute_path_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      `${process.env.HOME}/twitter_snap_temp/absolute_path_test/{count}.png`,
    )
    await count(`${process.env.HOME}/twitter_snap_temp/absolute_path_test`, 1)
    await access(`${process.env.HOME}/twitter_snap_temp/absolute_path_test/0.png`)

    expect(stderr).to.be.empty
    expect(error).to.be.undefined
    expect(result).to.be.undefined
  })
})
