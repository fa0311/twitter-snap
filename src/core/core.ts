import {ImageResponse} from '@vercel/og'
import {promises as fs} from 'node:fs'
import {Cookie, launch} from 'puppeteer'
import {TweetApiUtilsData, TwitterOpenApi, TwitterOpenApiClient} from 'twitter-openapi-typescript'
import {ThemeNameType, themeList} from 'twitter-snap-core'

import {GetTweetApi, ThemeParamType, getTweetList} from '../utils/types.js'

export const twitterSnapGuest = async () => {
  const twitter = new TwitterOpenApi()
  const api = await twitter.getGuestClient()
  return [tweetApiSnap(api), api] as const
}

export const twitterSnapPuppeteer = async (headless?: boolean, userDataDir?: string) => {
  const browser = await launch({
    headless,
    timeout: 0,
    userDataDir,
  })
  const [page] = await browser.pages()
  await page.goto('https://twitter.com/login')

  page.setDefaultNavigationTimeout(0)
  page.setDefaultTimeout(0)

  const pattern = 'https://twitter.com/i/api/graphql/[a-zA-Z0-9_-]+/HomeTimeline?.*'

  await page.waitForResponse((res) => new RegExp(pattern).test(res.url()))
  const cookies = await page.cookies()
  await browser.close()
  const twitter = new TwitterOpenApi()
  const api = await twitter.getClientFromCookies(
    Object.fromEntries(cookies.filter((e) => e.domain === '.twitter.com').map((e) => [e.name, e.value])),
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
      return Object.fromEntries(cookies.map((e) => [e.name, e.value]))
    }

    if (typeof parsed === 'object') {
      return parsed as {[key: string]: string}
    }

    throw new Error('Invalid cookies')
  })()

  const api = await twitter.getClientFromCookies(cookies)
  return [tweetApiSnap(api), api] as const
}

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']>[0]

export const getFonts: (fontPath: string) => Promise<Fonts[]> = async (fontPath) => {
  const base = 'https://github.com/fa0311/twitter-snap-core/releases/download/assets-fonts/'

  const list = [
    ['SEGOEUISL.TTF', 'segoeui', 500, 'normal'] as const,
    ['SEGOEUIB.TTF', 'segoeui', 700, 'normal'] as const,
    ['SEGUISLI.TTF', 'segoeui', 500, 'italic'] as const,
    ['SEGOEUIZ.TTF', 'segoeui', 700, 'italic'] as const,
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
  limit: number
  type?: 'getTweetResultByRestId' | keyof GetTweetApi
}

type handlerType = (e: ReturnType<typeof twitterRender>) => Promise<void>

const tweetApiSnap = (client: TwitterOpenApiClient) => {
  return async ({id, limit, type}: tweetApiSnapParam, handler: handlerType) => {
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

type HandlerTypeLiteral = 'image' | 'start' | 'video'
export type HandlerType = {id: string; type: HandlerTypeLiteral; user: string}

type twitterRenderParam = {
  handler?: (e: HandlerType) => void
  output: string
  themeName: ThemeNameType
  themeParam: ThemeParamType & {fonts: Fonts[]}
}

const twitterRender = (data: TweetApiUtilsData, count: number) => {
  const legacy = data.tweet.legacy!
  const extEntities = data.tweet.legacy?.extendedEntities
  const extMedia = extEntities?.media ?? []
  const isVideo = extMedia.some((e) => e.type !== 'photo')

  return async ({handler, output, themeName, themeParam}: twitterRenderParam) => {
    handler && handler({id: data.tweet.restId, type: 'start', user: data.user.legacy.screenName})
    const Theme = Object.entries(themeList).find(([k, _]) => k === themeName)![1]

    const getFileName = (isVideo: boolean) => {
      const replaceData = [
        ['{id}', data.tweet.restId],
        ['{user-screen-name}', data.user.legacy.screenName],
        ['{if-photo:(?<true>.+?):(?<false>.+?)}', isVideo ? '$2' : '$1'],
        ['{count}', count.toString()],
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
      ] as [string, string][]

      const repOutput = replaceData.reduce((acc, [k, v]) => acc.replaceAll(new RegExp(k, 'g'), v), output)
      const video = repOutput.split('.').pop() !== 'png'
      const pngOutput = video ? repOutput.split('.').slice(0, -1).join('.') + '.png' : repOutput
      return {pngOutput, repOutput, video}
    }

    const render = new Theme({
      ...themeParam,
      video: getFileName(isVideo).video,
    })

    const {pngOutput, repOutput, video} = getFileName(isVideo && render.videoRender !== undefined)

    handler && handler({id: data.tweet.restId, type: 'image', user: data.user.legacy.screenName})
    const element = render.imageRender({
      data,
    })

    const img = new ImageResponse(element, {
      emoji: 'twemoji',
      fonts: themeParam.fonts,
      height: undefined,
      width: themeParam.width,
    })

    const png = Buffer.from(await img.arrayBuffer())
    if (pngOutput.split('/').length > 1) {
      await fs.mkdir(pngOutput.split('/').slice(0, -1).join('/'), {recursive: true})
    }

    await fs.writeFile(pngOutput, png)

    if (video) {
      handler && handler({id: data.tweet.restId, type: 'video', user: data.user.legacy.screenName})
      const res = await render.videoRender!({
        data,
        image: pngOutput,
        output: repOutput,
      })
      return finalize([pngOutput, ...res.temp])
    }

    return finalize([])
  }
}

type FinalizeParam = {
  cleanup: boolean
}
const finalize = async (temp: string[]) => {
  return async ({cleanup}: FinalizeParam) => {
    if (cleanup) {
      await Promise.all(temp.map((e) => fs.rm(e)))
    }
  }
}
