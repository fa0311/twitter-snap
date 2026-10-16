import {mediaCallback, Session, SnapApp, SnapRender} from '../../app.js'
import {SnapAppCookies} from '../../utils/cookies.js'
import {URLPath} from '../../utils/path.js'
import {pixivRender} from './render/image.js'
import {pixivVideoRender, ugoiraEncode} from './render/video.js'
import type {APIResponse, IllustBody, PixivBody, PixivData, UgoiraBody, UserProfile} from './type.js'

type LatestHeader = Record<string, Record<string, string>>

const getFetch = async (cookies: SnapAppCookies) => {
  const url = 'https://raw.githubusercontent.com/fa0311/latest-user-agent/main/header.json'
  const latestHeader = (await fetch(url).then((res) => res.json())) as LatestHeader
  const {host: _host, connection: _connection, ...chrome} = latestHeader.chrome
  const header = {
    ...chrome,
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'ja-JP,ja;q=0.9',
  }

  return async (url: string) => {
    return fetch(url, {
      headers: {
        ...header,
        cookie: cookies.toString(),
      },
    })
  }
}

const getRequest = async (fetch: Awaited<ReturnType<typeof getFetch>>) => {
  return async <T>(base: string) => {
    const url = new URL(base)
    url.searchParams.append('lang', 'ja')
    url.searchParams.append('version', '87e15fb6d059b34d6ca434d8e84fc0cd810122ec')
    return (await fetch(url.toString()).then((res) => res.json())) as APIResponse<T>
  }
}

const app = new SnapApp(
  'pixiv',
  'https?://(www\\.)?pixiv\\.net',
  async (utils) => {
    switch (utils.sessionType) {
      case 'browser': {
        const browser = await utils.puppeteerLogin(
          'https://accounts.pixiv.net/login',
          'https://www.pixiv.net/ajax/user/extra',
        )
        return new Session(browser)
      }

      case 'file': {
        const file = await utils.fileLogin()
        return new Session(file)
      }

      case 'guest': {
        return new Session(new SnapAppCookies([]))
      }
    }
  },
  async () => {
    return {
      text: undefined,
      emoji: 'twemoji',
    }
  },
  async () => {},
)

type MediaResponse = {data: IllustBody; ugoira?: UgoiraBody}

const render = new SnapRender<PixivData>({
  isImage: (data) => {
    return data.ugoira === undefined
  },
  placeholder: (data) => {
    const createDate = new Date(data.meta.illust.createDate)
    return [
      ['{id}', data.meta.illust.illustId],
      ['{user-id}', data.meta.user.userId],
      ['{time-yyyy}', createDate.getFullYear().toString().padStart(4, '0')],
      ['{time-mm}', (createDate.getMonth() + 1).toString().padStart(2, '0')],
      ['{time-dd}', createDate.getDate().toString().padStart(2, '0')],
      ['{time-hh}', createDate.getHours().toString().padStart(2, '0')],
      ['{time-mi}', createDate.getMinutes().toString().padStart(2, '0')],
      ['{time-ss}', createDate.getSeconds().toString().padStart(2, '0')],
    ]
  },
  color: {
    image: async (data, utils) => {
      utils.logger.update(`Rendering image ${data.meta.illust.illustTitle} ${data.meta.illust.illustId}`)
      return pixivRender(data, utils)
    },
    video: async (data, utils) => {
      utils.logger.update(`Rendering image ${data.meta.illust.illustTitle} ${data.meta.illust.illustId}`)
      const element = await pixivRender(data, utils)
      utils.logger.update(`Rendering video ${data.meta.illust.illustTitle} ${data.meta.illust.illustId}`)
      const input = await utils.file.tempImg(await utils.render(element))
      await pixivVideoRender(data, utils, input)
    },
  },
  json: {
    Json: async (data, utils) => {
      utils.logger.update(`Parsing ${data.meta.illust.illustTitle} ${data.meta.illust.illustId}`)
      return data
    },
  },
  other: {
    Media: mediaCallback<PixivData, MediaResponse>(
      (data) => {
        if (data.ugoira) {
          return [{ugoira: data.ugoira, data: data.illust[0]}]
        } else {
          return data.illust.map((illust) => ({data: illust}))
        }
      },
      () => {
        return []
      },
      async (data, utils) => {
        if (data.ugoira === undefined) {
          const url = URLPath.fromURL(data.data.urls.original)
          if (!utils.file.path.isExtension(url.extension)) {
            utils.logger.hint(`Extension is ignored, saving as ${url.extension}`)
          }

          utils.logger.update(`Downloading image`)
          await utils.file.saveFetch(url, {headers: {referer: 'https://www.pixiv.net/'}})
        } else {
          const url = URLPath.fromURL(data.data.urls.original)
          if (utils.file.path.isExtension(url.extension)) {
            utils.logger.update(`Downloading image`)
            await utils.file.saveFetch(url, {headers: {referer: 'https://www.pixiv.net/'}})
          } else if (utils.file.path.isImage()) {
            utils.logger.hint(`Unsupported format: ${utils.file.path.extension}, output as mp4`)
            utils.logger.update(`Downloading ugoira`)
            await ugoiraEncode(utils, data.ugoira, utils.file.path.update({extension: 'mp4'}))
          } else if (utils.file.path.isExtension('')) {
            utils.logger.update(`Downloading ugoira`)
            await ugoiraEncode(utils, data.ugoira, utils.file.path.update({extension: 'mp4'}))
          } else {
            utils.logger.update(`Downloading ugoira`)
            await ugoiraEncode(utils, data.ugoira, utils.file.path)
          }
        }
      },
    ),
  },
})

app.call('/artworks/(?<id>[0-9]+)', async (_utils, cookie, {id}) => {
  const fetch = await getFetch(cookie)
  const request = await getRequest(fetch)

  const metaJson = await request<PixivBody>(`https://www.pixiv.net/ajax/illust/${id}`)
  const illustData = await request<IllustBody[]>(`https://www.pixiv.net/ajax/illust/${id}/pages`)
  const userProfileData = await request<UserProfile>(`https://www.pixiv.net/ajax/user/${metaJson.body.userId}`)

  const ugoiraData = await (async () => {
    if (metaJson.body.illustType === 2) {
      return await request<UgoiraBody>(`https://www.pixiv.net/ajax/illust/${id}/ugoira_meta`)
    }
  })()

  const res: PixivData = {
    meta: {
      illust: metaJson.body,
      user: userProfileData.body,
    },
    illust: illustData.body,
    ugoira: ugoiraData?.body,
  }

  const fn = (async function* () {
    yield res
  })()
  return render.run(fn)
})

export default app
