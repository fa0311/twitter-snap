import type {ReactElement} from 'react'

import {type ColorThemeType, colorThemeList, hasKind, type ThemeNameType, type ThemeOf, themeList} from './config.js'
import {ElementColorUtils, ElementUtils} from './utils/element.js'
import {FileUtils} from './utils/file.js'
import type {FontOptions, FontUtils} from './utils/font.js'
import type {Logger} from './utils/logger.js'
import type {SnapAppBrowserUtils} from './utils/login.js'
import type {FilePath} from './utils/path.js'
import {type SnapRenderBaseUtils, SnapRenderColorUtils, SnapRenderUtils} from './utils/render.js'
import {type FileReplace, getName} from './utils/replace.js'
import {VideoUtils} from './utils/video.js'

export const includeColorTheme = (theme: string): theme is ColorThemeType => {
  return theme in colorThemeList
}

export const includeTheme = (theme: string): theme is keyof typeof themeList => {
  return theme in themeList
}

export type ExtractGroups<T extends string> =
  T extends `${infer _Start}(?<${infer GroupName}>${infer _Rest})${infer Tail}`
    ? {[K in GroupName | keyof ExtractGroups<Tail>]: string}
    : Record<never, never>

// What the command line asks of a route: how many items, and whether a tweet URL means the author's whole thread
export type SnapAppUtils = {limit: number; thread: boolean}

type SnapAppCallback<T1, V1 extends string> = (
  utils: SnapAppUtils,
  api: T1,
  match: ExtractGroups<V1>,
) => Promise<SnapRenderStream>

type SnapAppRoute<T1> = (utils: SnapAppUtils, api: T1, match: RegExpExecArray) => Promise<SnapRenderStream>

export class Session<T1> {
  constructor(public api: T1) {}
}

export type SnapSession = {
  render: (url: string, utils: SnapAppUtils) => Promise<SnapRenderStream>
}

export type SnapAppInfo = {
  name: string
  pattern: RegExp
  routes: RegExp[]
  fonts: (utils: FontUtils) => Promise<FontOptions>
  init: ({logger}: {logger: Logger}) => Promise<void>
  test: (url: string) => boolean
  login: (utils: SnapAppBrowserUtils) => Promise<SnapSession>
}

export class SnapApp<T1> implements SnapAppInfo {
  pattern: RegExp
  routes: RegExp[] = []
  private callbackList: SnapAppRoute<T1>[] = []

  constructor(
    public name: string,
    pattern: string,
    public callback: (util: SnapAppBrowserUtils) => Promise<Session<T1>>,
    public fonts: (utils: FontUtils) => Promise<FontOptions>,
    public init: ({logger}: {logger: Logger}) => Promise<void>,
  ) {
    this.pattern = new RegExp(pattern)
  }

  call<V1 extends string>(pattern: V1, callback: SnapAppCallback<T1, V1>) {
    this.routes.push(new RegExp(pattern))
    // Named capture groups are only known statically through the pattern literal.
    this.callbackList.push((utils, api, match) => callback(utils, api, (match.groups ?? {}) as ExtractGroups<V1>))
  }

  test(url: string) {
    return this.pattern.test(url) && this.route(url) !== undefined
  }

  private route(url: string) {
    const prefix = this.pattern.exec(url)
    if (!prefix) return undefined
    const path = url.slice(prefix[0].length)
    for (const [i, reg] of this.routes.entries()) {
      const match = reg.exec(path)
      if (match) return {callback: this.callbackList[i], match}
    }

    return undefined
  }

  async login(utils: SnapAppBrowserUtils): Promise<SnapSession> {
    const session = await this.callback(utils)
    return {
      render: (url, param) => {
        const route = this.route(url)
        if (!route) throw new Error('Unsupported URL')
        return route.callback(param, session.api, route.match)
      },
    }
  }
}

type CallbackImage<T1> = (data: T1, utils: SnapRenderColorUtils) => Promise<ReactElement>
type CallbackVideo<T1> = (data: T1, utils: SnapRenderColorUtils) => Promise<void>
type CallbackOther<T1> = (data: T1, utils: SnapRenderUtils, placeholder: FileReplace[], output: string) => Promise<void>
type CallbackJson<T1> = (data: T1, utils: SnapRenderUtils) => Promise<unknown>
type CallbackMedia<T1> = (data: T1, utils: SnapRenderUtils) => Promise<void>

// Everything a service renders, declared once; the theme names are checked against themeList by kind.
export type SnapRenderDefinition<T1> = {
  isImage: (data: T1) => boolean
  placeholder: (data: T1) => FileReplace[]
  // every color theme renders with the same callbacks
  color: {image: CallbackImage<T1>; video: CallbackVideo<T1>}
  element?: Partial<
    Record<Exclude<ThemeOf<'element'>, ColorThemeType>, {image: CallbackImage<T1>; video: CallbackVideo<T1>}>
  >
  json?: Partial<Record<ThemeOf<'json'>, CallbackJson<T1>>>
  other?: Partial<Record<ThemeOf<'other'>, CallbackOther<T1>>>
}

export class SnapRender<T1> {
  constructor(public definition: SnapRenderDefinition<T1>) {}

  run = (data: AsyncGenerator<T1>) => {
    return new SnapRenderChild(this.definition, data)
  }
}

// An "other" callback that saves every media item of the data as its own file
export const mediaCallback = <T1, T2>(
  media: (data: T1) => T2[],
  mediaPlaceholder: (data: T2) => FileReplace[],
  callback: CallbackMedia<T2>,
): CallbackOther<T1> => {
  return async (data, utils, placeholder, output) => {
    const list = media(data)

    for (const [i, item] of list.entries()) {
      const p: FileReplace[] = [...placeholder, ...mediaPlaceholder(item), ['{media-count}', i]]
      utils.file.path = getName('other', p, output, i)
      await callback(item, utils)
    }
  }
}

