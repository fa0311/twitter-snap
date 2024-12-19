import {ImageResponse} from '@vercel/og'
import {promises as fs} from 'node:fs'
import {Cookie, launch} from 'puppeteer'
import {
  TweetApiUtilsData,
  TwitterOpenApi,
  TwitterOpenApiClient,
  instructionConverter,
  instructionToEntry,
  tweetEntriesConverter,
} from 'twitter-openapi-typescript'
import {InstructionUnionFromJSON} from 'twitter-openapi-typescript-generated'
import {ThemeNameType, themeList} from 'twitter-snap-core'

import {toLiteJson} from '../utils/liteJson.js'
import {findNodeByKey} from '../utils/node.js'
import {GetTweetApi, ThemeParamType, getTweetList} from '../utils/types.js'

export const twitterSnapGuest = async () => {
  const twitter = new TwitterOpenApi()
  const api = await twitter.getGuestClient()
  return [tweetApiSnap(api), api] as const
}

export const twitterDomains = ['twitter.com', 'x.com'] as const
const twitterDomainsPattern = new RegExp(`(${twitterDomains.join('|')})`)
const allowDomains = twitterDomains.map((e) => `.${e}`)

export const additonalTheme = ['MediaOnly', 'Json', 'LiteJson'] as const
export type AdditonalThemeType = (typeof additonalTheme)[number]

export const sessionType = ['browser', 'file', 'guest'] as const
export type SessionType = (typeof sessionType)[number]

export const twitterSnapPuppeteer = async (headless?: boolean, userDataDir?: string) => {
  const browser = await launch({
    headless,
    timeout: 0,
    userDataDir,
  })
  const [page] = await browser.pages()
  await page.goto('https://x.com/login')

  page.setDefaultNavigationTimeout(0)
  page.setDefaultTimeout(0)

  const pattern = `https://${twitterDomainsPattern.source}/i/api/graphql/[a-zA-Z0-9_-]+/HomeTimeline?.*`

  await page.waitForResponse((res) => new RegExp(pattern).test(res.url()))
  const cookies = await page.cookies()
  await browser.close()
  const twitter = new TwitterOpenApi()
  const api = await twitter.getClientFromCookies(
    Object.fromEntries(cookies.filter((e) => allowDomains.includes(e.domain)).map((e) => [e.name, e.value])),
  )
  return [tweetApiSnap(api), api] as const
}

export const twitterSnapCookies = async (path: string) => {
  const data = await fs.readFile(path, 'utf8')
  const twitter = new TwitterOpenApi()

  const cookies = await (async () => {
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) {
      const cookies = parsed as Cookie[]
      return Object.fromEntries(cookies.filter((e) => allowDomains.includes(e.domain)).map((e) => [e.name, e.value]))
    }

    if (typeof parsed === 'object') {
      return parsed as {[key: string]: string}
    }

    throw new Error('Invalid cookies')
  })()
  const api = await twitter.getClientFromCookies(cookies)
  return [tweetApiSnap(api), api] as const
}

export const twitterSnapFromJson = (json: any) => {
  const instructionsAny = findNodeByKey([json], 'instructions')
  if (Array.isArray(instructionsAny)) {
    try {
      const instructions = instructionsAny.map((e: any) => InstructionUnionFromJSON(e))
      const entry = instructionToEntry(instructions)
      const data = [...tweetEntriesConverter(entry), ...instructionConverter(instructions)]
      return tweetApiSnapOffline(data)
    } catch (error) {
      throw new Error('Invalid JSON')
    }
  } else {
    throw new Error('Invalid JSON')
  }
}

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']>[0]

