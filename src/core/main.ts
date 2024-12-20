import {TwitterOpenApi, TwitterOpenApiClient} from 'twitter-openapi-typescript'
import {FFmpegInfrastructure} from 'twitter-snap-core'

import fs from 'fs/promises'
import {DefaultCommandType} from '../commands/index.js'
import {Logger, LoggerSimple} from '../utils/logger.js'
import {isDefaultOption} from '../utils/oclif.js'
import {normalizePath} from '../utils/path.js'
import {sleepLoop} from '../utils/sleep.js'
import {getForceStartIdList, twitterUrlConvertPromise} from '../utils/url.js'

import {stdout} from 'process'

import {
  HandlerType,
  getFonts,
  twitterDomains,
  twitterSnapCookies,
  twitterSnapFromJson,
  twitterSnapGuest,
  twitterSnapPuppeteer,
} from './core.js'

type TwitterSnapParam = {
  logger?: Logger
}

export class TwitterSnap {
  logger: NonNullable<TwitterSnapParam['logger']>

  constructor(param?: TwitterSnapParam) {
    this.logger = param?.logger ?? new LoggerSimple(console.log.bind(console))
  }

  async logHandler({id, type, user}: HandlerType) {
    switch (type) {
      case 'start':
        return this.logger.update(`Rendering tweet ${user}/${id}`)
      case 'image':
        return this.logger.update(`Rendering image ${user}/${id}`)
      case 'video':
        return this.logger.update(`Rendering video ${user}/${id}`)
    }
  }

  async req(...args: Parameters<typeof fetch>) {
    console.debug(`http request: ${args[0]}`)
    const res = await fetch(...args)
    const some = (e: string) => twitterDomains.some((d) => e.startsWith(`https://${d}/i/api/graphql`))

    if (!res.ok && some(args[0].toString())) {
      console.error(`Return http status: ${res.status}`)
    } else {
      console.debug(`Return http status: ${res.status}`)
    }

    return res
  }

  async run({args, flags}: DefaultCommandType) {
    TwitterOpenApi.fetchApi = async (...args) => {
      const res = await this.req(...args)
      if (res.status === 429) {
        const wait = Number(res.headers.get('X-Rate-Limit-Reset')) * 1000 - Date.now()
        await sleepLoop(wait + 1, async (count) => {
          this.logger.update(`Rate limit exceeded, wait ${count} seconds`)
        })
        return this.req(...args)
      }

      return res
    }

    if (flags.sessionType !== 'guest' && flags.api === 'getTweetResultByRestId') {
      if (!args.id.startsWith('http') && !args.id.endsWith('.json')) {
        this.logger.hint('getTweetDetail is executed as getTweetResultByRestId because you are logged in')
      }
    }
    if (flags.theme === 'Json' || flags.theme === 'MediaOnly' || flags.theme === 'LiteJson') {
      if (isDefaultOption(flags, 'width')) {
        this.logger.hint('Width is not supported in Json theme')
      }
      if (isDefaultOption(flags, 'scale')) {
        this.logger.hint('Scale is not supported in Json theme')
      }
      if (isDefaultOption(flags, 'fontPath')) {
        this.logger.hint('Font is not supported in Json theme')
      }
      if (isDefaultOption(flags, 'ffmpegPath')) {
        this.logger.hint('FFmpeg options is not supported in Json theme')
      }
      if (isDefaultOption(flags, 'ffprobePath')) {
        this.logger.hint('FFmpeg options is not supported in Json theme')
      }
      if (isDefaultOption(flags, 'ffmpegAdditonalOption')) {
        this.logger.hint('FFmpeg options is not supported in Json theme')
      }
    }

    if (!(flags.theme === 'Json' || flags.theme === 'LiteJson') && flags.output === '{stdout}') {
      this.logger.hint('Output {stdout} is not supported in non-Json theme')
    }

    const getClient = () => {
      switch (flags.sessionType) {
        case 'guest':
          return twitterSnapGuest()
        case 'browser':
          return twitterSnapPuppeteer(flags.browserHeadless, normalizePath(flags.browserProfile))
        case 'file':
          return twitterSnapCookies(flags.cookiesFile)
      }
    }

    const getHttpType = async (api: TwitterOpenApiClient) => {
      if (args.id.startsWith('http')) {
        const convert = twitterUrlConvertPromise({url: args.id, guest: flags.sessionType === 'guest'})
        if (typeof convert === 'function') {
          return await this.logger.guard({text: 'Get user id'}, convert(api))
        } else if (typeof convert === 'object') {
          return convert
        }
      }
      return [args.id, flags.api] as const
    }

    const [client, id, type, startId] = await (async () => {
      if (args.id.endsWith('.json')) {
        const json = JSON.parse(await fs.readFile(args.id, 'utf-8'))
        const client = twitterSnapFromJson(json)
        return [client, '_', 'getTweetDetail', undefined] as const
      } else {
        const promiseClient = getClient()
        const [client, api] = await this.logger.guard({text: 'Loading client'}, promiseClient)
        const [id, type] = await getHttpType(api)
        const startId = getForceStartIdList(type) ? id : undefined
        return [client, id, type, startId] as const
      }
    })()

    const fontClient = getFonts(normalizePath(flags.fontPath))
    const fonts = await this.logger.guard({text: 'Loading font'}, fontClient)
    const limit = flags.limit
    const stdoutBuffer: any = []

    const render = client({id, limit, type, startId}, async (render) => {
      try {
        const finalize = await render({
          handler: this.logHandler.bind(this),
          output: flags.output,
          themeName: flags.theme,
          themeParam: {
            ffmpeg: new FFmpegInfrastructure({
              ffmpegPath: normalizePath(flags.ffmpegPath),
              ffprobePath: normalizePath(flags.ffprobePath),
            }),
            ffmpegAdditonalOption: flags.ffmpegAdditonalOption?.split(' ') ?? [],
            fonts,
            width: flags.width,
            scale: flags.scale,
          },
        })

        await finalize({
          cleanup: !flags.noCleanup,
          stdout: (e) => stdoutBuffer.push(e),
        })
        this.logger.succeed()
      } catch (error) {
        this.logger.catchFail(error)
      }

      await sleepLoop(flags.sleep, async (count) => {
        this.logger.update(`Sleeping ${count} seconds`)
      })
    })

    await this.logger.guardProgress({max: flags.limit, text: 'Rendering tweet'}, render)

    if (stdoutBuffer.length > 0) {
      stdout.write(JSON.stringify(stdoutBuffer))
    }
  }
}
