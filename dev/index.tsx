import {Hono} from 'hono'
import fs from 'node:fs/promises'
import * as React from 'react'

import type {Session} from '../src/app.js'

import {themeList} from '../src/config.js'
import {apps} from '../src/service/core.js'
import {ElementColorUtils} from '../src/utils/element.js'
import {FileUtils} from '../src/utils/file.js'
import {type FontOptions, FontUtils} from '../src/utils/font.js'
import {LoggerMute} from '../src/utils/logger.js'
import {SnapAppBrowserUtils} from '../src/utils/login.js'
import {DirectoryPath, FilePath} from '../src/utils/path.js'
import {SnapRenderColorUtils} from '../src/utils/render.js'
import {VideoUtils} from '../src/utils/video.js'
import {renderer} from './renderer.js'

const app = new Hono()

app.use(renderer)

const cache = <T extends any[]>() => {
  const cache: {[key: string]: T} = {}
  return async (key: string, callback: () => Promise<T>) => {
    if (cache[key] === undefined) {
      cache[key] = await callback()
      return cache[key]
    }

    return cache[key]
  }
}

const sessionCache = cache<[Session<any>, FontOptions]>()
const fetchCache = cache<any>()

const getRender = async (url: string) => {
  const app = apps.find((app) => app.pattern.test(url))
  if (!app) {
    throw new Error('Unsupported URL')
  }

  const prefix = app.pattern.exec(url)![0]
  const path = url.slice(prefix.length)
  const match = app.callbackList.find(([regs]) => regs.test(path))
  if (!match) {
    throw new Error('Unsupported URL')
  }

  const groups = match[0].exec(url)!.groups!
  const [session, font] = await sessionCache(app.name, async () => {
    const font = await app.fonts(new FontUtils(DirectoryPath.from('~/.cache/twitter-snap/fonts')))
    const type = await fs
      .access('cookies.json')
      .then(() => 'file' as const)
      .catch(() => 'browser' as const)
    const session = await app.callback(
      new SnapAppBrowserUtils({
        sessionType: type,
        browserProfile: '~/.cache/twitter-snap/profiles',
        cookiesFile: 'cookies.json',
      }),
    )
    return [session, font]
  })

  const render = await match[1]({limit: 1}, session.api, groups)
  return {render, font}
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
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
      </select>
      <p>width</p>
      <input id="width" type="number" value="650" />
      <p>scale</p>
      <input id="scale" type="number" value="1" />
      <button id="submit">submit</button>
    </div>
  )
  return c.render(body)
})

app.get('/element', async (c) => {
  const url = c.req.query('url')!
  const theme = c.req.query('theme')!
  const width = Number(c.req.query('width')!)
  const scale = Number(c.req.query('scale')!)

  const {font, render} = await getRender(url)
  const data = await fetchCache(url, async () => {
    return (await render.data.next()).value
  })
  const id = Math.random().toString(32).slice(2)
  const param = getUtils(font, `temp/${id}.png`, theme, width, scale)
  const element = await render.image(theme)(data, param)
  return c.render(
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{width, display: 'flex'}}>{element}</div>
    </div>,
  )
})

app.get('/image', async (c) => {
  const url = c.req.query('url')!
  const theme = c.req.query('theme')!
  const width = Number(c.req.query('width')!)
  const scale = Number(c.req.query('scale')!)

  const {font, render} = await getRender(url)
  const data = await fetchCache(url, async () => {
    return (await render.data.next()).value
  })
  const id = Math.random().toString(32).slice(2)
  const param = getUtils(font, `temp/${id}.png`, theme, width, scale)
  const element = await render.image(theme)(data, param)
  const img = await param.render(element)
  c.header('Content-Type', 'image/png')
  const body = Buffer.from(await img.arrayBuffer())
  await param.file.tempCleanup()
  return c.body(body)
})

app.get('/video', async (c) => {
  const url = c.req.query('url')!
  const theme = c.req.query('theme')!
  const width = Number(c.req.query('width')!)
  const scale = Number(c.req.query('scale')!)

  const {font, render} = await getRender(url)
  const data = await fetchCache(url, async () => {
    return (await render.data.next()).value
  })
  const id = Math.random().toString(32).slice(2)
  const param = getUtils(font, `temp/${id}.mp4`, theme, width, scale)
  await render.video(theme)(data, param)
  const body = await fs.readFile(`./temp/${id}.mp4`)
  await param.file.tempCleanup()
  await fs.unlink(`./temp/${id}.mp4`)
  c.header('Content-Type', 'video/mp4')
  return c.body(body)
})

export default app
