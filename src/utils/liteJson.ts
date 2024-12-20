import {TweetApiUtilsData} from 'twitter-openapi-typescript'

export const toLiteJson = (obj: TweetApiUtilsData): any => {
  const res = {
    user: {
      id: obj.user.legacy?.screenName,
      name: obj.user.legacy?.screenName,
      follower_count: obj.user.legacy?.followersCount,
      following_count: obj.user.legacy?.friendsCount,
      description: obj.user.legacy?.description,
      create_at: obj.user.legacy?.createdAt,
    },
    tweet: {
      id: obj.tweet.restId,
      text: obj.tweet.noteTweet?.noteTweetResults.result.text ?? obj.tweet.legacy?.fullText,
      created_at: obj.tweet.legacy?.createdAt,
      reply_count: obj.tweet.legacy?.replyCount,
      retweet_count: obj.tweet.legacy?.retweetCount,
      like_count: obj.tweet.legacy?.favoriteCount,
      quote_count: obj.tweet.legacy?.quoteCount,
    },
    replies: obj.replies?.map((e) => toLiteJson(e)),
    quoted: obj.quoted ? toLiteJson(obj.quoted) : undefined,
  }
  return res
}
