import {ImageResponse} from '@vercel/og'
import {promises as fs} from 'fs'
import {TweetApiUtilsData, TwitterOpenApi, TwitterOpenApiClient} from 'twitter-openapi-typescript'

import {GetTweetApi, ThemeNameType, ThemeParamType, getTweetList, themeList} from '../utils/types.js'

type twitterClientParam = {
  cookies?: {[key: string]: string}
}

export const twitterSnap = async ({cookies}: twitterClientParam) => {
  const twitter = new TwitterOpenApi()
  const api = cookies ? await twitter.getClientFromCookies(cookies) : await twitter.getGuestClient()
  return tweetApiSnap(api)
}

type tweetApiSnapParam = {
  id: string
  type?: 'getTweetResultByRestId' | keyof GetTweetApi
  max: number
}

const tweetApiSnap = (client: TwitterOpenApiClient) => {
  return async (
    {id, type, max}: tweetApiSnapParam,
    handler: (e: ReturnType<typeof twitterRender>) => Promise<void>,
  ) => {
    const key = getTweetList.find((k) => k == type)
    if (key) {
      const that = client.getTweetApi()
      const api = that[key].bind(that)
      let count = 0
      const cursor: string[] = []
      while (count < max) {
        const res = await api({
          focalTweetId: id,
          rawQuery: id,
          listId: id,
          userId: id,
          cursor: cursor.length ? cursor.pop() : undefined,
        })
        while (count < max) {
          await handler(twitterRender(res.data.data[count]))
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

type twitterRenderParam = {
  themeName: ThemeNameType
  themeParam: ThemeParamType
  output: string
}

const twitterRender = (data: TweetApiUtilsData) => {
  const extEntities = data.tweet.legacy?.extendedEntities
  const extMedia = extEntities?.media ?? []
  const isVideoData = !!extMedia.find((e) => e.type !== 'photo')

  return async ({themeName, themeParam, output}: twitterRenderParam) => {
    const theme = Object.entries(themeList).find(([k, _]) => k == themeName)?.[1]!

    const replacData = [
      ['{id}', data.tweet.restId],
      ['{if-photo:(?<true>.+?):(?<false>.+?)}', isVideoData ? '$2' : '$1'],
    ] as [string, string][]

    const repOutput = replacData.reduce((acc, [k, v]) => acc.replace(new RegExp(k, 'g'), v), output)
    const video = repOutput.split('.').pop() != 'png'
    const pngOutput = video ? repOutput.replace(/\.\w+$/, '.png') : repOutput

    const render = new theme({
      ...themeParam,
      video: video,
    })
    const element = render.imageRender({
      data: data,
    })

    const img = new ImageResponse(element, {
      width: themeParam.width,
      height: undefined,
      emoji: 'twemoji',
    })

    const png = Buffer.from(await img.arrayBuffer())
    await fs.writeFile(pngOutput, png)

    if (video) {
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
