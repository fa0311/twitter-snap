import * as fs from 'node:fs/promises'
import {runCommand} from '@oclif/test'
import {expect} from 'vitest'

export const access = async (path: string) => {
  await expect(fs.access(path)).resolves.toBeUndefined()
}

export const count = async (path: string, length: number) => {
  await expect(fs.readdir(path)).resolves.toHaveLength(length)
}

export const run = (url: string, output: string, ...args: string[]) => {
  return runCommand([
    url,
    '--simpleLog',
    // the x264 speed preset; other encoders have presets of their own
    ...(output.endsWith('.mp4') ? ['--ffmpegAdditonalOption="-preset ultrafast"'] : []),
    `-o="${output}"`,
    // '--cookiesFile="cookies.json"',
    '--sessionType="guest"',
    ...args,
  ])
}
