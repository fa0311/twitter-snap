import {TweetApiUtils} from 'twitter-openapi-typescript'
import {RenderBasic} from 'twitter-snap-core'

export type GetTweetApi = {
  [K in keyof TweetApiUtils as K extends `get${infer Rest}` ? K : never]: TweetApiUtils[K]
}

const getTweetApi = Object.keys(TweetApiUtils.prototype).filter((k) => k.startsWith('get'))

export const getTweetList = getTweetApi as (keyof GetTweetApi)[]

export const themeList = {RenderBasic} as const
export type ThemeNameType = keyof typeof themeList

type ConstructorParametersType<T> = T extends new (...args: infer U) => any ? U[0] : never
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type ThemeList = (typeof themeList)[keyof typeof themeList]

type ThemeParamTypeRaw = UnionToIntersection<ConstructorParametersType<ThemeList>>
export type ThemeParamType = Omit<ThemeParamTypeRaw, 'ffmpeg' | 'video'>
