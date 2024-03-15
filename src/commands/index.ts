import {Args, Command, Flags} from '@oclif/core'

import os from 'os'
import {twitterSnapCookies, twitterSnapGuest, twitterSnapPuppeteer} from '../core/twitterSnap.js'
import {Logger} from '../utils/logger.js'
import {GetTweetApi, ThemeNameType, getTweetList, themeList} from './../utils/types.js'

const apiFlag = Flags.custom<'getTweetResultByRestId' | keyof GetTweetApi>({
  description: 'API type',
  options: ['getTweetResultByRestId', ...getTweetList],
  default: 'getTweetResultByRestId',
})

const themeNameFlag = Flags.custom<ThemeNameType>({
  description: 'Theme type',
  options: Object.keys(themeList),
  default: 'RenderBasic',
})

const sessionType = Flags.custom<'guest' | 'browser' | 'file'>({
  description: 'Session type',
  default: 'guest',
})

export default class Default extends Command {
  static args = {
    id: Args.string({description: 'Twitter status id', required: true}),
  }

  static description = 'Twitter Snap'
  static examples = ['twitter-snap 1765415187161464972']
  static browser_profile = `${os.homedir()}/.cache/twitter-snap/profiles`

  static flags = {
    api: apiFlag(),
    theme: themeNameFlag(),
    output: Flags.string({char: 'o', description: 'Output file name', default: '{id}.{if-photo:png:mp4}'}),
    cleanup: Flags.boolean({description: 'Cleanup', default: true}),
    max: Flags.integer({description: 'Max count', default: 30}),
    debug: Flags.boolean({description: 'Debug', default: false}),
    session_type: sessionType(),
    cookies_file: Flags.file({description: 'Cookies file', default: 'cookies.json'}),
    browser_profile: Flags.string({description: 'Browser profile', default: this.browser_profile}),
    browser_headless: Flags.boolean({description: 'Browser headless', default: false}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Default)

    const logger = new Logger()

    console.log = flags.debug ? logger.log : (_) => {}

    const getClient = (() => {
      switch (flags.session_type) {
        case 'guest':
          return twitterSnapGuest()
        case 'browser':
          return twitterSnapPuppeteer(flags.browser_headless, flags.browser_profile)
        case 'file':
          return twitterSnapCookies(flags.cookies_file)
      }
    })()

    const client = await logger.wrap('Loading Client', getClient)

    await client({id: args.id, type: flags.api, max: flags.max}, async (render) => {
      const startFinalize = render({
        themeName: flags.theme,
        themeParam: {
          width: 600,
        },
        output: flags.output,
      })

      const finalize = await logger.wrap('Loading Snap', startFinalize)
      const success = finalize({
        cleanup: true,
      })
      await logger.wrap('Finalize', success)
    })
  }
}
