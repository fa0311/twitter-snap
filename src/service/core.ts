import {Session, SnapApp, SnapRenderChild} from '../app.js'
import {FontOptions, FontUtils} from '../utils/font.js'
import {Logger, LoggerMute} from '../utils/logger.js'
import {SnapAppBrowserUtils, SnapAppBrowserUtilsParams} from '../utils/login.js'
import {DirectoryPath} from '../utils/path.js'
import {SnapRenderBaseUtils} from '../utils/render.js'
import twitter from './twitter/app.js'

export const apps = [twitter] as SnapApp<any>[]

type SnapRunParam = {
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffprobePath?: string
  font?: FontOptions
  output?: '{id}-{count}.{if-type:png:mp4:json:}' | ({} & string)
  scale?: number
  theme?: 'RenderOceanBlueColor' | ({} & string)
  width?: number
}

export const getSnapAppRender = ({url, logger}: {logger?: Logger; url: string}) => {
  const app = apps.find((app) => app.pattern.test(url))
  const log = logger ?? new LoggerMute()
  if (!app) {
    throw new Error('Unsupported URL')
  }

  const prefix = app.pattern.exec(url)![0]
  const path = url.slice(prefix.length)
  const match = app.callbackList.find(([regs]) => regs.test(path))
  if (!match) {
    throw new Error('Unsupported URL')
  }

  const groups = match[0].exec(url)!.groups!

  return {
    app,
    init() {
      return app.init({logger: log})
    },
    getFont({cachePath}: {cachePath?: string} = {}) {
      return app.fonts(new FontUtils(DirectoryPath.from(cachePath ?? '~/.cache/twitter-snap/fonts')))
    },
    login(param: SnapAppBrowserUtilsParams = {}) {
      return app.callback(new SnapAppBrowserUtils(param))
    },
    getRender({limit = 1, session}: {limit?: number; session: Session<any>}) {
      return match[1]({limit}, session.api, groups)
    },
    async run<T>(
      render: SnapRenderChild<any>,
      callback: (run: (param: SnapRunParam) => Promise<SnapRenderBaseUtils>) => Promise<T>,
    ) {
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
            logger: log,
          })
        })
        utilsList.push(utils)
      }

      return utilsList
    },
  }
}
