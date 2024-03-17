import {TwitterOpenApiClient} from 'twitter-openapi-typescript'

const urlList = [
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/status/(?<id>[0-9]+)', 'getTweetResultByRestId'] as const,
  ['https://twitter.com/search?q=(?<id>[^&]+)', 'getSearchTimeline'] as const,
  ['https://twitter.com/home', 'getHomeTimeline'] as const,
  ['https://twitter.com/i/lists/(?<id>[0-9]+)', 'getListLatestTweetsTimeline'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)', 'getUserTweets'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/with_replies', 'getUserTweetsAndReplies'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/media', 'getUserMedia'] as const,
  ['https://twitter.com/(?<user>[a-zA-Z0-9_]+)/likes', 'getLikes'] as const,
  ['https://twitter.com/i/bookmarks', 'getBookmarks'] as const,
]

export const twitterUrlConvert = (arg: {url: string}) => {
  const pattern = urlList.find(([pattern]) => new RegExp(pattern).test(arg.url))
  if (pattern) {
    const [url, type] = pattern
    const match = new RegExp(url).exec(arg.url)?.groups
    if (match === undefined) {
      return ['_', type] as const
    }

    if (match.id) {
      return [match.id, type] as const
    }

    if (match.user) {
      return async (api: TwitterOpenApiClient) => {
        const res = await api.getUserApi().getUserByScreenName({screenName: match.user})
        return [res.data.user!.restId!, type] as const
      }
    }
  }

  throw new Error('Invalid URL')
}
