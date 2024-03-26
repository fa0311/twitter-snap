import {Args, Command, Flags} from '@oclif/core'
import os from 'node:os'
import {FFmpegInfrastructure, ThemeNameType, themeList} from 'twitter-snap-core'

import {HandlerType, getFonts, twitterSnapCookies, twitterSnapGuest, twitterSnapPuppeteer} from '../core/core.js'
import {Logger, LoggerSimple} from '../utils/logger.js'
import {twitterUrlConvert} from '../utils/url.js'
import {GetTweetApi, getTweetList} from './../utils/types.js'

export default class Default extends Command {
  static args = {
    id: Args.string({description: 'Twitter status id', required: true}),
  }

  static browserProfile = `${os.homedir()}/.cache/twitter-snap/profiles`

  static description = ['Create beautiful Tweet images fast', 'https://github.com/fa0311/twitter-snap'].join('\n')

  static examples = [
    'twitter-snap 1349129669258448897',
    'twitter-snap 1349129669258448897 --theme RenderMakeItAQuote',
    'twitter-snap 1349129669258448897 --session-type browser',
    'twitter-snap 1349129669258448897 --session-type file --cookies-file cookies.json',
    'twitter-snap 44196397 --api getUserTweets --limit 10',
    'twitter-snap 44196397 --api getUserTweets -o "data/{user-screen-name}/{id}.{if-photo:png:mp4}"',
    'twitter-snap https://twitter.com/elonmusk',
    'twitter-snap https://twitter.com/elonmusk/status/1349129669258448897',
    'twitter-snap 44196397 --api getUserTweets -o "{user-screen-name}/{count}.png"',
    'twitter-snap 44196397 --api getUserTweets -o "{time-tweet-yyyy}-{time-tweet-mm}-{time-tweet-dd}/{id}.png"',
  ]

  static fontPath = `${os.homedir()}/.cache/twitter-snap/fonts`

  // eslint-disable-next-line perfectionist/sort-classes
  static flags = {
    api: Flags.custom<'getTweetResultByRestId' | keyof GetTweetApi>({
      default: 'getTweetResultByRestId',
      description: 'API type',
      options: ['getTweetResultByRestId', ...getTweetList],
    })(),
    browserHeadless: Flags.boolean({
      aliases: ['browser-headless'],
      default: false,
      description: 'Browser headless',
    }),
    browserProfile: Flags.string({
      aliases: ['browser-profile'],
      default: this.browserProfile,
      description: 'Browser profile',
    }),
    cookiesFile: Flags.file({
      aliases: ['cookies-file'],
      default: 'cookies.json',
      description: 'Cookies file',
    }),
    debug: Flags.boolean({
      default: false,
      description: 'Debug',
    }),
    ffmpegAdditonalOption: Flags.string({
      aliases: ['ffmpeg-additonal-option'],
      description: 'FFmpeg additonal option',
    }),
    ffmpegPath: Flags.string({
      aliases: ['ffmpeg-path'],
      default: 'ffmpeg',
      description: 'FFmpeg path',
    }),
    ffprobePath: Flags.string({
      aliases: ['ffprobe-path'],
      default: 'ffprobe',
      description: 'FFprobe path',
    }),
    fontPath: Flags.string({
      aliases: ['font-path'],
      default: this.fontPath,
      description: 'Font path',
    }),
    limit: Flags.integer({
      default: 30,
      description: 'Limit count',
    }),
    noCleanup: Flags.boolean({
      aliases: ['no-cleanup'],
      default: false,
      description: 'Cleanup',
    }),
    output: Flags.string({
      char: 'o',
      default: '{id}.{if-photo:png:mp4}',
      description: 'Output file name',
    }),
    sessionType: Flags.custom<'browser' | 'file' | 'guest'>({
      aliases: ['session-type'],
      default: 'guest',
      description: 'Session type',
    })(),
    simpleLog: Flags.boolean({
      aliases: ['simple-log'],
      default: false,
      description: 'Simple log',
    }),
    sleep: Flags.integer({
      default: 0,
      description: 'Sleep (ms)',
    }),
    theme: Flags.custom<ThemeNameType>({
      default: 'RenderOceanBlueColor',
      description: 'Theme type',
      options: Object.keys(themeList),
    })(),
  }

  async main(): Promise<void> {
    const {args, flags} = await this.parse(Default)
    const logger = flags.simpleLog ? new LoggerSimple(this.log.bind(this)) : new Logger()

    console.log = flags.debug ? logger.log.bind(logger) : (_) => {}
    console.debug = flags.debug ? logger.log.bind(logger) : (_) => {}
    console.warn = logger.warn.bind(logger)
    console.error = logger.error.bind(logger)

    const getClient = (() => {
      switch (flags.sessionType) {
        case 'guest':
          return twitterSnapGuest()
        case 'browser':
          return twitterSnapPuppeteer(flags.browserHeadless, flags.browserProfile)
        case 'file':
          return twitterSnapCookies(flags.cookiesFile)
      }
    })()

    const [client, api] = await logger.guard({text: 'Loading client'}, getClient)

    const [id, type] = await (() => {
      if (args.id.startsWith('http')) {
        const convert = twitterUrlConvert({url: args.id})
        if (typeof convert === 'function') {
          return logger.guard({text: 'Get user id'}, convert(api))
        }

        if (typeof convert === 'object') {
          return convert
        }
      }

      return [args.id, flags.api] as const
    })()

    const logHandler = async ({id, type, user}: HandlerType) => {
      switch (type) {
        case 'start':
          return logger.update(`Rendering tweet ${user}/${id}`)
        case 'image':
          return logger.update(`Rendering image ${user}/${id}`)
        case 'video':
          return logger.update(`Rendering video ${user}/${id}`)
      }
    }

    const fonts = await logger.guard({text: 'Loading fonts'}, getFonts(flags.fontPath))

    const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const render = client({id, limit: flags.limit, type}, async (render) => {
      try {
        const finalize = await render({
          handler: logHandler,
          output: flags.output,
          themeName: flags.theme,
          themeParam: {
            ffmpeg: new FFmpegInfrastructure({
              ffmpegPath: flags.ffmpegPath,
              ffprobePath: flags.ffprobePath,
            }),
            ffmpegAdditonalOption: flags.ffmpegAdditonalOption?.split(' ') ?? [],
            fonts,
            width: 600,
          },
        })

        await finalize({
          cleanup: !flags.noCleanup,
        })
        logger.succeed()
      } catch (error) {
        logger.catchFail(error)
      }

      await sleep(flags.sleep)
    })

    await logger.guardProgress({max: flags.limit, text: 'Rendering tweet'}, render)
  }

  async run(): Promise<void> {
    try {
      await this.main()
    } catch (error) {
      if (typeof error === 'string') {
        this.error(error)
      } else if (error instanceof Error) {
        this.error(error.message)
      } else {
        this.error('Unknown error')
      }
    }
  }
}
