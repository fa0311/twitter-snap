import {expect} from 'chai'
import * as fs from 'node:fs/promises'

import {run} from './utils'

describe('Command test', () => {
  before(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  after(async () => {
    await fs.rm('temp', {recursive: true}).catch(() => {})
  })

  it('run command', async () => {
    const {stderr, error, result, stdout} = await run('aa', 'temp/aa.png')
    expect(stderr).to.contain('✖️ Unsupported URL')
  })
})
