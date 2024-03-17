import {ImageResponse} from '@vercel/og'
import {promises as fs} from 'node:fs'
import {Cookie, launch} from 'puppeteer'
import {TweetApiUtilsData, TwitterOpenApi, TwitterOpenApiClient} from 'twitter-openapi-typescript'
import {ThemeNameType, themeList} from 'twitter-snap-core'

import {GetTweetApi, ThemeParamType, getTweetList} from '../utils/types.js'

export const twitterSnapGuest = async () => {
  const twitter = new TwitterOpenApi()
  const api = await twitter.getGuestClient()
  return tweetApiSnap(api)
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
  const api = await twitter.getClientFromCookies(Object.fromEntries(cookies.map((e) => [e.name, e.value])))
  return tweetApiSnap(api)
}

export const twitterSnapCookies = async (path: string) => {
  const data = await fs.readFile(path, 'utf8')
  const cookies = JSON.parse(data) as Cookie[]
  const twitter = new TwitterOpenApi()
  const api = await twitter.getClientFromCookies(Object.fromEntries(cookies.map((e) => [e.name, e.value])))
  return tweetApiSnap(api)
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
      const cursor: string[] = []
      while (count < limit) {
        const res = await api({
          cursor: cursor.length > 0 ? cursor.pop() : undefined,
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

        if (res.data.cursor.bottom) {
          cursor.push(res.data.cursor.bottom?.value)
        } else {
          return
        }
      }
    } else {
      const res = await client.getDefaultApi().getTweetResultByRestId({
        tweetId: id,
      })
      if (res.data) await handler(twitterRender(res.data, 0))
    }
  }
}

type HandlerTypeLiteral = 'image' | 'start' | 'video'
export type HandlerType = {id: string; type: HandlerTypeLiteral; user: string}

type twitterRenderParam = {
  handler?: (e: HandlerType) => void
  output: string
  themeName: ThemeNameType
  themeParam: ThemeParamType
}

const twitterRender = (data: TweetApiUtilsData, count: number) => {
  const legacy = data.tweet.legacy!
  const extEntities = data.tweet.legacy?.extendedEntities
  const extMedia = extEntities?.media ?? []
  const isVideoData = extMedia.some((e) => e.type !== 'photo')

  return async ({handler, output, themeName, themeParam}: twitterRenderParam) => {
    handler && handler({id: data.tweet.restId, type: 'start', user: data.user.legacy.screenName})
    const Theme = Object.entries(themeList).find(([k, _]) => k === themeName)![1]

    const replacData = [
      ['{id}', data.tweet.restId],
      ['{user-screen-name}', data.user.legacy.screenName],
      ['{if-photo:(?<true>.+?):(?<false>.+?)}', isVideoData ? '$2' : '$1'],
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

    const repOutput = replacData.reduce((acc, [k, v]) => acc.replaceAll(new RegExp(k, 'g'), v), output)
    const video = repOutput.split('.').pop() !== 'png'
    const pngOutput = video ? repOutput.replace(/\.\w+$/, '.png') : repOutput

    const render = new Theme({
      ...themeParam,
      video,
    })

    handler && handler({id: data.tweet.restId, type: 'image', user: data.user.legacy.screenName})
    const element = render.imageRender({
      data,
    })

    const img = new ImageResponse(element, {
      emoji: 'twemoji',
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
      const res = await render.videoRender({
        data,
        image: pngOutput,
        output: repOutput,
      })
      return finalize(res.temp)
    }

    return finalize([])
  }
}

type FinalizeParam = {
  cleanup: boolean
}
const finalize =
  async (temp: string[]) =>
  async ({cleanup}: FinalizeParam) => {
    if (cleanup) {
      await Promise.all(temp.map((e) => fs.rm(e)))
    }
  }
