import fs from 'node:fs'
import {ImageResponse} from '@vercel/og'
import {PNG} from 'pngjs'
import {createElement} from 'react'
import type {TweetApiUtilsData} from 'twitter-openapi-typescript'

import {type FilePath, URLPath} from '../../../../utils/path.js'
import type {SnapRenderColorUtils} from '../../../../utils/render.js'
import type {TweetThread} from '../../utils.js'
import {getUserScreenName} from '../utils/utils.js'

// The image renderer paints the video's frame in this color; the video is laid over wherever that frame ended up
export const blankColor = '#ff00fe'

// pngjs's synchronous reader calls zlib.Inflate as a function, which Node 25 refuses; the stream-based parser is fine
const readPng = async (path: string) =>
  new Promise<PNG>((resolve, reject) => {
    new PNG().parse(fs.readFileSync(path), (error, png) => (error ? reject(error) : resolve(png)))
  })

type Rows = {length: number; start: number; y: number}[]

const toBlank = (rows: Rows) => {
  const length = Math.max(...rows.map((row) => row.length))
  const start = Math.min(...rows.filter((row) => row.length === length).map((row) => row.start))
  // The rows above the first full-width one are the rounded corner: their count is the frame's corner radius
  const radius = rows.findIndex((row) => row.length === length)
  return {x: start, y: rows[0].y, width: length, height: rows[rows.length - 1].y - rows[0].y + 1, radius}
}

// Every frame painted in blankColor on the image, top to bottom: the rows holding a run of the marker, split where
// a row without one lies between (frames never touch: media are 4px apart, tweets further)
const findBlanks = async (path: string) => {
  const {width, height, data} = await readPng(path)
  const blanks: ReturnType<typeof toBlank>[] = []
  let rows: Rows = []
  for (let y = 0; y <= height; y++) {
    let best = {start: 0, length: 0}
    let run = 0
    for (let x = 0; x <= width; x++) {
      const i = (y * width + x) * 4
      if (y < height && x < width && data[i] === 0xff && data[i + 1] === 0x00 && data[i + 2] === 0xfe) {
        run++
      } else {
        if (run > best.length) best = {start: x - run, length: run}
        run = 0
      }
    }
    if (best.length >= 32) {
      rows.push({y, ...best})
    } else if (rows.length > 0) {
      blanks.push(toBlank(rows))
      rows = []
    }
  }
  if (blanks.length === 0) throw new Error('Video frame not found on the image')
  return blanks
}

export class RenderBasicVideo {
  constructor(public utils: SnapRenderColorUtils) {}

  render = ({data, input}: {data: TweetApiUtilsData; input: FilePath}) => {
    return this.compose({focal: data, input, tweets: [data]})
  }

  renderThread = ({data, input}: {data: TweetThread; input: FilePath}) => {
    return this.compose({focal: data.focal, input, tweets: data.tweets})
  }

