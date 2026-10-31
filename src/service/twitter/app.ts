import {type TweetApiUtilsData, TwitterOpenApi, type TwitterOpenApiClient} from 'twitter-openapi-typescript'
import {mediaCallback, Session, SnapApp, type SnapAppUtils, SnapRender} from './../../app.js'
import {URLPath} from '../../utils/path.js'
import type {SnapRenderColorUtils, SnapRenderUtils} from '../../utils/render.js'
import type {FileReplace} from '../../utils/replace.js'
import {sleepLoop} from '../../utils/sleep.js'
import {RenderTweetImage} from './render/basic/image.js'
import {RenderBasicVideo} from './render/basic/video.js'
import {RenderMakeItAQuoteImage} from './render/makeItAQuote/image.js'
import {getUserScreenName, getVideo, toLiteJson} from './render/utils/utils.js'
import {RenderXReferenceImage} from './render/xreference/image.js'
import {type TweetThread, tweetCursor, tweetThread} from './utils.js'

const app = new SnapApp(
  'twitter',
  'https?://(www\\.)?(mobile\\.)?(x|twitter|fxtwitter|vxtwitter)\\.com',
  async (utils) => {
    const allowDomains = ['twitter.com', 'x.com']

    const twitter = new TwitterOpenApi()
    switch (utils.sessionType) {
      case 'browser': {
        const browser = await utils.puppeteerLogin(
          'https://x.com/login',
          `https://x.com/i/api/graphql/[a-zA-Z0-9_-]+/HomeTimeline`,
        )
        return new Session(await twitter.getClientFromCookies(browser.get(allowDomains).toKeyValues()))
      }

      case 'file': {
        const file = await utils.fileLogin()
        return new Session(await twitter.getClientFromCookies(file.get(allowDomains).toKeyValues()))
      }

      case 'guest': {
        return new Session(await twitter.getGuestClient())
      }
    }
  },
  async (utils) => {
    const base = 'https://github.com/fa0311/twitter-snap-core/releases/download/assets-fonts/'
    const list = [
      ['SEGOEUISL.TTF', 'Segoe UI', 500, 'normal'],
      ['SEGOEUIB.TTF', 'Segoe UI', 700, 'normal'],
      ['SEGUISLI.TTF', 'Segoe UI', 500, 'italic'],
      ['SEGOEUIZ.TTF', 'Segoe UI', 700, 'italic'],
      ['Meiryo.ttf', 'Meiryo', 500, 'normal'],
      ['Meiryo-Bold.ttf', 'Meiryo', 700, 'normal'],
      ['Meiryo-Italic.ttf', 'Meiryo', 500, 'italic'],
      ['Meiryo-BoldItalic.ttf', 'Meiryo', 700, 'italic'],
    ] as const
    const fonts = list.map(async ([file, name, weight, style]) => {
      const data = await utils.getFonts(file, async () => (await fetch(`${base}${file}`)).arrayBuffer())
      return {data, name, weight, style}
    })

    return {
      text: await Promise.all(fonts),
      emoji: 'twemoji',
    }
  },
  async (utils) => {
    TwitterOpenApi.fetchApi = async (...args) => {
      const res = await fetch(...args)
      if (res.status === 429) {
        const wait = Number(res.headers.get('X-Rate-Limit-Reset')) * 1000 - Date.now()
        await sleepLoop(wait + 1, async (count) => {
          utils.logger.update(`Rate limit exceeded, wait ${count} seconds`)
        })
        return fetch(...args)
      }

      return res
    }
  },
)

const pad = (value: number, length: number) => value.toString().padStart(length, '0')

const tweetImage = (utils: SnapRenderColorUtils, video: boolean) =>
  utils.element.theme.startsWith('RenderXReference')
    ? new RenderXReferenceImage(utils, video)
    : new RenderTweetImage(utils, video)

const mediaOf = (data: TweetApiUtilsData) => data.tweet.legacy?.extendedEntities?.media ?? []

const isImage = (data: TweetApiUtilsData) => mediaOf(data).every((media) => media.type === 'photo')