export const getFonts: (fontPath: string) => Promise<Fonts[]> = async (fontPath) => {
  const base = 'https://github.com/fa0311/twitter-snap-core/releases/download/assets-fonts/'

  const list = [
    ['SEGOEUISL.TTF', 'Segoe UI', 500, 'normal'] as const,
    ['SEGOEUIB.TTF', 'Segoe UI', 700, 'normal'] as const,
    ['SEGUISLI.TTF', 'Segoe UI', 500, 'italic'] as const,
    ['SEGOEUIZ.TTF', 'Segoe UI', 700, 'italic'] as const,
    ['Meiryo.ttf', 'Meiryo', 500, 'normal'] as const,
    ['Meiryo-Bold.ttf', 'Meiryo', 700, 'normal'] as const,
    ['Meiryo-Italic.ttf', 'Meiryo', 500, 'italic'] as const,
    ['Meiryo-BoldItalic.ttf', 'Meiryo', 700, 'italic'] as const,
  ]

  fs.mkdir(fontPath, {recursive: true})

  const fonts = list.map(async ([file, name, weight, style]) => {
    const path = `${fontPath}/${file}`
    try {
      const data = await fs.readFile(path)
      return {data, name, style, weight}
    } catch {
      const url = `${base}${file}`
      const res = await fetch(url)
      const data = await res.arrayBuffer()
      await fs.writeFile(path, Buffer.from(data))
      return {data, name, style, weight}
    }
  })

  return Promise.all(fonts)
}

type tweetApiSnapParam = {
  id: string
  startId?: string
  limit: number
  type?: 'getTweetResultByRestId' | keyof GetTweetApi
}

type handlerType = (e: ReturnType<typeof twitterRender>) => Promise<void>

const tweetApiSnapOffline = (data: TweetApiUtilsData[]) => {
  return async ({limit, startId}: tweetApiSnapParam, handler: handlerType) => {
    let count = 0
    for (const e of data) {
      if (count == 0 && e.tweet.restId !== startId && startId) continue
      if (count >= limit) return
      await handler(twitterRender(e, count))
      count++
    }
  }
}

const tweetApiSnap = (client: TwitterOpenApiClient) => {
  return async ({id, limit, type, startId}: tweetApiSnapParam, handler: handlerType) => {
    const key = getTweetList.find((k) => k === type)

    if (key) {
      const that = client.getTweetApi()
      const api = that[key].bind(that)
      let count = 0
      let cursor: string | undefined
      while (count < limit) {
        const res = await api({
          cursor,
          focalTweetId: id,
          listId: id,
          rawQuery: id,
          userId: id,
        })

        for (const e of res.data.data) {
          if (count == 0 && e.tweet.restId !== startId && startId) continue
          if (e.promotedMetadata) continue
          if (count >= limit) return
          await handler(twitterRender(e, count))
          count++
        }

        if (res.data.data.length === 0) {
          return
        }

        if (res.data.cursor.bottom) {
          cursor = res.data.cursor.bottom.value
        } else {
          return
        }
      }
    } else {
      const res = await client.getDefaultApi().getTweetResultByRestId({
        tweetId: id,
      })
      if (res.data) {
        await handler(twitterRender(res.data, 0))
      }
    }
  }
}

type getFileNameParam = {
  output: string
  data: TweetApiUtilsData
  count: number
}

type OutputType = 'image' | 'video' | 'other'

