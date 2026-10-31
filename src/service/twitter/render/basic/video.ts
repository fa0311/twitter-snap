import fs from 'node:fs/promises'
import {PNG} from 'pngjs'
import type {TweetApiUtilsData} from 'twitter-openapi-typescript'

import {type FilePath, URLPath} from '../../../../utils/path.js'
import type {SnapRenderColorUtils} from '../../../../utils/render.js'
import {getUserScreenName} from '../utils/utils.js'

// The image renderer paints each video's frame in its own marker color (#ff00fe, #ff00fd, ...); the videos are laid
// over wherever those frames ended up on the rendered image
export const blankColor = (index: number) => `#ff00${(254 - index).toString(16).padStart(2, '0')}`

type Box = {height: number; width: number; x: number; y: number}

const findBlanks = async (path: string) => {
  const {width, height, data} = PNG.sync.read(await fs.readFile(path))
  const rows = new Map<number, {length: number; start: number; y: number}[]>()
  for (let y = 0; y < height; y++) {
    const best = new Map<number, {length: number; start: number}>()
    let run = {index: -1, length: 0}
    for (let x = 0; x <= width; x++) {
      const i = (y * width + x) * 4
      const index =
        x < width && data[i] === 0xff && data[i + 1] === 0x00 && data[i + 2] >= 0xf5 ? 0xfe - data[i + 2] : -1
      if (index === run.index && index >= 0) {
        run.length++
        continue
      }

      if (run.index >= 0 && run.length > (best.get(run.index)?.length ?? 0)) {
        best.set(run.index, {start: x - run.length, length: run.length})
      }

      run = {index, length: index >= 0 ? 1 : 0}
    }

    for (const [index, {start, length}] of best) {
      if (length >= 32) rows.set(index, [...(rows.get(index) ?? []), {y, start, length}])
    }
  }

  const boxes = new Map<number, Box>()
  for (const [index, list] of rows) {
    const length = Math.max(...list.map((row) => row.length))
    const start = Math.min(...list.filter((row) => row.length === length).map((row) => row.start))
    boxes.set(index, {x: start, y: list[0].y, width: length, height: list[list.length - 1].y - list[0].y + 1})
  }

  return boxes
}

export class RenderBasicVideo {
  constructor(public utils: SnapRenderColorUtils) {}

  render = async ({data, input}: {data: TweetApiUtilsData; input: FilePath}) => {
    const removeList: string[] = []

    const extEntities = data.tweet.legacy!.extendedEntities
    const extMedia = extEntities?.media ?? []
    const v = extMedia.filter((e) => e.type !== 'photo')
    const video = v.map((e) => {
      return [...e.videoInfo!.variants].sort((a, b) => {
        if (a.bitrate === undefined) return 1
        if (b.bitrate === undefined) return -1
        return b.bitrate - a.bitrate
      })[0]
    })
    const screenName = getUserScreenName(data.user)
    const id = data.tweet.legacy!.idStr
    const title = `https://twitter.com/${screenName}/status/${id}`

    if (video.length === 0) {
      await this.utils.video.fromImage(input.toString(), this.utils.file.path.toString(), title)
      return {temp: removeList}
    }

    // Only the frames that made it onto the image (a carousel cuts the right-most ones) get a video
    const blanks = await findBlanks(input.toString())
    const shown = video.flatMap((variant, index) => {
      const blank = blanks.get(index)
      return blank ? [{variant, blank}] : []
    })
    if (shown.length === 0) throw new Error('Video frame not found on the image')

    const res = shown.map(async ({variant, blank}) => {
      const path = URLPath.fromURL(variant.url)
      const temp = this.utils.file.getTemp(path.extension)

      const command = this.utils.video.getFFmpeg()
      command.input(variant.url)
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

      if (!video) throw new Error('video not found')
      if (audio) return {path: temp, duration, blank}

      const tempAudio = this.utils.file.getTemp('aac')
      const tempOutput = this.utils.file.getTemp()
      const silence = this.utils.video.getFFmpeg()
      silence.input('anullsrc=channel_layout=stereo:sample_rate=128000')
      silence.inputFormat('lavfi')
      silence.addOption('-t', duration.toString())
      silence.output(tempAudio.toString())
      await this.utils.video.runFFMpeg(silence)

      const merge = this.utils.video.getFFmpeg()
      merge.input(temp.toString())
      merge.input(tempAudio.toString())
      merge.output(tempOutput.toString())
      await this.utils.video.runFFMpeg(merge)

      removeList.push(tempAudio.toString(), tempOutput.toString())

      return {path: tempOutput, duration, blank}
    })

    const tempVideo = await Promise.all(res)
    const longest = Math.max(...tempVideo.map(({duration}) => duration))

    const command = this.utils.video.getFFmpeg()
    command.input(input.toString())
    for (const {path} of tempVideo) command.input(path.toString())

    // Every video plays in its own frame, filling it as x.com does, held on its last frame until the longest ends;
    // the sound is the first video's. The overlays run in RGB: converted to 4:2:0 first, the marker's chroma would
    // bleed into the rows around the video.
    const fill = ({blank, duration}: {blank: Box; duration: number}) => {
      const width = blank.width - (blank.width % 2)
      const height = blank.height - (blank.height % 2)
      return `scale=w=${width}:h=${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1/1,tpad=stop_mode=clone:stop_duration=${longest - duration}`
    }
    command.complexFilter([
      `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[o0]`,
      ...tempVideo.map((item, i) => `[${i + 1}:v]${fill(item)}[v${i}]`),
      ...tempVideo.map(({blank}, i) => `[o${i}][v${i}]overlay=${blank.x}:${blank.y}:format=rgb[o${i + 1}]`),
      `[o${tempVideo.length}]format=yuv420p[marge]`,
      `[1:a]apad=whole_dur=${longest}[audio]`,
    ])
    command.map('[marge]')
    command.map('[audio]')

    command.output(this.utils.file.path.toString())
    await this.utils.video.runFFMpegIntegration(command, title)

    return {temp: removeList}
  }
}
