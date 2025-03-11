import {TweetApiUtilsData, TwitterOpenApi} from 'twitter-openapi-typescript'

import {URLPath} from '../../utils/path.js'
import {sleepLoop} from '../../utils/sleep.js'
import {Session, SnapApp, SnapRender} from './../../app.js'
import {RenderTweetImage} from './render/basic/image.js'
import {RenderBasicVideo} from './render/basic/video.js'
import {RenderMakeItAQuoteImage} from './render/makeItAQuote/image.js'
import {getVideo, toLiteJson} from './render/utils/utils.js'
import {tweetCursor} from './utils.js'

const app = new SnapApp(
  'twitter snap',
  'https?://(www\\.)?(mobile\\.)?(x|twitter)\\.com',
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
      ['SEGOEUISL.TTF', 'Segoe UI', 500, 'normal'] as const,
      ['SEGOEUIB.TTF', 'Segoe UI', 700, 'normal'] as const,
      ['SEGUISLI.TTF', 'Segoe UI', 500, 'italic'] as const,
      ['SEGOEUIZ.TTF', 'Segoe UI', 700, 'italic'] as const,
      ['Meiryo.ttf', 'Meiryo', 500, 'normal'] as const,
      ['Meiryo-Bold.ttf', 'Meiryo', 700, 'normal'] as const,
      ['Meiryo-Italic.ttf', 'Meiryo', 500, 'italic'] as const,
      ['Meiryo-BoldItalic.ttf', 'Meiryo', 700, 'italic'] as const,
    ]
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

const render = new SnapRender<TweetApiUtilsData>(
  (data) => {
    const extEntities = data.tweet.legacy?.extendedEntities
    const extMedia = extEntities?.media ?? []
    return extMedia.every((media) => media.type === 'photo')
  },
  (data) => {
    const legacy = data.tweet.legacy!
    return [
      ['{id}', data.tweet.restId],
      ['{user-screen-name}', data.user.legacy.screenName],
      ['{user-id}', data.user.restId],
      ['{time-yyyy}', new Date(legacy.createdAt).getFullYear().toString().padStart(4, '0')],
      ['{time-mm}', (new Date(legacy.createdAt).getMonth() + 1).toString().padStart(2, '0')],
      ['{time-dd}', new Date(legacy.createdAt).getDate().toString().padStart(2, '0')],
      ['{time-hh}', new Date(legacy.createdAt).getHours().toString().padStart(2, '0')],
      ['{time-mi}', new Date(legacy.createdAt).getMinutes().toString().padStart(2, '0')],
      ['{time-ss}', new Date(legacy.createdAt).getSeconds().toString().padStart(2, '0')],
    ] as [string, number | string | undefined][]
  },
  async (data, utils) => {
    utils.logger.update(`Rendering image ${data.user.legacy.screenName} ${data.tweet.restId}`)
    return new RenderTweetImage(utils, false).render({data})
  },
  async (data, utils) => {
    utils.logger.update(`Rendering image ${data.user.legacy.screenName} ${data.tweet.restId}`)
    const element = new RenderTweetImage(utils, true).render({data})
    const input = await utils.file.tempImg(await utils.render(element))
    utils.logger.update(`Rendering video ${data.user.legacy.screenName} ${data.tweet.restId}`)
    await new RenderBasicVideo(utils).render({data, input})
  },
)

render.media(
  'Media',
  (data) => {
    const extEntities = data.tweet.legacy?.extendedEntities
    const extMedia = extEntities?.media ?? []
    return extMedia
  },
  (data) => {
    const videoInfo = data.videoInfo && getVideo(data.videoInfo)
    return [
      ['{media-id}', data.idStr],
      ['{media-video-variants-id}', videoInfo?.url.split('/').pop()!.split('.')[0]],
      ['{media-video-bitrate}', videoInfo?.bitrate],
    ] as [string, number | string | undefined][]
  },
  async (data, utils) => {
    const isVideo = data.type !== 'photo'
    utils.logger.update(`Downloading ${isVideo ? 'video' : 'image'} ${data.idStr}`)
    const mediaUrl = isVideo ? getVideo(data.videoInfo!).url : data.mediaUrlHttps

    const url = URLPath.fromURL(mediaUrl)

    if (utils.file.path.isExtension('')) {
      await utils.file.saveFetch(url)
    } else if (utils.file.path.isExtension(url.extension)) {
      await utils.file.saveFetch(url)
    } else {
      utils.logger.hint(`Extension is ignored, saving as ${url.extension}`)
      await utils.file.saveFetch(url)
    }
  },
)

render.json('Json', async (data, utils) => {
  utils.logger.update(`Parsing ${data.user.legacy.screenName} ${data.tweet.restId}`)
  return data
})

render.other('LiteJson', async (data, utils) => {
  utils.logger.update(`Parsing ${data.user.legacy.screenName} ${data.tweet.restId}`)
  return toLiteJson(data)
})

render.add(
  'RenderMakeItAQuote',
  async (data, utils) => {
    utils.logger.update(`Rendering ${data.user.legacy.screenName} ${data.tweet.restId}`)
    return new RenderMakeItAQuoteImage(utils).render({data})
  },
  async (data, utils) => {
    utils.logger.update(`Rendering ${data.user.legacy.screenName} ${data.tweet.restId}`)
    const element = new RenderMakeItAQuoteImage(utils).render({data})
    const input = await utils.file.tempImg(await utils.render(element))
    await utils.video.fromImage(
      input.toString(),
      utils.file.path.toString(),
      `https://twitter.com/${data.user.legacy.screenName}/status/${data.tweet.restId}`,
    )
  },
)

app.call(`/(?<user>[a-zA-Z0-9_]+)/status/(?<id>[0-9]+)`, async (utils, api, {id}) => {
  const guest = api.config.apiKey!('ct0') === undefined

  if (guest) {
    throw new Error('Guest user is deprecated')
    // const fn = (async function* () {
    //   yield (await api.getDefaultApi().getTweetResultByRestId({tweetId: id})).data!
    // })()
    // return render.run(fn)
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
  const userData = await api.getUserApi().getUserByScreenName({screenName: user})
  const id = userData.data.user!.restId!
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getUserTweetsAndReplies({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/media`, async (utils, api, {user}) => {
  const userData = await api.getUserApi().getUserByScreenName({screenName: user})
  const id = userData.data.user!.restId!
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getUserMedia({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)/likes`, async (utils, api, {user}) => {
  const userData = await api.getUserApi().getUserByScreenName({screenName: user})
  const id = userData.data.user!.restId!
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getLikes({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/(?<user>[a-zA-Z0-9_]+)`, async (utils, api, {user}) => {
  const userData = await api.getUserApi().getUserByScreenName({screenName: user})
  const id = userData.data.user!.restId!
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getUserTweets({userId: id, cursor})
  })
  return render.run(fn)
})

app.call(`/i/bookmarks`, async (utils, api) => {
  const fn = tweetCursor({limit: utils.limit}, async (cursor) => {
    return api.getTweetApi().getBookmarks({cursor})
  })
  return render.run(fn)
})

export default app
