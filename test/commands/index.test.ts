import {expect, test} from '@oclif/test'
describe('Command test', () => {
  const command = ['Symbol(SINGLE_COMMAND_CLI)', '--simpleLog']
  const image = ['-o', 'temp/{id}.png']
  const video = ['-o', 'temp/{id}.mp4']

  test
    .stdout({print: true})
    .command([...command, ...image, 'aa'])
    .it('not found tweet', (ctx) => {
      expect(ctx.stdout).to.contain('✖ ResponseError: Response returned an error code')
    })

  test
    .stdout({print: true})
    .command([...command, ...image, '1349129669258448897'])
    .it('single tweet', (ctx) => {
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([...command, ...image, '44196397', '--api', 'getUserTweets', '--limit', '10'])
    .it('getUserTweets', (ctx) => {
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })

  test
    .stdout({print: true})
    .command([...command, ...video, '1768794901586804837'])
    .it('single video tweet', (ctx) => {
      expect(ctx.stdout).to.contain('✔ Rendering tweet')
    })
})
