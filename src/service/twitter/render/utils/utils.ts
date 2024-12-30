import {TweetApiUtilsData} from 'twitter-openapi-typescript'
import {MediaExtended, MediaVideoInfo} from 'twitter-openapi-typescript-generated'

export type RenderWidgetType<T> = (props: T) => React.ReactElement
export type RenderCssType<T> = (props: T) => React.CSSProperties

export const getBiggerMedia = (extMedia: MediaExtended[]) => {
  const video = extMedia.filter((e) => e.type !== 'photo')
  const sorted = [...video].sort(
    (a, b) =>
      b.videoInfo!.aspectRatio[1] / b.videoInfo!.aspectRatio[0] -
      a.videoInfo!.aspectRatio[1] / a.videoInfo!.aspectRatio[0],
  )
  if (sorted.length === 0) {
    return [undefined, undefined] as const
  }

  return [video.indexOf(sorted[0]), sorted[0]] as const
}

export const getVideo = (videoInfo: MediaVideoInfo) => {
  return [...videoInfo.variants].sort((a, b) => {
    if (a.bitrate === undefined) return 1
    if (b.bitrate === undefined) return -1
    return b.bitrate - a.bitrate
  })[0]
}

export const toLiteJson = (obj: TweetApiUtilsData): any => {
  const res = {
    user: {
      id: obj.user.legacy?.screenName,
      name: obj.user.legacy?.screenName,
      followersCount: obj.user.legacy?.followersCount,
      followingCount: obj.user.legacy?.friendsCount,
      description: obj.user.legacy?.description,
      createAt: obj.user.legacy?.createdAt,
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
