import {TimelineApiUtilsResponse, TweetApiUtilsData, TwitterApiUtilsResponse} from 'twitter-openapi-typescript'

type tweetApiSnapParam = {
  id?: string
  limit: number
}

type tweetCursorSnapRequest = (
  cursor: string | undefined,
) => Promise<TwitterApiUtilsResponse<TimelineApiUtilsResponse<TweetApiUtilsData>>>

export const tweetCursor = async function* ({limit, id}: tweetApiSnapParam, request: tweetCursorSnapRequest) {
  let count = 0
  let cursor: string | undefined
  while (count < limit) {
    const res = await request(cursor)

    for (const e of res.data.data) {
      if (count === 0 && e.tweet.restId !== id && id) continue
      if (e.promotedMetadata) continue
      if (count >= limit) return
      yield e
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
}
