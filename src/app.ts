import {ColorThemeType, colorThemeList} from './config.js'
import {ElementColorUtils, ElementUtils} from './utils/element.js'
import {FileUtils} from './utils/file.js'
import {FontOptions, FontUtils} from './utils/font.js'
import {Logger} from './utils/logger.js'
import {SnapAppBrowserUtils} from './utils/login.js'
import {FilePath} from './utils/path.js'
import {SnapRenderBaseUtils, SnapRenderColorUtils, SnapRenderUtils} from './utils/render.js'
import {FileReplace, getName} from './utils/replace.js'
import {VideoUtils} from './utils/video.js'

const includeColorTheme = (theme: string): theme is ColorThemeType => {
  return theme in colorThemeList
}

type ExtractGroups<T extends string> = T extends `${infer _Start}(?<${infer GroupName}>${infer _Rest})${infer Tail}`
  ? {[K in GroupName | keyof ExtractGroups<Tail>]: string}
  : {}

type SnapAppCallback<T1, V1 extends string, V2> = (
  utils: {limit: number},
  api: T1,
  match: ExtractGroups<V1>,
) => Promise<SnapRenderChild<V2>>

export class Session<T1> {
  constructor(public api: T1) {}
}

export class SnapApp<T1> {
  pattern: RegExp
  callbackList: [RegExp, SnapAppCallback<T1, string, any>][] = []

  constructor(
    public name: string,
    pattern: string,
    public callback: (util: SnapAppBrowserUtils) => Promise<Session<T1>>,
    public fonts: (utils: FontUtils) => Promise<FontOptions>,
    public init: ({logger}: {logger: Logger}) => Promise<void>,
  ) {
    this.pattern = new RegExp(pattern)
  }

  call<V1 extends string, V2>(pattern: V1, callback: SnapAppCallback<T1, V1, V2>) {
    this.callbackList.push([new RegExp(pattern), callback])
  }
}

type SnapRenderCallback2<T1> = (data: T1, utils: SnapRenderUtils) => Promise<void>
type SnapRenderCallback3<T1> = (
  data: T1,
  utils: SnapRenderUtils,
  placeholder: FileReplace[],
  output: string,
) => Promise<void>

export class SnapRender<T1> {
  callbackList: [string, SnapRenderCallback3<T1>][] = []

  constructor(
    public isImage: (data: T1) => boolean,
    public placeholder: (data: T1) => FileReplace[],
    public image: (data: T1, utils: SnapRenderColorUtils) => Promise<React.ReactElement>,
    public video: (data: T1, utils: SnapRenderColorUtils) => Promise<void>,
  ) {}

  run = (data: AsyncGenerator<T1, any, any>) => {
    return new SnapRenderChild(this.isImage, this.placeholder, this.image, this.video, this.callbackList, data)
  }

  other = (theme: string, callback: SnapRenderCallback3<T1>) => {
    this.callbackList.push([theme, callback])
  }

  media = <T2>(
    theme: string,
    media: (data: T1) => T2[],
    mediaPlaceholder: (data: T2) => FileReplace[],
    callback: SnapRenderCallback2<T2>,
  ) => {
    const c: SnapRenderCallback3<T1> = async (data, utils, placeholder, output) => {
      const list = media(data)

      for (const [i, item] of list.entries()) {
        const p = [...placeholder, ...mediaPlaceholder(item), ['{media-count}', i]] as FileReplace[]
        utils.file.path = getName('media', p, output, i)
        await callback(item, utils)
      }
    }

    this.callbackList.push([theme, c])
  }
}

export type SnapRenderChildNextParam<T1> = {
  data: T1
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffprobePath?: string

  font: FontOptions
  logger: Logger
  output: string

  scale: number
  theme: string
  width: number
}

export class SnapRenderChild<T1> {
  count: number

  constructor(
    public isImage: (data: T1) => boolean,
    public placeholder: (data: T1) => FileReplace[],
    public image: (data: T1, utils: SnapRenderColorUtils) => Promise<React.ReactElement>,
    public video: (data: T1, utils: SnapRenderColorUtils) => Promise<void>,
    public otherCallbackList: [string, SnapRenderCallback3<T1>][],
    public data: AsyncGenerator<T1, any, any>,
  ) {
    this.count = 0
  }

  next = async (flag: SnapRenderChildNextParam<T1>): Promise<SnapRenderBaseUtils> => {
    const {theme, data, logger, output, ffmpegPath, ffprobePath, ffmpegAdditonalOption, font, width} = flag
    const base = (path: FilePath) => {
      return [
        logger,
        new FileUtils(path, output === '{stdout}'),
        new VideoUtils({
          ffmpegPath,
          ffprobePath,
          ffmpegAdditonalOption,
        }),
        font,
        width,
      ] as const
    }

    const utils = await (async () => {
      if (includeColorTheme(theme)) {
        const name = getName('image', this.placeholder(data), output, this.count++)
        if (this.isImage(data)) {
          if (name.isExtension('png')) {
            const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
            const element = await this.image(data, utils)
            await utils.file.saveImg(await utils.render(element))
            return utils
          }

          logger.hint('Output as png')
          const rep = name.update({extension: 'png'})
          const utils = new SnapRenderColorUtils(...base(rep), new ElementColorUtils({theme}))
          const element = await this.image(data, utils)
          await utils.file.saveImg(await utils.render(element))
          return utils
        } else {
          const name = getName('video', this.placeholder(data), output, this.count++)
          if (name.isExtension('png')) {
            const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
            const element = await this.image(data, utils)
            await utils.file.saveImg(await utils.render(element))
            return utils
          }

          if (name.isExtension('')) {
            logger.hint('Output as mp4')
            const rep = name.update({extension: 'mp4'})
            const utils = new SnapRenderColorUtils(...base(rep), new ElementColorUtils({theme}))
            await this.video(data, utils)
            return utils
          }

          const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
          await this.video(data, utils)
          return utils
        }
      }

      const callback = this.otherCallbackList.find(([t]) => t === theme)
      if (callback) {
        const name = getName('json', this.placeholder(data), output, this.count++)
        const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme}))
        await callback[1](data, utils, this.placeholder(data), output)
        return utils
      }

      throw new Error('No theme found')
    })()
    return utils
  }
}
