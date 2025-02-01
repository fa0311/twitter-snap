import {Args, Command, Flags} from '@oclif/core'
import {stdout} from 'node:process'

import {ThemeNameType, themeList} from '../config.js'
import {getSnapAppRender} from '../service/core.js'
import {Logger, LoggerSimple} from '../utils/logger.js'
import {sleepLoop} from '../utils/sleep.js'

export abstract class DefaultCommand extends Command {
  public getDefault() {
    return this.parse(Default)
  }
}
export type DefaultCommandType = Awaited<ReturnType<typeof DefaultCommand.prototype.getDefault>>

const sessionType = ['browser', 'file', 'guest'] as const
type SessionType = (typeof sessionType)[number]

export default class Default extends Command {
  static args = {
    url: Args.string({description: 'Twitter url', required: true}),
  }

  static description = ['Create beautiful Tweet images fast', 'https://github.com/fa0311/twitter-snap'].join('\n')

  static examples = [
    {
      command: 'twitter-snap https://twitter.com/elonmusk/status/1349129669258448897',
      description: 'Create a snap from tweet id with minimal commands.',
    },
    {
      command: 'twitter-snap --interactive',
      description: 'Enable interactive mode.',
    },
  ]

  static flags = {
    browserHeadless: Flags.boolean({
      aliases: ['browser-headless'],
      default: false,
      description: 'Browser headless',
    }),
    browserProfile: Flags.string({
      aliases: ['browser-profile'],
      default: `~/.cache/twitter-snap/profiles`,
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
    interactive: Flags.boolean({
      default: false,
      description: 'Enable interactive mode',
      aliases: ['i'],
    }),
    ffmpegAdditonalOption: Flags.string({
      aliases: ['ffmpeg-additonal-option'],
      description: 'FFmpeg additonal option',
    }),
    ffmpegTimeout: Flags.integer({
      default: -1,
      description: 'FFmpeg timeout',
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
      default: '~/.cache/twitter-snap/fonts',
      description: 'Font path',
    }),
    limit: Flags.integer({
      default: 20,
      description: 'Limit count',
    }),
    noCleanup: Flags.boolean({
      aliases: ['no-cleanup'],
      default: false,
      description: 'Cleanup',
    }),
    output: Flags.string({
      char: 'o',
      default: '{id}-{count}.{if-type:png:mp4:json:}',
      description: 'Output file name',
    }),
    sessionType: Flags.custom<SessionType>({
      aliases: ['session-type'],
      default: 'guest',
      description: 'Session type',
      options: sessionType,
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
    width: Flags.integer({
      default: 650,
      description: 'Width',
    }),
    scale: Flags.custom<number>({
      default: 1,
      description: 'Scale',
    })(),
  }

  async run(): Promise<void> {
    const param = await this.parse(Default)
    const {flags, args} = param

    const logger = flags.simpleLog
      ? new LoggerSimple({error: console.error, log: console.log, warn: console.warn})
      : new Logger()

    try {
      if (flags.simpleLog) {
        console.debug = flags.debug ? console.debug : (_) => {}
      } else {
        console.log = flags.debug ? logger.log.bind(logger) : (_) => {}
        console.debug = flags.debug ? logger.log.bind(logger) : (_) => {}
        console.warn = logger.warn.bind(logger)
        console.error = logger.error.bind(logger)
      }

      const app = getSnapAppRender({url: args.url, logger})
      await logger.guard({
        text: 'Initializing API',
        callback: (async () => {
          return app.init()
        })(),
      })
      const font = await logger.guard({
        text: 'Loading font',
        callback: (async () => {
          return app.getFont({cachePath: flags.fontPath})
        })(),
      })
      const session = await logger.guard({
        text: 'Logging in',
        callback: (() => {
          return app.login({
            sessionType: flags.sessionType,
            browserProfile: flags.browserProfile,
            browserHeadless: flags.browserHeadless,
            cookiesFile: flags.cookiesFile,
          })
        })(),
      })

      const render = await logger.guard({
        text: 'Initializing render',
        callback: (async () => {
          return app.getRender({limit: flags.limit, session})
        })(),
      })

      const ffmpegOption = flags.ffmpegAdditonalOption?.split(' ') || []

      const utilsList = await logger.guardProgress({
        max: flags.limit,
        text: 'Rendering',
        callback: app.run(render, async (run) => {
          try {
            const res = await run({
              width: flags.width,
              font,
              scale: flags.scale,
              theme: flags.theme,
              output: flags.output,
              ffmpegPath: flags.ffmpegPath,
              ffprobePath: flags.ffprobePath,
              ffmpegAdditonalOption: ffmpegOption,
              ffmpegTimeout: flags.ffmpegTimeout,
            })
            if (!flags.noCleanup) {
              await res.file.tempCleanup()
            }

            await sleepLoop(flags.sleep, async (count) => {
              logger.update(`Sleeping ${count} seconds`)
            })
            logger.succeed()
            return res
          } catch (error) {
            logger.catchFail(error)
          }
        }),
      })

      if (flags.output === '{stdout}') {
        const utils = utilsList?.filter((data) => data !== undefined)
        stdout.write(JSON.stringify(utils!.map((utils) => utils.stdout)))
      }
    } catch (error) {
      if (typeof error === 'string') {
        logger.catchError(error)
      } else if (error instanceof Error) {
        logger.catchError(error.message)
      } else {
        logger.catchError('Unknown error')
      }
    }
  }
}
