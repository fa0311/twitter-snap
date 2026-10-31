import fs from 'node:fs/promises'
import {Hono} from 'hono'

import {includeTheme, type SnapRenderItem, type SnapSession} from '../src/app.js'

import {hasKind, themeList} from '../src/config.js'
import {apps} from '../src/service/core.js'
import simpleCache from '../src/utils/cache.js'
import {ElementColorUtils} from '../src/utils/element.js'
import {FileUtils} from '../src/utils/file.js'
import {type FontOptions, FontUtils} from '../src/utils/font.js'
import {LoggerMute} from '../src/utils/logger.js'
import {SnapAppBrowserUtils} from '../src/utils/login.js'
import {FilePath} from '../src/utils/path.js'
import {SnapRenderColorUtils} from '../src/utils/render.js'
import {VideoUtils} from '../src/utils/video.js'
import {renderer} from './renderer.js'

const app = new Hono()

app.use(renderer)

const sessionCache = simpleCache<[SnapSession, FontOptions]>()
const itemCache = simpleCache<SnapRenderItem>()

const getRender = async (url: string) => {
  const app = apps.find((app) => app.test(url))
  if (!app) {
    throw new Error('Unsupported URL')
  }

  const [session, font] = await sessionCache(app.name, async () => {
    const font = await app.fonts(new FontUtils({}))
    const type = await fs
      .access('cookies.json')
      .then(() => 'file' as const)
      .catch(() => 'browser' as const)
    const session = await app.login(
      new SnapAppBrowserUtils({
        sessionType: type,
        browserProfile: '~/.cache/twitter-snap/profiles',
        cookiesFile: 'cookies.json',
      }),
    )
    return [session, font]
  })

  const item = await itemCache(url, async () => {
    const render = await session.render(url, {limit: 1, thread: false})
    for await (const item of render) return item
    throw new Error('No data')
  })
  return {item, font}
}

const getUtils = (font: FontOptions, name: string, theme: string, width: number, scale: number) => {
  return new SnapRenderColorUtils(
    new LoggerMute(),
    new FileUtils(FilePath.from(name)),
    new VideoUtils({
      ffmpegAdditonalOption: ['-preset', 'ultrafast'],
    }),
    font,
    width,
    new ElementColorUtils({theme, scale}),
  )
}

const getQuery = (c: {req: {query: (key: string) => string | undefined}}) => {
  const theme = c.req.query('theme') ?? 'RenderOceanBlueColor'
  if (!includeTheme(theme) || !hasKind(theme, 'element')) {
    throw new Error(`${theme} is not an element theme`)
  }

  return {
    url: c.req.query('url') ?? '',
    theme,
    width: Number(c.req.query('width') ?? 650),
    scale: Number(c.req.query('scale') ?? 1),
  }
}

app.get('/', async (c) => {
  const body = (
    <div>
      <p>select type</p>
      <select id="type">
        <option>element</option>
        <option>image</option>
        <option>video</option>
      </select>
      <p>url</p>
      <input id="url" type="text" />
      <p>theme</p>
      <select id="theme">
        {Object.entries(themeList)
          .filter(([, type]) => type === 'element')
          .map(([theme]) => (
            <option defaultValue={theme} key={theme}>
              {theme}
            </option>
          ))}
      </select>
      <p>width</p>
      <input defaultValue="650" id="width" type="number" />
      <p>scale</p>
      <input defaultValue="1" id="scale" type="number" />
      <button id="submit" type="button">
        submit
      </button>
    </div>
  )
  return c.render(body)
})

app.get('/element', async (c) => {
  const {url, theme, width, scale} = getQuery(c)
  const {font, item} = await getRender(url)
  const id = Math.random().toString(32).slice(2)
  const param = getUtils(font, `temp/${id}.png`, theme, width, scale)
  const element = await item.image(theme, param)
  return c.render(
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{width, display: 'flex'}}>{element}</div>
    </div>,
  )
})

app.get('/image', async (c) => {
  const {url, theme, width, scale} = getQuery(c)
  const {font, item} = await getRender(url)
  const id = Math.random().toString(32).slice(2)
  const param = getUtils(font, `temp/${id}.png`, theme, width, scale)
  const element = await item.image(theme, param)
  const img = await param.render(element)
  c.header('Content-Type', 'image/png')
  const body = Buffer.from(await img.arrayBuffer())
  await param.file.tempCleanup()
  return c.body(body)
})

app.get('/video', async (c) => {
  const {url, theme, width, scale} = getQuery(c)
  const {font, item} = await getRender(url)
  const id = Math.random().toString(32).slice(2)
  const param = getUtils(font, `temp/${id}.mp4`, theme, width, scale)
  await item.video(theme, param)
  const body = await fs.readFile(`./temp/${id}.mp4`)
  await param.file.tempCleanup()
  await fs.unlink(`./temp/${id}.mp4`)
  c.header('Content-Type', 'video/mp4')
  return c.body(body)
})

export default app
