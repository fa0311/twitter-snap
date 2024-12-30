import {Session, SnapApp, SnapRender} from '../../app.js'
import {SnapAppCookies} from '../../utils/cookies.js'
import {pixivRender} from './render/image.js'
import {pixivVideoRender} from './render/video.js'
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
      ['{user-screen-name}', data.meta.user.userId],
    ] as [string, number | string | undefined][]
  },
  async (data, utils) => {
    return pixivRender(data, utils, false)
  },
  async (data, utils) => {
    const element = await pixivRender(data, utils, true)
    const input = await utils.file.tempImg(await utils.render(element))
    await pixivVideoRender(data, utils, input)
  },
)

app.call('/artworks/(?<id>[0-9]+)', async (utils, cookie, {id}) => {
  const fetch = await getFetch(cookie)

  const html = await fetch(`https://www.pixiv.net/artworks/${id}`).then((res) => res.text())
  const metaPreloadData = html.match(/<meta name="preload-data" id="meta-preload-data" content='(.+?)'>/)
  const metaJson = JSON.parse(metaPreloadData![1]) as IllustDataResponse

  const url = new URL(`https://www.pixiv.net/ajax/illust/${id}/pages`)
  url.searchParams.append('lang', 'ja')
  url.searchParams.append('version', 'a64d52acd3aace2086ab632abec7a061c10825fe')

  const illustData = (await fetch(url.toString()).then((res) => res.json())) as APIResponse<IllustBody>

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
