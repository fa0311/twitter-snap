import * as fs from 'node:fs/promises'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {access, count, run} from './utils.js'

describe('Command test', () => {
  beforeAll(async () => {
    await fs.rm(`${process.env.HOME}/twitter_snap_temp`, {recursive: true}).catch(() => {})
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  afterAll(async () => {
    await fs.rm(`${process.env.HOME}/twitter_snap_temp`, {recursive: true}).catch(() => {})
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr} = await run('aa', 'temp/aa.png')
    expect(stderr).toContain('Unsupported URL')
  })

  it('placeholder_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      'temp/placeholder_test/{time-yyyy}/{time-mm}/{time-dd}/{time-hh}-{time-mi}-{time-ss}.png',
    )
    // 2021-01-12T23:02:33Z rendered with the local timezone, as the {time-*} placeholders do
    const t = new Date('2021-01-12T23:02:33Z')
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dir = `temp/placeholder_test/${t.getFullYear()}/${pad(t.getMonth() + 1)}/${pad(t.getDate())}`
    await count(dir, 1)
    await access(`${dir}/${pad(t.getHours())}-${pad(t.getMinutes())}-${pad(t.getSeconds())}.png`)

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('home_path_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      '~/twitter_snap_temp/absolute_path_test/{count}.png',
    )
    await count(`${process.env.HOME}/twitter_snap_temp/absolute_path_test`, 1)
    await access(`${process.env.HOME}/twitter_snap_temp/absolute_path_test/0.png`)

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })

  it('absolute_path_test', async () => {
    const {error, result, stderr} = await run(
      'https://x.com/elonmusk/status/1349129669258448897',
      `${process.env.HOME}/twitter_snap_temp/absolute_path_test/{count}.png`,
    )
    await count(`${process.env.HOME}/twitter_snap_temp/absolute_path_test`, 1)
    await access(`${process.env.HOME}/twitter_snap_temp/absolute_path_test/0.png`)

    expect(stderr).toBe('')
    expect(error).toBeUndefined()
    expect(result).toBeUndefined()
  })
})
