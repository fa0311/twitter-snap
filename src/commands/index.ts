import {Args, Command, Flags} from '@oclif/core'
import os from 'node:os'
import {FFmpegInfrastructure, ThemeNameType, themeList} from 'twitter-snap-core'

import {HandlerType, twitterSnapCookies, twitterSnapGuest, twitterSnapPuppeteer} from '../core/core.js'
import {Logger, LoggerSimple} from '../utils/logger.js'
import {GetTweetApi, getTweetList} from './../utils/types.js'

export default class Default extends Command {
  static args = {
    id: Args.string({description: 'Twitter status id', required: true}),
  }

  static browserProfile = `${os.homedir()}/.cache/twitter-snap/profiles`
  static description = ['Create beautiful Tweet images fast', 'https://github.com/fa0311/twitter-snap'].join('\n')

  static examples = [
    'twitter-snap 1765415187161464972',
    'twitter-snap 1765415187161464972 --session_type browser',
    'twitter-snap 1765415187161464972 --session_type file --cookies_file cookies.json',
    'twitter-snap 44196397 --api getUserTweets --limit 10',
    'twitter-snap 44196397 --api getUserTweets --output "data/{user-screen-name}/{id}.{if-photo:png:mp4}"',
  ]

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
      default: 'RenderBasic',
      description: 'Theme type',
      options: Object.keys(themeList),
    })(),
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

    const client = await logger.guard({text: 'Loading Client'}, getClient)

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

    const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const render = client({id: args.id, limit: flags.limit, type: flags.api}, async (render) => {
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
    } catch {}
  }
}
