import {Args, Command, Flags} from '@oclif/core'

import os from 'os'
import {ThemeNameType, themeList} from 'twitter-snap-core'
import {HandlerType, twitterSnapCookies, twitterSnapGuest, twitterSnapPuppeteer} from '../core/core.js'
import {Logger} from '../utils/logger.js'
import {GetTweetApi, getTweetList} from './../utils/types.js'

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
  static examples = [
    'twitter-snap 1765415187161464972',
    'twitter-snap 1765415187161464972 --api getTweetResultByRestId',
  ]

  static browser_profile = `${os.homedir()}/.cache/twitter-snap/profiles`

  static flags = {
    api: apiFlag(),
    theme: themeNameFlag(),
    output: Flags.string({char: 'o', description: 'Output file name', default: '{id}.{if-photo:png:mp4}'}),
    cleanup: Flags.boolean({description: 'Cleanup', default: true}),
    max: Flags.integer({description: 'Max count', default: 30}),
    debug: Flags.boolean({description: 'Debug', default: false}),
    sleep: Flags.integer({description: 'Sleep (ms)', default: 0}),
    session_type: sessionType(),
    cookies_file: Flags.file({description: 'Cookies file', default: 'cookies.json'}),
    browser_profile: Flags.string({description: 'Browser profile', default: this.browser_profile}),
    browser_headless: Flags.boolean({description: 'Browser headless', default: false}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Default)

    const logger = new Logger()

    console.log = flags.debug ? logger.log.bind(logger) : (_) => {}

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

    const client = await logger.guard({text: 'Loading Client'}, getClient)

    const logHandler = async ({type, user, id}: HandlerType) => {
      switch (type) {
        case 'start':
          return logger.update(`Rendering tweet ${user}/${id}`)
        case 'image':
          return logger.update(`Rendering image ${user}/${id}`)
        case 'video':
          return logger.update(`Rendering video ${user}/${id}`)
      }
    }

    const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const render = client({id: args.id, type: flags.api, max: flags.max}, async (render) => {
      try {
        const finalize = await render({
          themeName: flags.theme,
          themeParam: {
            width: 600,
          },
          output: flags.output,
          handler: logHandler,
        })

        await finalize({
          cleanup: true,
        })
        logger.succeed()
      } catch (e) {
        logger.error(e)
      }
      await sleep(flags.sleep)
    })

    await logger.guard({text: 'Rendering tweet', max: flags.max}, render)
  }
}