  // Lays the videos over the frames of the rendered image, one frame per tweet with videos, in order. The frames
  // take their turn one after another: a frame shows its first picture until its videos start and its last
  // picture afterwards, so the sound never overlaps; the audio is the sequence of all of them.
  compose = async ({
    focal,
    input,
    tweets,
  }: {
    focal: TweetApiUtilsData
    input: FilePath
    tweets: TweetApiUtilsData[]
  }) => {
    const removeList: string[] = []

    const groups = tweets
      .map((data) =>
        (data.tweet.legacy!.extendedEntities?.media ?? [])
          .filter((e) => e.type !== 'photo')
          .map((e) => {
            return [...e.videoInfo!.variants].sort((a, b) => {
              if (a.bitrate === undefined) return 1
              if (b.bitrate === undefined) return -1
              return b.bitrate - a.bitrate
            })[0]
          }),
      )
      .filter((group) => group.length > 0)
    const screenName = getUserScreenName(focal.user)
    const id = focal.tweet.legacy!.idStr
    const title = `https://twitter.com/${screenName}/status/${id}`

    if (groups.length === 0) {
      await this.utils.video.fromImage(input.toString(), this.utils.file.path.toString(), title)
      return {temp: removeList}
    }

    const blanks = await findBlanks(input.toString())
    if (blanks.length !== groups.length) throw new Error('The video frames on the image do not match the videos')

    // The video gets the frame's rounded corners through an alpha mask, otherwise its corners would poke out of the frame
    const frames = blanks.map((blank) => {
      const width = blank.width - (blank.width % 2)
      const height = blank.height - (blank.height % 2)
      const mask = this.utils.file.getTemp('png')
      const shape = createElement('div', {
        style: {display: 'flex', width, height, background: '#000000', borderRadius: blank.radius},
      })
      const png = new ImageResponse(shape, {width, height}).arrayBuffer()
      removeList.push(mask.toString())
      return {blank, height, mask, png, width}
    })
    for (const {mask, png} of frames) fs.writeFileSync(mask.toString(), Buffer.from(await png))

    const res = groups.flat().map(async ({url}) => {
      const path = URLPath.fromURL(url)
      const temp = this.utils.file.getTemp(path.extension)

      const command = this.utils.video.getFFmpeg()
      command.input(url)
      command.addOption('-c:v', 'copy')
      command.addOption('-c:a', 'copy')
      command.output(temp.toString())
      await this.utils.video.runFFMpeg(command)

      removeList.push(temp.toString())

      const probe = this.utils.video.getFFprobe()
      probe.input(temp.toString())

      const data = await this.utils.video.runProbe(probe)
      const duration = data.format.duration!
      const video = data.streams.find((e) => e.codec_type === 'video')
      const audio = data.streams.find((e) => e.codec_type === 'audio')

      if (!audio) {
        const tempAudio = this.utils.file.getTemp('aac')
        const tempOutput = this.utils.file.getTemp()
        const command = this.utils.video.getFFmpeg()
        command.input('anullsrc=channel_layout=stereo:sample_rate=128000')
        command.inputFormat('lavfi')
        command.addOption('-t', duration.toString())
        command.output(tempAudio.toString())
        await this.utils.video.runFFMpeg(command)

        const command2 = this.utils.video.getFFmpeg()
        command2.input(temp.toString())
        command2.input(tempAudio.toString())
        command2.output(tempOutput.toString())
        await this.utils.video.runFFMpeg(command2)

        removeList.push(tempAudio.toString(), tempOutput.toString())

        return {duration, path: tempOutput}
      }

      if (video) {
        return {duration, path: temp}
      }

      throw new Error('video not found')
    })

    const clips = await Promise.all(res)

    const command = this.utils.video.getFFmpeg()
    command.input(input.toString())
    for (const {path} of clips) command.input(path.toString())
    for (const {mask} of frames) {
      command.input(mask.toString())
      command.inputOptions('-loop', '1')
    }

    const filters = [`[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`]
    let clip = 0
    let offset = 0
    let main = 'i'
    for (const [k, group] of groups.entries()) {
      const {blank, height, width} = frames[k]
      const inputs = group.map(() => 1 + clip++)
      const pad = `scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=w=${width}:h=${height}:x=trunc((ow-iw)/4)*2:y=trunc((oh-ih)/4)*2:color=black,setsar=1/1`
      const all = (e: string) => inputs.map((_, j) => `[${e}${k}_${j}]`).join('')
      filters.push(
        ...inputs.map((n, j) => `[${n}]anull[a${k}_${j}]`),
        ...inputs.map((n, j) => `[${n}]${pad}[v${k}_${j}]`),
        `${all('v')}concat=n=${inputs.length}:v=1:a=0[video${k}]`,
        `${all('a')}concat=n=${inputs.length}:v=0:a=1[audio${k}]`,
        `[video${k}]tpad=start_duration=${offset}:start_mode=clone[wait${k}]`,
        `[${1 + clips.length + k}:v]alphaextract[mask${k}]`,
        `[wait${k}][mask${k}]alphamerge=shortest=1[rounded${k}]`,
        // overlay in RGB: converted to 4:2:0 first, the blank's chroma would bleed into the rows around the video
        `[${main}][rounded${k}]overlay=${blank.x}:${blank.y}:format=rgb[over${k}]`,
      )
      offset += inputs.reduce((sum, n) => sum + clips[n - 1].duration, 0)
      main = `over${k}`
    }
    filters.push(
      `[${main}]format=yuv420p[marge]`,
      `${groups.map((_, k) => `[audio${k}]`).join('')}concat=n=${groups.length}:v=0:a=1[audio]`,
    )
    command.complexFilter(filters)
    command.map('[marge]')
    command.map('[audio]')

    command.output(this.utils.file.path.toString())
    await this.utils.video.runFFMpegIntegration(command, title)

    return {temp: removeList}
  }
}