const getFileNameInit = ({output, data, count}: getFileNameParam) => {
  return (media: number | undefined, outputType: OutputType) => {
    const legacy = data.tweet.legacy!
    const mediaData = media === undefined ? undefined : legacy.extendedEntities!.media[media]
    const videoInfo = (() => {
      const a = [...(mediaData?.videoInfo?.variants ?? [])].sort((a, b) => {
        if (a.bitrate === undefined) return 1
        if (b.bitrate === undefined) return -1
        return b.bitrate - a.bitrate
      })
      return a.length === 0 ? undefined : a[0]
    })()
    const if2 = (e: string) => `{${e}:(?<a>[^{}]*?):(?<b>[^{}]*?)}`

    const replaceData = [
      ['{id}', data.tweet.restId],
      ['{user-screen-name}', data.user.legacy.screenName],
      ['{user-id}', data.user.restId],
      [if2('if-photo'), outputType === 'image' ? '$1' : '$2'],
      [if2('if-video'), outputType === 'video' ? '$1' : '$2'],
      [if2('if-other'), outputType === 'other' ? '$1' : '$2'],
      ['{count}', count.toString()],
      [if2('if-media-only'), media === undefined ? '$2' : '$1'],
      ['{media-count}', media],
      ['{media-id}', mediaData?.idStr],
      ['{media-video-variants-id}', videoInfo?.url.split('/').pop()!.split('.')[0]],
      ['{media-video-bitrate}', videoInfo?.bitrate],
      ['{time-now-yyyy}', new Date().getFullYear().toString().padStart(4, '0')],
      ['{time-now-mm}', (new Date().getMonth() + 1).toString().padStart(2, '0')],
      ['{time-now-dd}', new Date().getDate().toString().padStart(2, '0')],
      ['{time-now-hh}', new Date().getHours().toString().padStart(2, '0')],
      ['{time-now-mi}', new Date().getMinutes().toString().padStart(2, '0')],
      ['{time-now-ss}', new Date().getSeconds().toString().padStart(2, '0')],
      ['{time-tweet-yyyy}', new Date(legacy.createdAt).getFullYear().toString().padStart(4, '0')],
      ['{time-tweet-mm}', (new Date(legacy.createdAt).getMonth() + 1).toString().padStart(2, '0')],
      ['{time-tweet-dd}', new Date(legacy.createdAt).getDate().toString().padStart(2, '0')],
      ['{time-tweet-hh}', new Date(legacy.createdAt).getHours().toString().padStart(2, '0')],
      ['{time-tweet-mi}', new Date(legacy.createdAt).getMinutes().toString().padStart(2, '0')],
      ['{time-tweet-ss}', new Date(legacy.createdAt).getSeconds().toString().padStart(2, '0')],
      ['{stdout}', '{stdout}'],
    ] as [string, string | number | undefined][]

    const replaceLast = [
      ['{curly-brace-open}', '{'],
      ['{curly-brace-close}', '}'],
    ]

    const repOutput = (() => {
      const s = (e: string | number | undefined) => (e === undefined ? '' : e.toString())
      const list = ['', output]
      while (list[list.length - 1] !== list[list.length - 2]) {
        list.push(replaceData.reduce((acc, [k, v]) => acc.replaceAll(new RegExp(k, 'g'), s(v)), list[list.length - 1]))
      }
      return replaceLast.reduce((acc, [k, v]) => acc.replaceAll(new RegExp(k, 'g'), s(v)), list[list.length - 1])
    })()

    const video = repOutput.split('.').pop() !== 'png'
    const nameOutput = repOutput.split('.').slice(0, -1).join('.')
    const pngOutput = video ? nameOutput + '.png' : repOutput
    return {pngOutput, repOutput, nameOutput, video}
  }
}

type HandlerTypeLiteral = 'image' | 'start' | 'video'
export type HandlerType = {id: string; type: HandlerTypeLiteral; user: string}

type twitterRenderParam = {
  handler?: (e: HandlerType) => void
  output: string
  themeName: ThemeNameType | AdditonalThemeType
  themeParam: ThemeParamType & {fonts: Fonts[]}
}

