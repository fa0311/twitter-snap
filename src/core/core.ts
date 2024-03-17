import {ImageResponse} from '@vercel/og'
import {promises as fs} from 'fs'
import {TweetApiUtilsData, TwitterOpenApi, TwitterOpenApiClient} from 'twitter-openapi-typescript'

import puppeteer, {Cookie} from 'puppeteer'
import {ThemeNameType, themeList} from 'twitter-snap-core'
import {GetTweetApi, ThemeParamType, getTweetList} from '../utils/types.js'

export const twitterSnapGuest = async () => {
  const twitter = new TwitterOpenApi()
  const api = await twitter.getGuestClient()
  return tweetApiSnap(api)
}

export const twitterSnapPuppeteer = async (headless?: boolean, userDataDir?: string) => {
  const browser = await puppeteer.launch({
    headless: headless,
    timeout: 0,
    userDataDir: userDataDir,
  })
  const [page] = await browser.pages()
  await page.goto('https://twitter.com/login')

  page.setDefaultNavigationTimeout(0)
  page.setDefaultTimeout(0)

  await page.waitForResponse((res) => {
    return RegExp('https://twitter.com/i/api/graphql/[a-zA-Z0-9_-]+/HomeTimeline?.*').test(res.url())
  })
  const cookies = await page.cookies()
  await browser.close()
  const twitter = new TwitterOpenApi()
  const api = await twitter.getClientFromCookies(cookies.reduce((acc, e) => ({...acc, [e.name]: e.value}), {}))
  return tweetApiSnap(api)
}

export const twitterSnapCookies = async (path: string) => {
  const data = await fs.readFile(path, 'utf-8')
  const cookies = JSON.parse(data) as Cookie[]
  const twitter = new TwitterOpenApi()
  const api = await twitter.getClientFromCookies(cookies.reduce((acc, e) => ({...acc, [e.name]: e.value}), {}))
  return tweetApiSnap(api)
}

type tweetApiSnapParam = {
  id: string
  type?: 'getTweetResultByRestId' | keyof GetTweetApi
  limit: number
}

const tweetApiSnap = (client: TwitterOpenApiClient) => {
  return async (
    {id, type, limit}: tweetApiSnapParam,
    handler: (e: ReturnType<typeof twitterRender>) => Promise<void>,
  ) => {
    const key = getTweetList.find((k) => k == type)
    if (key) {
      const that = client.getTweetApi()
      const api = that[key].bind(that)
      let count = 0
      const cursor: string[] = []
      while (count < limit) {
        const res = await api({
          focalTweetId: id,
          rawQuery: id,
          listId: id,
          userId: id,
          cursor: cursor.length ? cursor.pop() : undefined,
        })

        for (const e of res.data.data) {
          if (e.promotedMetadata) continue
          if (count >= limit) return
          await handler(twitterRender(e))
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
      if (res.data) await handler(twitterRender(res.data))
    }
  }
}

type HandlerTypeLiteral = 'start' | 'image' | 'video'
export type HandlerType = {type: HandlerTypeLiteral; user: string; id: string}

type twitterRenderParam = {
  themeName: ThemeNameType
  themeParam: ThemeParamType
  output: string
  handler?: (e: HandlerType) => void
}

const twitterRender = (data: TweetApiUtilsData) => {
  const extEntities = data.tweet.legacy?.extendedEntities
  const extMedia = extEntities?.media ?? []
  const isVideoData = !!extMedia.find((e) => e.type !== 'photo')

  return async ({themeName, themeParam, output, handler}: twitterRenderParam) => {
    handler && handler({type: 'start', user: data.user.legacy.screenName, id: data.tweet.restId})
    const theme = Object.entries(themeList).find(([k, _]) => k == themeName)?.[1]!

    const replacData = [
      ['{id}', data.tweet.restId],
      ['{user-screen-name}', data.user.legacy.screenName],
      ['{if-photo:(?<true>.+?):(?<false>.+?)}', isVideoData ? '$2' : '$1'],
    ] as [string, string][]

    const repOutput = replacData.reduce((acc, [k, v]) => acc.replace(new RegExp(k, 'g'), v), output)
    const video = repOutput.split('.').pop() != 'png'
    const pngOutput = video ? repOutput.replace(/\.\w+$/, '.png') : repOutput

    const render = new theme({
      ...themeParam,
      video: video,
    })

    handler && handler({type: 'image', user: data.user.legacy.screenName, id: data.tweet.restId})
    const element = render.imageRender({
      data: data,
    })

    const img = new ImageResponse(element, {
      width: themeParam.width,
      height: undefined,
      emoji: 'twemoji',
    })

    const png = Buffer.from(await img.arrayBuffer())
    if (pngOutput.split('/').length > 1) {
      await fs.mkdir(pngOutput.split('/').slice(0, -1).join('/'), {recursive: true})
    }
    await fs.writeFile(pngOutput, png)

    if (video) {
      handler && handler({type: 'video', user: data.user.legacy.screenName, id: data.tweet.restId})
      const res = await render.videoRender({
        data: data,
        image: pngOutput,
        output: repOutput,
      })
      return finalize(res.temp)
    } else {
      return finalize([])
    }
  }
}

type FinalizeParam = {
  cleanup: boolean
}
const finalize = async (temp: string[]) => {
  return async ({cleanup}: FinalizeParam) => {
    if (cleanup) {
      temp.forEach(async (e) => await fs.unlink(e))
    }
  }
}
