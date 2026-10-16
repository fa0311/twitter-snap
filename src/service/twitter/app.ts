import {type TweetApiUtilsData, TwitterOpenApi, type TwitterOpenApiClient} from 'twitter-openapi-typescript'
import {mediaCallback, Session, SnapApp, SnapRender} from './../../app.js'
import {URLPath} from '../../utils/path.js'
import {sleepLoop} from '../../utils/sleep.js'
import {RenderTweetImage} from './render/basic/image.js'
import {RenderBasicVideo} from './render/basic/video.js'
import {RenderMakeItAQuoteImage} from './render/makeItAQuote/image.js'
import {getUserScreenName, getVideo, toLiteJson} from './render/utils/utils.js'
import {tweetCursor} from './utils.js'

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

const render = new SnapRender<TweetApiUtilsData>({
  isImage: (data) => {
    const extEntities = data.tweet.legacy?.extendedEntities
    const extMedia = extEntities?.media ?? []
    return extMedia.every((media) => media.type === 'photo')
  },
  placeholder: (data) => {
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
  },
  color: {
    image: async (data, utils) => {
      utils.logger.update(`Rendering image ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      return new RenderTweetImage(utils, false).render({data})
    },
    video: async (data, utils) => {
      utils.logger.update(`Rendering image ${getUserScreenName(data.user)} ${data.tweet.restId}`)
      const element = new RenderTweetImage(utils, true).render({data})
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
    Media: mediaCallback(
      (data: TweetApiUtilsData) => data.tweet.legacy?.extendedEntities?.media ?? [],
      (data) => {
        const videoInfo = data.videoInfo && getVideo(data.videoInfo)
        return [
          ['{media-id}', data.idStr],
          ['{media-video-variants-id}', videoInfo?.url.split('/').pop()?.split('.')[0]],
          ['{media-video-bitrate}', videoInfo?.bitrate],
        ]
      },
      async (data, utils) => {
        const isVideo = data.videoInfo !== undefined && data.type !== 'photo'
        utils.logger.update(`Downloading ${isVideo ? 'video' : 'image'} ${data.idStr}`)
        const mediaUrl = data.videoInfo && data.type !== 'photo' ? getVideo(data.videoInfo).url : data.mediaUrlHttps

        const url = URLPath.fromURL(mediaUrl)

        if (!utils.file.path.isExtension('') && !utils.file.path.isExtension(url.extension)) {
          utils.logger.hint(`Extension is ignored, saving as ${url.extension}`)
        }

        await utils.file.saveFetch(url)
      },
    ),
  },
})

const getUserId = async (api: TwitterOpenApiClient, screenName: string) => {
  const userData = await api.getUserApi().getUserByScreenName({screenName})
  const id = userData.data.user?.restId
  if (!id) throw new Error('User not found')
  return id
}

app.call(`/(?<user>[a-zA-Z0-9_]+)/status/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  const guest = api.config.apiKey?.('x-csrf-token') === undefined

  if (guest) {
    const fn = (async function* () {
      const res = await api.getDefaultApi().getTweetResultByRestId({tweetId: id})
      if (!res.data) throw new Error('No data')
      yield res.data
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

  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getSearchTimeline({rawQuery: id, cursor})
  })
  return render.run(fn)
})

app.call(`/home`, async (utils, api) => {
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getHomeTimeline({cursor})
  })
  return render.run(fn)
})

app.call(`/i/lists/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getListLatestTweetsTimeline({listId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/with_replies`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getUserTweetsAndReplies({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/media`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getUserMedia({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/likes`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getLikes({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/i/bookmarks`, async (utils, api) => {
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getBookmarks({cursor})
  })
  return render.run(fn)
})

app.call(`/i/communities/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getCommunityTweetsTimeline({communityId: id, cursor, rankingMode: 'Recency'})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)`, async (utils, api, {user}) => {
  const id = await getUserId(api, user)
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getUserTweets({userId: id, cursor})
  })
  return render.run(fn)
})

export default app
