import {parse} from '@twemoji/parser'
import type {ReactElement} from 'react'
import satori from 'satori'
import sharp from 'sharp'

import type {ElementColorUtils, ElementUtils} from './element.js'
import type {FileUtils} from './file.js'
import type {Font} from './font.js'
import type {Logger} from './logger.js'
import type {VideoUtils} from './video.js'

// Google Fonts family for each language code satori reports for a grapheme its fonts cannot draw
const fallbackFamily: Record<string, string> = {
  'ja-JP': 'Noto Sans JP',
  'ko-KR': 'Noto Sans KR',
  'zh-CN': 'Noto Sans SC',
  'zh-TW': 'Noto Sans TC',
  'zh-HK': 'Noto Sans HK',
  'th-TH': 'Noto Sans Thai',
  'bn-IN': 'Noto Sans Bengali',
  'ar-AR': 'Noto Sans Arabic',
  'ta-IN': 'Noto Sans Tamil',
  'ml-IN': 'Noto Sans Malayalam',
  'he-IL': 'Noto Sans Hebrew',
  'te-IN': 'Noto Sans Telugu',
  devanagari: 'Noto Sans Devanagari',
  kannada: 'Noto Sans Kannada',
  symbol: 'Noto Sans Symbols',
  math: 'Noto Sans Math',
  unknown: 'Noto Sans',
}

const emojiImage = async (segment: string) => {
  const [emoji] = parse(segment)
  const svg = await (await fetch(emoji.url)).text()
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

const googleFont = async (family: string, text: string) => {
  const url = new URL('https://fonts.googleapis.com/css2')
  url.search = new URLSearchParams({family, text}).toString()
  // an old browser, so that the CSS points at a TTF
  const css = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8)'}})
  const src = (await css.text()).match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  const font = src ? await fetch(src) : undefined
  if (!font?.ok) throw new Error(`Google Fonts has no ${family} for ${text}`)
  return font.arrayBuffer()
}

const fallbackFonts = (code: string, segment: string): Promise<Font[]> => {
  const langs = code.split('|').filter((lang) => lang in fallbackFamily)
  return Promise.all(
    langs.map(async (lang) => ({
      name: `fallback ${lang} ${segment}`,
      data: await googleFont(fallbackFamily[lang], segment),
      weight: 400 as const,
      style: 'normal' as const,
      lang: lang === 'unknown' ? undefined : lang,
    })),
  )
}

const assets = new Map<string, Promise<string | Font[]>>()

// satori asks once per grapheme its fonts cannot draw: emoji become twemoji images, other scripts
// get a Noto subset from Google Fonts; what neither has stays blank
const loadAdditionalAsset = (code: string, segment: string) => {
  const key = `${code} ${segment}`
  const asset =
    assets.get(key) ?? (code === 'emoji' ? emojiImage(segment) : fallbackFonts(code, segment)).catch(() => [])
  assets.set(key, asset)
  return asset
}

export const renderPng = async (element: ReactElement, options: {width: number; height?: number; fonts: Font[]}) => {
  const svg = await satori(element, {...options, loadAdditionalAsset})
  return sharp(Buffer.from(svg)).resize(options.width).png().toBuffer()
}

export class SnapRenderBaseUtils {
  public stdout: unknown = undefined
  constructor(
    public logger: Logger,
    public file: FileUtils,
    public video: VideoUtils,
    public fonts: Font[],
    public width: number,
    public translate?: string,
  ) {}

  render = async (element: ReactElement) => {
    return renderPng(element, {width: this.width, fonts: this.fonts})
  }
}

export class SnapRenderUtils extends SnapRenderBaseUtils {
  constructor(
    logger: Logger,
    file: FileUtils,
    video: VideoUtils,
    fonts: Font[],
    width: number,
    public element: ElementUtils,
    translate?: string,
  ) {
    super(logger, file, video, fonts, width, translate)
  }
}

export class SnapRenderColorUtils extends SnapRenderBaseUtils {
  constructor(
    logger: Logger,
    file: FileUtils,
    video: VideoUtils,
    fonts: Font[],
    width: number,
    public element: ElementColorUtils,
    translate?: string,
  ) {
    super(logger, file, video, fonts, width, translate)
  }
}
