import type {SnapAppInfo, SnapRenderNextParam, SnapRenderStream, SnapSession} from '../app.js'
import simpleCache from '../utils/cache.js'
import {type FontOptions, FontUtils, type FontUtilsOptions} from '../utils/font.js'
import {type Logger, LoggerMute} from '../utils/logger.js'
import {SnapAppBrowserUtils, type SnapAppBrowserUtilsParams} from '../utils/login.js'
import {DirectoryPath} from '../utils/path.js'
import type {SnapRenderBaseUtils} from '../utils/render.js'
import pixiv from './pixiv/app.js'
import twitter from './twitter/app.js'

export const apps: SnapAppInfo[] = [twitter, pixiv]

type SnapRunParam = {
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffmpegTimeout?: number
  ffprobePath?: string
  font?: FontOptions
  output?: '{id}-{count}.{if-type:png:mp4:json:}' | ({} & string)
  scale?: number
  theme?: 'Json' | 'Media' | 'RenderOceanBlueColor' | ({} & string)
  width?: number
}

type SnapRunCallback<T> = (run: (param: SnapRunParam) => Promise<SnapRenderBaseUtils>) => Promise<T>

type GetAppParam = {
  url: string
  allowAppName?: string[]
}

const getApp = ({url, allowAppName}: GetAppParam) => {
  const app = apps.filter((app) => (allowAppName ? allowAppName.includes(app.name) : true)).find((app) => app.test(url))

  if (!app) {
    throw new Error('Unsupported URL')
  }

  return app
}

const toNextParam = (param: SnapRunParam, log: Logger): SnapRenderNextParam => {
  const theme = param.theme ?? 'RenderOceanBlueColor'
  return {
    width: param.width ?? (theme.startsWith('RenderXReference') ? 600 : 650), // x.com's column is 600px
    font: param.font ?? {text: [], emoji: undefined},
    scale: param.scale ?? 1,
    theme,
    output: param.output ?? '{id}-{count}.{if-type:png:mp4:json:}',
    ffmpegPath: param.ffmpegPath,
    ffprobePath: param.ffprobePath,
    ffmpegAdditonalOption: param.ffmpegAdditonalOption ?? [],
    ffmpegTimeout: param.ffmpegTimeout,
    logger: log,
  }
}

const runAll = async <T>(render: SnapRenderStream, log: Logger, callback: SnapRunCallback<T>) => {
  const utilsList: T[] = []
  for await (const item of render) {
    const utils = await callback((param) => item.next(toNextParam(param, log)))
    utilsList.push(utils)
  }

  return utilsList
}

type GetSnapAppRenderParam = {
  logger?: Logger
  url: string
  allowAppName?: string[]
}

export const getSnapAppRender = ({logger, url, allowAppName}: GetSnapAppRenderParam) => {
  const log = logger ?? new LoggerMute()
  const app = getApp({url, allowAppName})

  return {
    app,
    init() {
      return app.init({logger: log})
    },
    getFont({cachePath}: {cachePath?: string} = {}) {
      return app.fonts(new FontUtils({dir: cachePath ? DirectoryPath.from(cachePath) : undefined}))
    },
    login(param: SnapAppBrowserUtilsParams = {}) {
      return app.login(new SnapAppBrowserUtils(param))
    },
    getRender({limit = 1, session}: {limit?: number; session: SnapSession}) {
      return session.render(url, {limit})
    },
    run<T>(render: SnapRenderStream, callback: SnapRunCallback<T>) {
      return runAll(render, log, callback)
    },
  }
}

type GetSnapAppRenderWithCacheParam<T> = {
  url: string
  allowAppName?: string[]
  cachePath?: string
  fontUtils?: FontUtilsOptions
  sessionType?: SnapAppBrowserUtilsParams['sessionType']
  browserProfile?: SnapAppBrowserUtilsParams['browserProfile']
  cookiesFile?: SnapAppBrowserUtilsParams['cookiesFile']
  limit?: number
  callback: (run: (param: Omit<SnapRunParam, 'font'>) => Promise<SnapRenderBaseUtils>) => Promise<T>
}

export const getSnapAppRenderWithCache = ({logger}: {logger?: Logger}) => {
  const log = logger ?? new LoggerMute()
  const cache = simpleCache<[SnapSession, FontOptions]>()
  return async <T>(args: GetSnapAppRenderWithCacheParam<T>) => {
    const app = getApp({url: args.url, allowAppName: args.allowAppName})

    const [session, font] = await cache(app.name, async () => {
      const font = await app.fonts(
        new FontUtils({
          dir: args.cachePath ? DirectoryPath.from(args.cachePath) : undefined,
        }),
      )
      const session = await app.login(
        new SnapAppBrowserUtils({
          sessionType: args.sessionType,
          browserProfile: args.browserProfile,
          cookiesFile: args.cookiesFile,
        }),
      )
      return [session, font]
    })
    const render = await session.render(args.url, {limit: args.limit ?? 1})

    return runAll(render, log, (run) => args.callback((param) => run({...param, font})))
  }
}
