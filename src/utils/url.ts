import {TwitterOpenApiClient} from 'twitter-openapi-typescript'

const urlList = [
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/status/(?<id>[0-9]+)', 'getTweetDetail'] as const,
  ['https://twitter.com/search?q=(?<id>[^&]+)', 'getSearchTimeline'] as const,
  ['https://twitter.com/home', 'getHomeTimeline'] as const,
  ['https://twitter.com/i/lists/(?<id>[0-9]+)', 'getListLatestTweetsTimeline'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/with_replies', 'getUserTweetsAndReplies'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/media', 'getUserMedia'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/likes', 'getLikes'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)', 'getUserTweets'] as const,
  ['https://twitter.com/i/bookmarks', 'getBookmarks'] as const,

  ['https://x.com/(?<user>[a-zA-Z0-9_]+)/status/(?<id>[0-9]+)', 'getTweetDetail'] as const,
  ['https://x.com/search?q=(?<id>[^&]+)', 'getSearchTimeline'] as const,
  ['https://x.com/home', 'getHomeTimeline'] as const,
  ['https://x.com/i/lists/(?<id>[0-9]+)', 'getListLatestTweetsTimeline'] as const,
  ['https://x.com/(?<user>[a-zA-Z0-9_]+)/with_replies', 'getUserTweetsAndReplies'] as const,
  ['https://x.com/(?<user>[a-zA-Z0-9_]+)/media', 'getUserMedia'] as const,
  ['https://x.com/(?<user>[a-zA-Z0-9_]+)/likes', 'getLikes'] as const,
  ['https://x.com/(?<user>[a-zA-Z0-9_]+)', 'getUserTweets'] as const,
  ['https://x.com/i/bookmarks', 'getBookmarks'] as const,
]

const guestFallback = [['getTweetDetail', 'getTweetResultByRestId'] as const]
const forceStartIdList = ['getTweetDetail']

export const twitterUrlConvert = (arg: {url: string; guest: boolean}) => {
  const pattern = urlList.find(([pattern]) => new RegExp(pattern).test(arg.url))
  if (pattern) {
    const [url, type] = pattern
    const true_type = arg.guest ? getFallbackAPI(type) : type
    const match = new RegExp(url).exec(arg.url)?.groups
    if (match === undefined) {
      return ['_', true_type] as const
    }

    if (match.id) {
      return [match.id, true_type] as const
    }

    if (match.user) {
      return async (api: TwitterOpenApiClient) => {
        const res = await api.getUserApi().getUserByScreenName({screenName: match.user})
        return [res.data.user!.restId!, true_type] as const
      }
    }
  }

  throw new Error('Invalid URL')
}

export const getFallbackAPI = <T extends string>(type: T) => {
  const pattern = guestFallback.find(([pattern]) => pattern === type)
  if (pattern) {
    return pattern[1]
  }

  return type
}

export const getForceStartIdList = (type: string) => {
  return forceStartIdList.includes(type)
}