export type SnapRenderNextParam = {
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffmpegTimeout?: number
  ffprobePath?: string

  font: FontOptions
  logger: Logger
  output: string

  scale: number
  theme: string
  // language the posts were asked to be translated into, shown under the text
  translate?: string
  width: number
}

export type SnapRenderItem = {
  next: (param: SnapRenderNextParam) => Promise<SnapRenderBaseUtils>
  image: (theme: ThemeOf<'element'>, utils: SnapRenderColorUtils) => Promise<ReactElement>
  video: (theme: ThemeOf<'element'>, utils: SnapRenderColorUtils) => Promise<void>
}

export type SnapRenderStream = AsyncIterable<SnapRenderItem>

const found = <T>(callback: T | undefined, theme: ThemeNameType): T => {
  if (!callback) {
    throw new Error(`Theme ${theme} is not available for this service`)
  }

  return callback
}

export class SnapRenderChild<T1> implements SnapRenderStream {
  count = 0

  constructor(
    public definition: SnapRenderDefinition<T1>,
    public data: AsyncGenerator<T1>,
  ) {}

  async *[Symbol.asyncIterator]() {
    for await (const data of this.data) {
      yield this.item(data)
    }
  }

  item = (data: T1): SnapRenderItem => {
    return {
      next: (param) => this.next(data, param),
      image: (theme, utils) => this.image(theme)(data, utils),
      video: (theme, utils) => this.video(theme)(data, utils),
    }
  }

  element = (theme: ThemeOf<'element'>) =>
    found(includeColorTheme(theme) ? this.definition.color : this.definition.element?.[theme], theme)

  image = (theme: ThemeOf<'element'>) => this.element(theme).image
  video = (theme: ThemeOf<'element'>) => this.element(theme).video
  other = (theme: ThemeOf<'other'>) => found(this.definition.other?.[theme], theme)
  json = (theme: ThemeOf<'json'>) => found(this.definition.json?.[theme], theme)
  isImage = (data: T1) => this.definition.isImage(data)
  placeholder = (data: T1) => this.definition.placeholder(data)

  next = async (data: T1, param: SnapRenderNextParam): Promise<SnapRenderBaseUtils> => {
    const {
      scale,
      logger,
      output,
      ffmpegPath,
      ffprobePath,
      ffmpegTimeout,
      ffmpegAdditonalOption,
      font,
      width,
      translate,
    } = param
    if (!includeTheme(param.theme)) {
      throw new Error('No theme found')
    }

    const theme = param.theme
    const base = (path: FilePath) => {
      return [
        logger,
        new FileUtils(path),
        new VideoUtils({
          ffmpegTimeout,
          ffmpegPath,
          ffprobePath,
          ffmpegAdditonalOption,
        }),
        font,
        width,
      ] as const
    }

    const renderImage = async (name: FilePath, theme: ThemeOf<'element'>) => {
      const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme, scale}), translate)
      const element = await this.image(theme)(data, utils)
      await utils.file.saveImg(await utils.render(element))
      return utils
    }

    const renderVideo = async (name: FilePath, theme: ThemeOf<'element'>) => {
      const utils = new SnapRenderColorUtils(...base(name), new ElementColorUtils({theme, scale}), translate)
      await this.video(theme)(data, utils)
      return utils
    }

    const renderJson = async (name: FilePath, theme: ThemeOf<'json'>) => {
      const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme, scale}))
      const res = await this.json(theme)(data, utils)
      await utils.file.path.writeFile(JSON.stringify(res))
      return utils
    }

    if (hasKind(theme, 'element')) {
      if (this.isImage(data)) {
        const name = getName('image', this.placeholder(data), output, this.count++)
        if (name.isExtension('png')) {
          return renderImage(name, theme)
        }

        if (name.isExtension('')) {
          logger.hint('Output as png')
          return renderImage(name.update({extension: 'png'}), theme)
        }

        if (name.isImage()) {
          logger.hint(`Unsupported format: ${name.extension}, output as png`)
          return renderImage(name.update({extension: 'png'}), theme)
        }

        return renderVideo(name, theme)
      }

      const name = getName('video', this.placeholder(data), output, this.count++)
      if (name.isExtension('png')) {
        return renderImage(name, theme)
      }

      if (name.isExtension('')) {
        logger.hint('Output as mp4')
        return renderVideo(name.update({extension: 'mp4'}), theme)
      }

      if (name.isImage()) {
        logger.hint(`Unsupported format: ${name.extension}, output as png`)
        return renderImage(name.update({extension: 'png'}), theme)
      }

      return renderVideo(name, theme)
    }

    if (hasKind(theme, 'other')) {
      const name = getName('other', this.placeholder(data), output, this.count++)
      const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme, scale}))
      await this.other(theme)(data, utils, this.placeholder(data), output)
      return utils
    }

    // what is left is the json kind
    const name = getName('json', this.placeholder(data), output, this.count++)
    if (output === '{stdout}') {
      const utils = new SnapRenderUtils(...base(name), new ElementUtils({theme, scale}))
      utils.stdout = await this.json(theme)(data, utils)
      return utils
    }

    if (name.isExtension('json')) {
      return renderJson(name, theme)
    }

    if (name.isExtension('')) {
      logger.hint('Output as json')
      return renderJson(name.update({extension: 'json'}), theme)
    }

    logger.hint(`Unsupported format: ${name.extension}, output as json`)
    return renderJson(name.update({extension: ''}), theme)
  }
}
