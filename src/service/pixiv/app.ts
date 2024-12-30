import {Session, SnapApp, SnapRender} from '../../app.js'
import {SnapAppCookies} from '../../utils/cookies.js'
import {URLPath} from '../../utils/path.js'
import {pixivRender} from './render/image.js'
import {pixivVideoRender, ugoiraEncode} from './render/video.js'
import {APIResponse, IllustBody, IllustDataResponse, PixivData, UgoiraBody} from './type.js'

const getFetch = async (cookies: SnapAppCookies) => {
  const latestHeader = await fetch('https://raw.githubusercontent.com/fa0311/latest-user-agent/main/header.json').then(
    (res) => res.json(),
  )
  const header = {
    ...latestHeader.chrome,
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'ja-JP,ja;q=0.9',
  }
  delete header.host
  delete header.connection

  return async (url: string) => {
    return fetch(url, {
      headers: {
        ...header,
        cookie: cookies.toString(),
      },
    })
  }
}

const app = new SnapApp(
  'pixiv snap',
  'https?://(www.)?pixiv.net',
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
  async (utils) => {
    return {
      text: undefined,
      emoji: 'twemoji',
    }
  },
  async (utils) => {},
)

const render = new SnapRender<PixivData>(
  (data) => {
    return data.ugoira === undefined
  },
  (data) => {
    return [
      ['{id}', data.meta.illust.id],
      ['{user-id}', data.meta.user.userId],
      ['{time-yyyy}', new Date(data.meta.illust.createDate).getFullYear().toString().padStart(4, '0')],
      ['{time-mm}', (new Date(data.meta.illust.createDate).getMonth() + 1).toString().padStart(2, '0')],
      ['{time-dd}', new Date(data.meta.illust.createDate).getDate().toString().padStart(2, '0')],
      ['{time-hh}', new Date(data.meta.illust.createDate).getHours().toString().padStart(2, '0')],
      ['{time-mi}', new Date(data.meta.illust.createDate).getMinutes().toString().padStart(2, '0')],
      ['{time-ss}', new Date(data.meta.illust.createDate).getSeconds().toString().padStart(2, '0')],
    ] as [string, number | string | undefined][]
  },
  async (data, utils) => {
    utils.logger.update(`Rendering image ${data.meta.user.name} ${data.meta.illust.id}`)
    return pixivRender(data, utils, false)
  },
  async (data, utils) => {
    utils.logger.update(`Rendering image ${data.meta.user.name} ${data.meta.illust.id}`)
    const element = await pixivRender(data, utils, true)
    utils.logger.update(`Rendering video ${data.meta.user.name} ${data.meta.illust.id}`)
    const input = await utils.file.tempImg(await utils.render(element))
    await pixivVideoRender(data, utils, input)
  },
)

type MediaResponse = {data: IllustBody; type: 'image'} | {data: UgoiraBody; type: 'ugoira'}

render.media<MediaResponse>(
  'Media',
  (data) => {
    if (data.ugoira) {
      return [{type: 'ugoira', data: data.ugoira}]
    } else {
      return data.illust.map((illust) => ({type: 'image', data: illust}))
    }
  },
  (data) => {
    return [] as [string, number | string | undefined][]
  },
  async (data, utils) => {
    utils.logger.update(`Downloading ${data.type}`)

    if (data.type === 'image') {
      const url = URLPath.fromURL(data.data.urls.original)
      if (!utils.file.path.isExtension(url.extension)) {
        utils.logger.hint(`Extension is ignored, saving as ${url.extension}`)
      }

      await utils.file.saveFetch(url, {
        headers: {
          referer: 'https://www.pixiv.net/',
        },
      })
    } else if (data.type === 'ugoira') {
      if (utils.file.path.isImage()) {
        utils.logger.hint(`Unsupported format: ${utils.file.path.extension}, output as mp4`)
        await ugoiraEncode(utils, data.data, utils.file.path.update({extension: 'mp4'}))
      } else if (utils.file.path.isExtension('')) {
        await ugoiraEncode(utils, data.data, utils.file.path.update({extension: 'mp4'}))
      } else {
        await ugoiraEncode(utils, data.data, utils.file.path)
      }
    }
  },
)

render.json('Json', async (data, utils) => {
  utils.logger.update(`Parsing ${data.meta.user.name} ${data.meta.illust.id}`)
  return data
})

app.call('/artworks/(?<id>[0-9]+)', async (utils, cookie, {id}) => {
  const fetch = await getFetch(cookie)

  const html = await fetch(`https://www.pixiv.net/artworks/${id}`).then((res) => res.text())
  const metaPreloadData = html.match(/<meta name="preload-data" id="meta-preload-data" content='(.+?)'>/)
  const metaJson = JSON.parse(metaPreloadData![1]) as IllustDataResponse

  const url = new URL(`https://www.pixiv.net/ajax/illust/${id}/pages`)
  url.searchParams.append('lang', 'ja')
  url.searchParams.append('version', 'a64d52acd3aace2086ab632abec7a061c10825fe')

  const illustData = (await fetch(url.toString()).then((res) => res.json())) as APIResponse<IllustBody[]>

  const ugoiraData = await (async () => {
    if (metaJson.illust[id].illustType === 2) {
      const url = new URL(`https://www.pixiv.net/ajax/illust/${id}/ugoira_meta`)
      url.searchParams.append('lang', 'ja')
      url.searchParams.append('version', 'a64d52acd3aace2086ab632abec7a061c10825fe')
      return (await fetch(url.toString()).then((res) => res.json())) as APIResponse<UgoiraBody>
    }
  })()

  const res: PixivData = {
    meta: {
      illust: Object.values(metaJson.illust)[0],
      user: Object.values(metaJson.user)[0],
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
