import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs/promises'

export const access = async (path: string) => {
  await fs
    .access(path)
    .then(() => expect(true).to.equal(true))
    .catch(() => expect(false).to.equal(true))
}

export const count = async (path: string, length: number) => {
  return fs.readdir(path).then((files) => {
    expect(files.length).to.equal(length)
  })
}

export const run = (url: string, output: string, ...args: string[]) => {
  return runCommand([
    url,
    '--simpleLog',
    '--ffmpegAdditonalOption="-preset ultrafast"',
    `-o="${output}"`,
    '--cookiesFile="cookies.json"',
    '--sessionType="file"',
    ...args,
  ])
}
