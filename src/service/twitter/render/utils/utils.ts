import type {CSSProperties, ReactElement} from 'react'
import type {TweetApiUtilsData} from 'twitter-openapi-typescript'
import type {MediaVideoInfo, User} from 'twitter-openapi-typescript-generated'

export type RenderWidgetType<T> = (props: T) => ReactElement
export type RenderCssType<T> = (props: T) => CSSProperties

export const getVideo = (videoInfo: MediaVideoInfo) => {
  return [...videoInfo.variants].sort((a, b) => {
    if (a.bitrate === undefined) return 1
    if (b.bitrate === undefined) return -1
    return b.bitrate - a.bitrate
  })[0]
}

export const getUserName = (user: User) => user.core?.name ?? ''

export const getUserScreenName = (user: User) => user.core?.screenName ?? ''

export const getUserAvatarUrl = (user: User) => user.avatar?.imageUrl

export const getUserVerifiedType = (user: User) => user.verification?.verifiedType

export const getUserVerified = (user: User) => user.verification?.verified ?? false

export type LiteJson = {
  user: {
    id: string
    name: string
    followersCount: number | undefined
    followingCount: number | undefined
    description: string | undefined
    createAt: string | undefined
  }
  tweet: {
    id: string
    text: string | undefined
    createdAt: string | undefined
    replyCount: number | undefined
    retweetCount: number | undefined
    likeCount: number | undefined
    quoteCount: number | undefined
  }
  replies: LiteJson[] | undefined
  quoted: LiteJson | undefined
}

export const toLiteJson = (obj: TweetApiUtilsData): LiteJson => {
  const res: LiteJson = {
    user: {
      id: getUserScreenName(obj.user),
      name: getUserName(obj.user),
      followersCount: obj.user.relationshipCounts?.followers ?? obj.user.legacy?.followersCount,
      followingCount: obj.user.relationshipCounts?.following ?? obj.user.legacy?.friendsCount,
      description: obj.user.profileBio?.description ?? obj.user.legacy?.description,
      createAt: obj.user.core?.createdAt ?? obj.user.legacy?.createdAt,
    },
    tweet: {
      id: obj.tweet.restId,
      text: obj.tweet.noteTweet?.noteTweetResults.result.text ?? obj.tweet.legacy?.fullText,
      createdAt: obj.tweet.legacy?.createdAt,
      replyCount: obj.tweet.legacy?.replyCount,
      retweetCount: obj.tweet.legacy?.retweetCount,
      likeCount: obj.tweet.legacy?.favoriteCount,
      quoteCount: obj.tweet.legacy?.quoteCount,
    },
    replies: obj.replies?.map((e) => toLiteJson(e)),
    quoted: obj.quoted ? toLiteJson(obj.quoted) : undefined,
  }
  return res
}