const placeholder = (data: TweetApiUtilsData): FileReplace[] => {
  const createdAt = new Date(data.tweet.legacy?.createdAt ?? 0)
  return [
    ['{id}', data.tweet.restId],
    ['{user-screen-name}', getUserScreenName(data.user)],
    ['{user-id}', data.user.restId],
    ['{time-yyyy}', pad(createdAt.getFullYear(), 4)],
    ['{time-mm}', pad(createdAt.getMonth() + 1, 2)],
    ['{time-dd}', pad(createdAt.getDate(), 2)],
    ['{time-hh}', pad(createdAt.getHours(), 2)],
    ['{time-mi}', pad(createdAt.getMinutes(), 2)],
    ['{time-ss}', pad(createdAt.getSeconds(), 2)],
  ]
}

const mediaPlaceholder = (data: ReturnType<typeof mediaOf>[number]): FileReplace[] => {
  const videoInfo = data.videoInfo && getVideo(data.videoInfo)
  return [
    ['{media-id}', data.idStr],
    ['{media-video-variants-id}', videoInfo?.url.split('/').pop()?.split('.')[0]],
    ['{media-video-bitrate}', videoInfo?.bitrate],
  ]
}

const saveMedia = async (data: ReturnType<typeof mediaOf>[number], utils: SnapRenderUtils) => {
  const isVideo = data.videoInfo !== undefined && data.type !== 'photo'
  utils.logger.update(`Downloading ${isVideo ? 'video' : 'image'} ${data.idStr}`)
  const mediaUrl = data.videoInfo && data.type !== 'photo' ? getVideo(data.videoInfo).url : data.mediaUrlHttps

  const url = URLPath.fromURL(mediaUrl)

  if (!utils.file.path.isExtension('') && !utils.file.path.isExtension(url.extension)) {
    utils.logger.hint(`Extension is ignored, saving as ${url.extension}`)
  }

  await utils.file.saveFetch(url)
}

