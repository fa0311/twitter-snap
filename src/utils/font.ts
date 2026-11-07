import fs from 'node:fs/promises'
import type {Font} from 'satori'

import {DirectoryPath, FilePath} from './path.js'

export type FontTextOptions = Font

export type FontOptions = {
  text: FontTextOptions[] | undefined
}

export type FontUtilsOptions = {
  dir?: DirectoryPath
}

export class FontUtils {
  public dir: DirectoryPath

  constructor(param: FontUtilsOptions) {
    this.dir = param.dir ?? DirectoryPath.from('~/.cache/twitter-snap/fonts')
  }

  async getFonts(file: string, fetch: () => Promise<ArrayBuffer>) {
    const path = FilePath.fromDirectory(this.dir.toString(), file)
    try {
      return await fs.readFile(path.toString())
    } catch {
      const data = await fetch()
      await path.writeFile(Buffer.from(data))
      return data
    }
  }
}

const fontBase = 'https://github.com/fa0311/twitter-snap-core/releases/download/assets-fonts/'
const fontList = [
  ['SEGOEUISL.TTF', 'Segoe UI', 500, 'normal'],
  ['SEGOEUIB.TTF', 'Segoe UI', 700, 'normal'],
  ['SEGUISLI.TTF', 'Segoe UI', 500, 'italic'],
  ['SEGOEUIZ.TTF', 'Segoe UI', 700, 'italic'],
  ['Meiryo.ttf', 'Meiryo', 500, 'normal'],
  ['Meiryo-Bold.ttf', 'Meiryo', 700, 'normal'],
  ['Meiryo-Italic.ttf', 'Meiryo', 500, 'italic'],
  ['Meiryo-BoldItalic.ttf', 'Meiryo', 700, 'italic'],
] as const

export const loadFonts = (utils: FontUtils): Promise<Font[]> => {
  return Promise.all(
    fontList.map(async ([file, name, weight, style]) => {
      const data = await utils.getFonts(file, async () => (await fetch(`${fontBase}${file}`)).arrayBuffer())
      return {data, name, weight, style}
    }),
  )
}

// Google Fonts family for each language code satori asks for (the same map @vercel/og used)
const fallbackFamily: Record<string, string> = {
  'ja-JP': 'Noto+Sans+JP',
  'ko-KR': 'Noto+Sans+KR',
  'zh-CN': 'Noto+Sans+SC',
  'zh-TW': 'Noto+Sans+TC',
  'zh-HK': 'Noto+Sans+HK',
  'th-TH': 'Noto+Sans+Thai',
  'bn-IN': 'Noto+Sans+Bengali',
  'ar-AR': 'Noto+Sans+Arabic',
  'ta-IN': 'Noto+Sans+Tamil',
  'ml-IN': 'Noto+Sans+Malayalam',
  'he-IL': 'Noto+Sans+Hebrew',
  'te-IN': 'Noto+Sans+Telugu',
  devanagari: 'Noto+Sans+Devanagari',
  kannada: 'Noto+Sans+Kannada',
  symbol: 'Noto+Sans+Symbols',
  math: 'Noto+Sans+Math',
  unknown: 'Noto+Sans',
}

const twemoji = (segment: string) => {
  const text = segment.includes('\u200d') ? segment : segment.replaceAll('\ufe0f', '')
  const code = [...text].map((char) => char.codePointAt(0)?.toString(16)).join('-')
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`
}

const googleFont = async (family: string, text: string) => {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`, {
    // an old browser, so that the CSS points at a TTF
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
    },
  })
  const url = (await css.text()).match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!url) throw new Error(`Failed to download dynamic font ${family}`)
  const font = await fetch(url)
  if (!font.ok) throw new Error(`Failed to download dynamic font ${family}: ${font.status}`)
  return font.arrayBuffer()
}

const assets = new Map<string, Promise<string | Font[]>>()

// satori calls this for every grapheme the given fonts cannot draw: emoji become twemoji images,
// other scripts get a Noto font from Google Fonts
export const loadAdditionalAsset = (code: string, segment: string) => {
  const key = `${code} ${segment}`
  const asset =
    assets.get(key) ??
    (async (): Promise<string | Font[]> => {
      if (code === 'emoji') {
        const svg = await (await fetch(twemoji(segment))).text()
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      }
      const fonts = code
        .split('|')
        .flatMap((lang) => (fallbackFamily[lang] ? [{lang, family: fallbackFamily[lang]}] : []))
      return Promise.all(
        fonts.map(async ({lang, family}) => ({
          name: `satori_${lang}_fallback_${segment}`,
          data: await googleFont(family, segment),
          weight: 400 as const,
          style: 'normal' as const,
          lang: lang === 'unknown' ? undefined : lang,
        })),
      ).catch(() => []) // no font for this script: satori draws tofu, as @vercel/og did
    })()
  assets.set(key, asset)
  return asset
}
