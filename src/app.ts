import {ColorThemeType, colorThemeList, themeList} from './config.js'
import {ElementColorUtils, ElementUtils} from './utils/element.js'
import {FileUtils} from './utils/file.js'
import {FontOptions, FontUtils} from './utils/font.js'
import {Logger} from './utils/logger.js'
import {SnapAppBrowserUtils} from './utils/login.js'
import {FilePath} from './utils/path.js'
import {SnapRenderBaseUtils, SnapRenderColorUtils, SnapRenderUtils} from './utils/render.js'
import {FileReplace, getName} from './utils/replace.js'
import {VideoUtils} from './utils/video.js'

export const includeColorTheme = (theme: string): theme is ColorThemeType => {
  return theme in colorThemeList
}

export const includeTheme = (theme: string): theme is keyof typeof themeList => {
  return theme in themeList
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

type CallbackImage<T1> = (data: T1, utils: SnapRenderColorUtils) => Promise<React.ReactElement>
type CallbackVideo<T1> = (data: T1, utils: SnapRenderColorUtils) => Promise<void>
type CallbackOther<T1> = (data: T1, utils: SnapRenderUtils, placeholder: FileReplace[], output: string) => Promise<void>
type CallbackJson<T1> = (data: T1, utils: SnapRenderUtils) => Promise<any>
type CallbackMedia<T1> = (data: T1, utils: SnapRenderUtils) => Promise<void>

export class SnapRender<T1> {
  imageCallback: [string, CallbackImage<T1>][] = []
  videoCallback: [string, CallbackVideo<T1>][] = []
  otherCallback: [string, CallbackOther<T1>][] = []
  jsonCallback: [string, CallbackJson<T1>][] = []

  constructor(
    public isImage: (data: T1) => boolean,
    public placeholder: (data: T1) => FileReplace[],
    image: CallbackImage<T1>,
    video: CallbackVideo<T1>,
  ) {
    for (const theme of Object.keys(colorThemeList)) {
      this.imageCallback.push([theme, image])
      this.videoCallback.push([theme, video])
    }
  }

  run = (data: AsyncGenerator<T1, any, any>) => {
    return new SnapRenderChild(
      this.isImage,
      this.placeholder,
      this.imageCallback,
      this.videoCallback,
      this.otherCallback,
      this.jsonCallback,
      data,
    )
  }

  add = (theme: string, image: CallbackImage<T1>, video: CallbackVideo<T1>) => {
    this.imageCallback.push([theme, image])
    this.videoCallback.push([theme, video])
  }

  other = (theme: string, callback: CallbackOther<T1>) => {
    this.otherCallback.push([theme, callback])
  }

  json = (theme: string, json: CallbackJson<T1>) => {
    this.jsonCallback.push([theme, json])
  }

  media = <T2>(
    theme: string,
    media: (data: T1) => T2[],
    mediaPlaceholder: (data: T2) => FileReplace[],
    callback: CallbackMedia<T2>,
  ) => {
    const c: CallbackOther<T1> = async (data, utils, placeholder, output) => {
      const list = media(data)

      for (const [i, item] of list.entries()) {
        const p = [...placeholder, ...mediaPlaceholder(item), ['{media-count}', i]] as FileReplace[]
        utils.file.path = getName('other', p, output, i)
        await callback(item, utils)
      }
    }

    this.otherCallback.push([theme, c])
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
    public imageCallback: [string, CallbackImage<T1>][],
    public videoCallback: [string, CallbackVideo<T1>][],
    public otherCallback: [string, CallbackOther<T1>][],
    public jsonCallback: [string, CallbackJson<T1>][],
    public data: AsyncGenerator<T1, any, any>,
  ) {
    this.count = 0
  }

  image = (theme: string) => {
    const callback = this.imageCallback.find(([t]) => t === theme)
    if (!callback) {
      throw new Error('No theme found')
    }

    return callback[1]
  }

  video = (theme: string) => {
    const callback = this.videoCallback.find(([t]) => t === theme)
    if (!callback) {
      throw new Error('No theme found')
    }

    return callback[1]
  }

  other = (theme: string) => {
    const callback = this.otherCallback.find(([t]) => t === theme)
    if (!callback) {
      throw new Error('No theme found')
    }

    return callback[1]
  }

  json = (theme: string) => {
    const callback = this.jsonCallback.find(([t]) => t === theme)
    if (!callback) {
      throw new Error('No theme found')
    }

    return callback[1]
  }

  next = async (flag: SnapRenderChildNextParam<T1>): Promise<SnapRenderBaseUtils> => {
    const {theme, data, logger, output, ffmpegPath, ffprobePath, ffmpegAdditonalOption, font, width} = flag
    const base = (path: FilePath) => {
      return [
        logger,
        new FileUtils(path),
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
      if (includeTheme(theme)) {
        switch (themeList[theme]) {
          case 'element': {
            if (this.isImage(data)) {
              const name = getName('image', this.placeholder(data), output, this.count++)
              if (name.isExtension('png')) {
                const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
                const element = await this.image(theme)(data, utils)
                await utils.file.saveImg(await utils.render(element))
                return utils
              } else if (name.isExtension('')) {
                logger.hint('Output as png')
                const rep = name.update({extension: 'png'})
                const utils = new SnapRenderColorUtils(...base(rep), new ElementColorUtils({theme}))
                const element = await this.image(theme)(data, utils)
                await utils.file.saveImg(await utils.render(element))
                return utils
              } else if (name.isImage()) {
                logger.hint(`Unsupported format: ${name.extension}, output as png`)
                const rep = name.update({extension: 'png'})
                const utils = new SnapRenderColorUtils(...base(rep), new ElementColorUtils({theme}))
                const element = await this.image(theme)(data, utils)
                await utils.file.saveImg(await utils.render(element))
                return utils
              } else {
                const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
                await this.video(theme)(data, utils)
                return utils
              }
            } else {
              const name = getName('video', this.placeholder(data), output, this.count++)
              if (name.isExtension('png')) {
                const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
                const element = await this.image(theme)(data, utils)
                await utils.file.saveImg(await utils.render(element))
                return utils
              } else if (name.isExtension('')) {
                logger.hint('Output as mp4')
                const rep = name.update({extension: 'mp4'})
                const utils = new SnapRenderColorUtils(...base(rep), new ElementColorUtils({theme}))
                await this.video(theme)(data, utils)
                return utils
              } else if (name.isImage()) {
                logger.hint(`Unsupported format: ${name.extension}, output as png`)
                const rep = name.update({extension: 'png'})
                const utils = new SnapRenderColorUtils(...base(rep), new ElementColorUtils({theme}))
                const element = await this.image(theme)(data, utils)
                await utils.file.saveImg(await utils.render(element))
                return utils
              } else {
                const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme}))
                await this.video(theme)(data, utils)
                return utils
              }
            }
          }

          case 'other': {
            const name = getName('other', this.placeholder(data), output, this.count++)
            const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme}))
            await this.other(theme)(data, utils, this.placeholder(data), output)
            return utils
          }

          case 'json': {
            const name = getName('json', this.placeholder(data), output, this.count++)
            if (output === '{stdout}') {
              const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme}))
              utils.stdout = await this.json(theme)(data, utils)
              return utils
            } else if (name.isExtension('json')) {
              const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme}))
              const res = await this.json(theme)(data, utils)
              await utils.file.path.writeFile(JSON.stringify(res))
              return utils
            } else if (name.isExtension('')) {
              logger.hint('Output as json')
              const rep = name.update({extension: 'json'})
              const utils = new SnapRenderUtils(...base(rep), new ElementUtils({theme}))
              const res = await this.json(theme)(data, utils)
              await utils.file.path.writeFile(JSON.stringify(res))
              return utils
            } else {
              logger.hint(`Unsupported format: ${name.extension}, output as json`)
              const rep = name.update({extension: ''})
              const utils = new SnapRenderUtils(...base(rep), new ElementUtils({theme}))
              const res = await this.json(theme)(data, utils)
              await utils.file.path.writeFile(JSON.stringify(res))
              return utils
            }
          }
        }
      }

      throw new Error('No theme found')
    })()

    return utils
  }
}