const render = new SnapRender<TweetApiUtilsData>({
  isImage,
  placeholder,
  color: {
    image: async (data, utils) => {
      utils.logger.update(`Rendering image ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      return tweetImage(utils, false).render({data})
    },
    video: async (data, utils) => {
      utils.logger.update(`Rendering image ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      const element = tweetImage(utils, true).render({data})
      const input = await utils.file.tempImg(await utils.render(element))
      utils.logger.update(`Rendering video ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      await new RenderBasicVideo(utils).render({data, input})
    },
  },
  element: {
    RenderMakeItAQuote: {
      image: async (data, utils) => {
        utils.logger.update(`Rendering ${getUserScreenName(data.user)} ${data.tweet.restId}`)
        return new RenderMakeItAQuoteImage(utils).render({data})
      },
      video: async (data, utils) => {
        utils.logger.update(`Rendering ${getUserScreenName(data.user)} ${data.tweet.restId}`)
        const element = new RenderMakeItAQuoteImage(utils).render({data})
        const input = await utils.file.tempImg(await utils.render(element))
        await utils.video.fromImage(
          input.toString(),
          utils.file.path.toString(),
          `https://twitter.com/${getUserScreenName(data.user)}/status/${data.tweet.restId}`,
        )
      },
    },
  },
  json: {
    Json: async (data, utils) => {
      utils.logger.update(`Parsing ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      return data
    },
    LiteJson: async (data, utils) => {
      utils.logger.update(`Parsing ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      return toLiteJson(data)
    },
  },
  other: {
    Media: mediaCallback(mediaOf, mediaPlaceholder, saveMedia),
  },
})

// The author's thread around a tweet, in one output named after that tweet; the quote theme stays per tweet
const thread = new SnapRender<TweetThread>({
  isImage: (data) => data.tweets.every(isImage),
  placeholder: (data) => placeholder(data.focal),
  color: {
    image: async (data, utils) => {
      utils.logger.update(`Rendering thread ${getUserScreenName(data.focal.user)} ${data.focal.tweet.restId}`)
      return tweetImage(utils, false).renderThread({data})
    },
    video: async (data, utils) => {
      utils.logger.update(`Rendering thread ${getUserScreenName(data.focal.user)} ${data.focal.tweet.restId}`)
      const element = tweetImage(utils, true).renderThread({data})
      const input = await utils.file.tempImg(await utils.render(element))
      utils.logger.update(`Rendering video ${getUserScreenName(data.focal.user)} ${data.focal.tweet.restId}`)
      await new RenderBasicVideo(utils).renderThread({data, input})
    },
  },
  json: {
    Json: async (data) => data.tweets,
    LiteJson: async (data) => data.tweets.map((e) => toLiteJson(e)),
  },
  other: {
    Media: mediaCallback((data: TweetThread) => data.tweets.flatMap(mediaOf), mediaPlaceholder, saveMedia),
  },
})

const getUserId = async (api: TwitterOpenApiClient, screenName: string) => {
  const userData = await api.getUserApi().getUserByScreenName({screenName})
  const id = userData.data.user?.restId
  if (!id) throw new Error('User not found')
  return id
}

// A timeline has no author thread to follow: --thread is only defined for a tweet URL
const timeline = (utils: SnapAppUtils, request: Parameters<typeof tweetCursor>[1]) => {
  if (utils.thread) throw new Error('--thread needs a tweet URL')
  return render.run(tweetCursor({limit: utils.limit}, request))
}

app.call(`/(?<user>[a-zA-Z0-9_]+)/status/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  const guest = api.config.apiKey?.('x-csrf-token') === undefined
  const byId = async (tweetId: string) => (await api.getDefaultApi().getTweetResultByRestId({tweetId})).data

  if (utils.thread) {
    const fn = (async function* () {
      // TweetDetail holds the ancestors, the tweet and the author's continuation; a guest reads one tweet at a time
      const pool = guest
        ? []
        : (await api.getTweetApi().getTweetDetail({focalTweetId: id})).data.data.flatMap((e) => [e, ...e.replies])
      const focal = pool.find((e) => e.tweet.restId === id) ?? (await byId(id))
      if (!focal) throw new Error('No data')
      yield tweetThread(focal, pool, byId)
    })()
    return thread.run(fn)
  }

  if (guest) {
    const fn = (async function* () {
      const data = await byId(id)
      if (!data) throw new Error('No data')
      yield data
    })()
    return render.run(fn)
  }

  const fn = tweetCursor({limit: utils.limit, id}, async (cursor) => {
    return api.getTweetApi().getTweetDetail({focalTweetId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/search\\?(?<params>.*)`, async (utils, api, {params}) => {
  const id = new URLSearchParams(params).get('q')
  if (!id) {
    throw new Error('no query')
  }

  return timeline(utils, (cursor) => api.getTweetApi().getSearchTimeline({rawQuery: id, cursor}))
})

app.call(`/home`, async (utils, api) => {
  return timeline(utils, (cursor) => api.getTweetApi().getHomeTimeline({cursor}))
})

app.call(`/i/lists/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  return timeline(utils, (cursor) => api.getTweetApi().getListLatestTweetsTimeline({listId: id, cursor}))
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/with_replies`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  return timeline(utils, (cursor) => api.getTweetApi().getUserRepliesTimeline({userId: id, cursor}))
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/media`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  return timeline(utils, (cursor) => api.getTweetApi().getUserVideoTimeline({userId: id, cursor}))
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/likes`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  return timeline(utils, (cursor) => api.getTweetApi().getLikes({userId: id, cursor}))
})

app.call(`/i/bookmarks`, async (utils, api) => {
  return timeline(utils, (cursor) => api.getTweetApi().getBookmarks({cursor}))
})

app.call(`/i/communities/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  return timeline(utils, (cursor) =>
    api.getTweetApi().getCommunityTweetsTimeline({communityId: id, cursor, rankingMode: 'Recency'}),
  )
})

app.call(`/(?<user>[a-zA-Z0-9_]+)`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  return timeline(utils, (cursor) => api.getTweetApi().getUserOriginalsTimeline({userId: id, cursor}))
})

export default app