const twitterRender = (data: TweetApiUtilsData, count: number) => {
  const extEntities = data.tweet.legacy?.extendedEntities
  const extMedia = extEntities?.media ?? []

  return async ({handler, output, themeName, themeParam}: twitterRenderParam) => {
    handler && handler({id: data.tweet.restId, type: 'start', user: data.user.legacy.screenName})
    const out = output.includes('.') ? output : `${output}.{if-photo:png:mp4}`

    const getFileName = getFileNameInit({output: out, data, count})
    if (themeName === 'MediaOnly') {
      const downloader = extMedia.map(async (e, count) => {
        const isVideo = e.type !== 'photo'
        const {pngOutput, repOutput, video} = getFileName(count, isVideo ? 'video' : 'image')
        const url = (() => {
          if (!isVideo && !video) {
            return e.mediaUrlHttps
          } else if (isVideo && video) {
            return [...e.videoInfo!.variants].sort((a, b) => {
              if (a.bitrate === undefined) return 1
              if (b.bitrate === undefined) return -1
              return b.bitrate - a.bitrate
            })[0].url
          }
        })()
        if (url) {
          const res = await fetch(url)
          const buffer = await res.arrayBuffer()
          if (repOutput.split('/').length > 1) {
            await fs.mkdir(repOutput.split('/').slice(0, -1).join('/'), {recursive: true})
          }
          await fs.writeFile(repOutput, Buffer.from(buffer))
        }
      })
      await Promise.all(downloader)
    } else if (themeName === 'Json') {
      const {nameOutput} = getFileName(undefined, 'other')
      if (nameOutput === '{stdout}') {
        return finalize({data: toLiteJson(data)})
      } else {
        if (nameOutput.split('/').length > 1) {
          await fs.mkdir(nameOutput.split('/').slice(0, -1).join('/'), {recursive: true})
        }
        await fs.writeFile(nameOutput + '.json', JSON.stringify(data, null, 2))
      }
    } else if (themeName === 'LiteJson') {
      const {nameOutput} = getFileName(undefined, 'other')
      if (nameOutput === '{stdout}') {
        return finalize({data: toLiteJson(data)})
      } else {
        if (nameOutput.split('/').length > 1) {
          await fs.mkdir(nameOutput.split('/').slice(0, -1).join('/'), {recursive: true})
        }
        await fs.writeFile(nameOutput + '.json', JSON.stringify(toLiteJson(data), null, 2))
      }
    } else {
      const Theme = Object.entries(themeList).find(([k, _]) => k === themeName)![1]
      const isVideo = extMedia.some((e) => e.type !== 'photo')

      const render = new Theme({
        ...themeParam,
        video: getFileName(undefined, isVideo ? 'video' : 'image').video,
      })

      const videoRend = isVideo && render.videoRender !== undefined
      const {pngOutput, repOutput, video} = getFileName(undefined, videoRend ? 'video' : 'image')

      handler && handler({id: data.tweet.restId, type: 'image', user: data.user.legacy.screenName})
      const element = render.imageRender({data})

      const img = new ImageResponse(element, {
        emoji: 'twemoji',
        fonts: themeParam.fonts,
        height: undefined,
        width: themeParam.width,
      })

      const png = Buffer.from(await img.arrayBuffer())
      const dirname = pngOutput.split('/').slice(0, -1).join('/')
      const reqdirname = repOutput.split('/').slice(0, -1).join('/')
      const filename = pngOutput.split('/').pop()!
      if (dirname) {
        await fs.mkdir(dirname, {recursive: true})
      }
      if (reqdirname) {
        await fs.mkdir(reqdirname, {recursive: true})
      }
      if (video) {
        const inputPng = `${dirname}/temp-${filename}`
        await fs.writeFile(inputPng, png)
        handler && handler({id: data.tweet.restId, type: 'video', user: data.user.legacy.screenName})
        const res = await render.videoRender!({
          data,
          image: inputPng,
          output: repOutput,
        })
        return finalize({temp: [inputPng, ...res.temp]})
      } else {
        await fs.writeFile(pngOutput, png)
      }
    }
    return finalize({})
  }
}

type FinalizeParam = {
  cleanup: boolean
  stdout?: (e: any) => void
}

type FinalizeInput = {
  temp?: string[]
  data?: any
}

const finalize = async ({temp, data}: FinalizeInput) => {
  return async ({cleanup, stdout}: FinalizeParam) => {
    if (cleanup) {
      await Promise.all((temp ?? []).map((e) => fs.rm(e)))
    }
    if (stdout && data) {
      stdout(data)
    }
  }
}
