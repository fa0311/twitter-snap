import type {TimelineApiUtilsResponse, TweetApiUtilsData, TwitterApiUtilsResponse} from 'twitter-openapi-typescript'

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

// A tweet with the author's thread around it: the tweets in order, the tweet itself among them
export type TweetThread = {focal: TweetApiUtilsData; tweets: TweetApiUtilsData[]}

// The author's thread through one tweet, as x.com's "Show this thread": their own replies chained by
// inReplyToStatusIdStr, up to the first tweet of the chain and down the earliest self-reply at each step.
// Ancestors missing from the pool are fetched one by one; the chain stops at one that cannot be read.
export const tweetThread = async (
  focal: TweetApiUtilsData,
  pool: TweetApiUtilsData[],
  fetch: (id: string) => Promise<TweetApiUtilsData | undefined>,
): Promise<TweetThread> => {
  const author = focal.user.restId
  const own = new Map([focal, ...pool].filter((e) => e.user.restId === author).map((e) => [e.tweet.restId, e]))
  const parentId = (e: TweetApiUtilsData) =>
    e.tweet.legacy?.inReplyToUserIdStr === author ? e.tweet.legacy.inReplyToStatusIdStr : undefined
  const childOf = (e: TweetApiUtilsData) =>
    [...own.values()]
      .filter((c) => c.tweet.legacy?.inReplyToStatusIdStr === e.tweet.restId)
      .sort((a, b) => (BigInt(a.tweet.restId) < BigInt(b.tweet.restId) ? -1 : 1))[0]

  const above: TweetApiUtilsData[] = []
  for (let id = parentId(focal); id; ) {
    const e = own.get(id) ?? (await fetch(id))
    if (!e) break
    above.unshift(e)
    id = parentId(e)
  }

  const below: TweetApiUtilsData[] = []
  for (let e = childOf(focal); e; e = childOf(e)) below.push(e)

  return {focal, tweets: [...above, focal, ...below]}
}
