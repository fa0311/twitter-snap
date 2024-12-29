import {Session, SnapApp, SnapRender} from '../../app.js'
import {pixivRender} from './render/image.js'
import {IllustBody, IllustBodyResponse, IllustData, IllustDataResponse, IllustUser} from './type.js'

const getHeader = async () => {
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

  return header as any
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
        return new Session(undefined)
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

const render = new SnapRender<[IllustData, IllustUser, IllustBody]>(
  (_) => {
    return true
  },
  ([data, body]) => {
    return [['{id}', data.id]] as [string, number | string | undefined][]
  },
  async (data, utils) => {
    return pixivRender(data, utils, false)
  },
  async (data, utils) => {
    console.log(data)
  },
)

app.call('/artworks/(?<id>[0-9]+)', async (utils, cookie, {id}) => {
  const data = await fetch(`https://www.pixiv.net/artworks/${id}`, {
    headers: {
      ...(await getHeader()),
      cookie: cookie?.toString(),
    },
  })
  const text = await data.text()
  const preloadData = text.match(/<meta name="preload-data" id="meta-preload-data" content='(.+?)'>/)
  const json = JSON.parse(preloadData![1]) as IllustDataResponse

  const url = new URL(`https://www.pixiv.net/ajax/illust/${id}/pages`)
  url.searchParams.append('lang', 'ja')
  url.searchParams.append('version', 'a64d52acd3aace2086ab632abec7a061c10825fe')

  const dataRes = await fetch(url.toString(), {
    headers: {
      ...(await getHeader()),
      cookie: cookie?.toString(),
    },
  })
  const body = (await dataRes.json()) as IllustBodyResponse
  const illust = Object.values(json.illust)[0]
  const user = Object.values(json.user)[0]

  const fn = (async function* () {
    yield [illust, user, body.body] as unknown as [IllustData, IllustUser, IllustBody]
  })()
  return render.run(fn)
})

export default app
