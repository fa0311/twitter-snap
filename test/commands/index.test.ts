import {expect, test} from '@oclif/test'
import * as fs from 'node:fs/promises'

describe('Command test', () => {
  const command = ['Symbol(SINGLE_COMMAND_CLI)', '--simpleLog']
  const videoCommand = [...command, '--ffmpegAdditonalOption', '-preset ultrafast']

  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  test
    .stdout({print: true})
    .command([...command, '-o', 'temp/{id}.png', 'aa'])
    .it('not found tweet', async (ctx) => {
      await fs.access('temp/aa.png').catch((error) => {
        expect(error.code).to.equal('ENOENT')
      })
      expect(ctx.stdout).to.contain('✖ ResponseError: Response returned an error code')
    })

  test
    .stdout({print: true})
    .command([...command, '-o', 'temp/{id}.png', '1349129669258448897'])
    .it('single tweet', async (ctx) => {
      await fs.access('temp/1349129669258448897.png').then(() => {
        expect(true).to.equal(true)
      })
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([...command, '-o', 'temp/user/{id}.png', '44196397', '--api', 'getUserTweets', '--limit', '10'])
    .it('get uset tweet', async (ctx) => {
      await fs.readdir('temp/user').then((files) => {
        expect(files.length).to.equal(10)
      })
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([...videoCommand, '-o', 'temp/{id}.mp4', '1768794901586804837'])
    .it('single video tweet', async (ctx) => {
      await fs.access('temp/1768794901586804837.mp4').then(() => {
        expect(true).to.equal(true)
      })
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([...videoCommand, '-o', 'temp/no-cleanup/{id}.mp4', '1768794901586804837', '--noCleanup'])
    .it('single video tweet no clean up', async (ctx) => {
      await fs.access('temp/no-cleanup/1768794901586804837.png').then(() => {
        expect(true).to.equal(true)
      })
      await fs.access('temp/no-cleanup/1768794901586804837.mp4').then(() => {
        expect(true).to.equal(true)
      })
      await fs.access('temp/no-cleanup/temp-1768794901586804837-0.mp4').then(() => {
        expect(true).to.equal(true)
      })
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([
      ...command,
      '-o',
      'temp/{time-tweet-yyyy}/{time-tweet-mm}/{time-tweet-dd}/{time-tweet-hh}-{time-tweet-mi}-{time-tweet-ss}.png',
      '1349129669258448897',
    ])
    .it('output test 1', async (ctx) => {
      await fs.access('temp/2021/01/13/08-02-33.png')
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([...command, '-o', 'temp/{id}.png', 'https://twitter.com/faa0311'])
    .it('input user url', async (ctx) => {
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })
})
