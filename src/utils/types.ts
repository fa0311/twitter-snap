import {TweetApiUtils} from 'twitter-openapi-typescript'
import {ThemeParam} from 'twitter-snap-core'

export type GetTweetApi = {
  [K in keyof TweetApiUtils as K extends `get${infer Rest}` ? K : never]: TweetApiUtils[K]
}

const getTweetApi = Object.keys(TweetApiUtils.prototype).filter((k) => k.startsWith('get'))

export const getTweetList = getTweetApi as (keyof GetTweetApi)[]

export type ThemeParamType = Omit<ThemeParam, 'ffmpeg' | 'video'>
