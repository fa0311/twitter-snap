import {Args, Command, Flags} from '@oclif/core'

import {themeList, ThemeNameType} from 'twitter-snap-core'
import {additonalTheme, AdditonalThemeType, sessionType, SessionType} from '../core/core.js'
import {TwitterSnap} from '../core/main.js'
import {Logger, LoggerSimple} from '../utils/logger.js'
import {GetTweetApi, getTweetList} from './../utils/types.js'

export abstract class DefaultCommand extends Command {
  public getDefault() {
    return this.parse(Default)
  }
}
type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never
export type DefaultCommandType = PromiseType<ReturnType<typeof DefaultCommand.prototype.getDefault>>

export default class Default extends Command {
  static args = {
    id: Args.string({description: 'Twitter status id', required: true}),
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
      default: '{if-media-only:{id}-{media-id}:{id}}.{if-photo:png:mp4}',
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
    theme: Flags.custom<ThemeNameType | AdditonalThemeType>({
      default: 'RenderOceanBlueColor',
      description: 'Theme type',
      options: [...Object.keys(themeList), ...additonalTheme],
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

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(argv: string[], config: any) {
    super(argv, config)
  }

  async run(): Promise<void> {
    try {
      const param = await this.parse(Default)
      const logger = param.flags.simpleLog ? new LoggerSimple(this.log.bind(this)) : new Logger()

      if (param.flags.simpleLog) {
        console.debug = param.flags.debug ? console.debug : (_) => {}
      } else {
        console.log = param.flags.debug ? logger.log.bind(logger) : (_) => {}
        console.debug = param.flags.debug ? logger.log.bind(logger) : (_) => {}
        console.warn = logger.warn.bind(logger)
        console.error = logger.error.bind(logger)
      }

      const snap = new TwitterSnap({logger})
      await snap.run(param)
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
