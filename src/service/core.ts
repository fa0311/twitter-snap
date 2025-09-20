import {Session, SnapApp, SnapRenderChild, SnapRenderChildNextParam} from '../app.js'
import simpleCache from '../utils/cache.js'
import {FontOptions, FontUtils, FontUtilsOptions} from '../utils/font.js'
import {Logger, LoggerMute} from '../utils/logger.js'
import {SnapAppBrowserUtils, SnapAppBrowserUtilsParams} from '../utils/login.js'
import {DirectoryPath} from '../utils/path.js'
import {SnapRenderBaseUtils} from '../utils/render.js'
import pixiv from './pixiv/app.js'
import twitter from './twitter/app.js'

export const apps = [twitter, pixiv] as SnapApp<any>[]

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

type GetUrlPaeseParam = {
  url: string
  allowAppName?: string[]
}

const getUrlPaese = ({url, allowAppName}: GetUrlPaeseParam) => {
  const app = apps
    .filter((app) => (allowAppName ? allowAppName.includes(app.name) : true))
    .find((app) => app.pattern.test(url))

  if (!app) {
    throw new Error('Unsupported URL')
  }

  const prefix = app.pattern.exec(url)![0]
  const path = url.slice(prefix.length)
  const match = app.callbackList.find(([regs]) => regs.test(path))
  if (!match) {
    throw new Error('Unsupported URL')
  }

  const param = match[0].exec(path)!.groups!
  const callback = match[1]
  return {app, callback, param}
}

const renderLoop = <T>(log: Logger) => {
  return async (
    render: SnapRenderChild<any>,
    callback: (run: (param: SnapRunParam) => Promise<SnapRenderBaseUtils>) => Promise<T>,
  ) => {
    const utilsList: T[] = []
    for await (const data of render.data) {
      const utils = await callback((param) => {
        return render.next({
          data,
          width: param.width ?? 650,
          font: param.font ?? {text: [], emoji: undefined},
          scale: param.scale ?? 1,
          theme: param.theme ?? 'RenderOceanBlueColor',
          output: param.output ?? '{id}-{count}.{if-type:png:mp4:json:}',
          ffmpegPath: param.ffmpegPath,
          ffprobePath: param.ffprobePath,
          ffmpegAdditonalOption: param.ffmpegAdditonalOption ?? [],
          ffmpegTimeout: param.ffmpegTimeout,
          logger: log,
        })
      })
      utilsList.push(utils)
    }

    return utilsList
  }
}

const toNextParam = <T>(param: SnapRunParam, data: T, log: Logger): SnapRenderChildNextParam<T> => {
  return {
    data,
    width: param.width ?? 650,
    font: param.font ?? {text: [], emoji: undefined},
    scale: param.scale ?? 1,
    theme: param.theme ?? 'RenderOceanBlueColor',
    output: param.output ?? '{id}-{count}.{if-type:png:mp4:json:}',
    ffmpegPath: param.ffmpegPath,
    ffprobePath: param.ffprobePath,
    ffmpegAdditonalOption: param.ffmpegAdditonalOption ?? [],
    ffmpegTimeout: param.ffmpegTimeout,
    logger: log,
  }
}

type GetSnapAppRenderParam = {
  logger?: Logger
  url: string
  allowAppName?: string[]
}

export const getSnapAppRender = ({logger, url, allowAppName}: GetSnapAppRenderParam) => {
  const log = logger ?? new LoggerMute()
  const {app, callback, param} = getUrlPaese({url, allowAppName})

  return {
    app,
    init() {
      return app.init({logger: log})
    },
    getFont({cachePath}: {cachePath?: string} = {}) {
      return app.fonts(new FontUtils({dir: cachePath ? DirectoryPath.from(cachePath) : undefined}))
    },
    login(param: SnapAppBrowserUtilsParams = {}) {
      return app.callback(new SnapAppBrowserUtils(param))
    },
    getRender({limit = 1, session}: {limit?: number; session: Session<any>}) {
      return callback({limit}, session.api, param)
    },
    async run<T>(
      render: SnapRenderChild<any>,
      callback: (run: (param: SnapRunParam) => Promise<SnapRenderBaseUtils>) => Promise<T>,
    ) {
      const utilsList: T[] = []
      for await (const data of render.data) {
        const utils = await callback((param) => {
          return render.next(toNextParam(param, data, log))
        })
        utilsList.push(utils)
      }

      return utilsList
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
  const cache = simpleCache<[Session<any>, FontOptions]>()
  return async <T>(args: GetSnapAppRenderWithCacheParam<T>) => {
    const {app, param, callback} = getUrlPaese({url: args.url, allowAppName: args.allowAppName})

    const [session, font] = await cache(app.name, async () => {
      const font = await app.fonts(
        new FontUtils({
          dir: args.cachePath ? DirectoryPath.from(args.cachePath) : undefined,
        }),
      )
      const session = await app.callback(
        new SnapAppBrowserUtils({
          sessionType: args.sessionType,
          browserProfile: args.browserProfile,
          cookiesFile: args.cookiesFile,
        }),
      )
      return [session, font]
    })
    const render = await callback({limit: args.limit ?? 1}, session.api, param)

    const utilsList: T[] = []
    for await (const data of render.data) {
      const utils = await args.callback((param) => {
        return render.next(toNextParam({...param, font}, data, log))
      })
      utilsList.push(utils)
    }

    return utilsList
  }
}
