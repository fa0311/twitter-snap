import {Command} from '@oclif/core'
import {TwitterOpenApi} from 'twitter-openapi-typescript'
import {FFmpegInfrastructure} from 'twitter-snap-core'

import Default from '../commands/index.js'
import {Logger, LoggerSimple} from '../utils/logger.js'
import {normalizePath} from '../utils/path.js'
import {sleepLoop} from '../utils/sleep.js'
import {getForceStartIdList, twitterUrlConvert} from '../utils/url.js'
import {
  HandlerType,
  getFonts,
  twitterDomains,
  twitterSnapCookies,
  twitterSnapGuest,
  twitterSnapPuppeteer,
} from './core.js'

abstract class CommandType extends Command {
  public getDefault() {
    return this.parse(Default)
  }
}

type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never
export type TwitterSnapRunParam = PromiseType<ReturnType<typeof CommandType.prototype.getDefault>>

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
      console.log(`Return http status: ${res.status}`)
    }

    return res
  }

  async run({args, flags}: TwitterSnapRunParam) {
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

    const getClient = (() => {
      switch (flags.sessionType) {
        case 'guest':
          return twitterSnapGuest()
        case 'browser':
          return twitterSnapPuppeteer(flags.browserHeadless, normalizePath(flags.browserProfile))
        case 'file':
          return twitterSnapCookies(flags.cookiesFile)
      }
    })()

    const [client, api] = await this.logger.guard({text: 'Loading client'}, getClient)

    const [id, type] = await (async () => {
      if (args.id.startsWith('http')) {
        const convert = twitterUrlConvert({url: args.id, guest: flags.sessionType === 'guest'})
        if (typeof convert === 'function') {
          return await this.logger.guard({text: 'Get user id'}, convert(api))
        }

        if (typeof convert === 'object') {
          return convert
        }
      }

      return [args.id, flags.api] as const
    })()

    const startId = getForceStartIdList(type) ? id : undefined

    const fontClient = getFonts(normalizePath(flags.fontPath))
    const fonts = await this.logger.guard({text: 'Loading Font'}, fontClient)

    const render = client({id, limit: flags.limit, type, startId}, async (render) => {
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
          },
        })

        await finalize({
          cleanup: !flags.noCleanup,
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
  }
}
