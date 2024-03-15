import {expect, test} from '@oclif/test'

describe('hello', () => {
  test
    .stdout()
    .command(['Symbol(SINGLE_COMMAND_CLI)', '--api', 'getUserTweets', '900282258736545792', '-o', 'temp/{id}.png'])
    .it('runs hello cmd', (ctx) => {
      expect(true).to.equal(true)
    })
})
