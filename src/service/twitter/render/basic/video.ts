import fs from 'node:fs/promises'
import {PNG} from 'pngjs'
import type {TweetApiUtilsData} from 'twitter-openapi-typescript'

import {type FilePath, URLPath} from '../../../../utils/path.js'
import type {SnapRenderColorUtils} from '../../../../utils/render.js'
import {getUserScreenName} from '../utils/utils.js'

// The image renderer paints the video's frame in this color; the video is laid over wherever that frame ended up
export const blankColor = '#ff00fe'

const findBlank = async (path: string) => {
  const {width, height, data} = PNG.sync.read(await fs.readFile(path))
  const rows: {length: number; start: number; y: number}[] = []
  for (let y = 0; y < height; y++) {
    let best = {start: 0, length: 0}
    let run = 0
    for (let x = 0; x <= width; x++) {
      const i = (y * width + x) * 4
      if (x < width && data[i] === 0xff && data[i + 1] === 0x00 && data[i + 2] === 0xfe) {
        run++
      } else {
        if (run > best.length) best = {start: x - run, length: run}
        run = 0
      }
    }
    if (best.length >= 32) rows.push({y, ...best})
  }
  if (rows.length === 0) throw new Error('Video frame not found on the image')
  const length = Math.max(...rows.map((row) => row.length))
  const start = Math.min(...rows.filter((row) => row.length === length).map((row) => row.start))
  return {x: start, y: rows[0].y, width: length, height: rows[rows.length - 1].y - rows[0].y + 1}
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

    const blank = await findBlank(input.toString())
    const width = blank.width - (blank.width % 2)
    const height = blank.height - (blank.height % 2)

    const res = video.map(async ({url}) => {
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

        return tempOutput
      }

      if (video) {
        return temp
      }

      throw new Error('video not found')
    })

    const tempVideo = await Promise.all(res)

    const all = (e: string) => {
      return `${video.map((_, i) => `[${e}${i}]`).join('')}`
    }

    const command = this.utils.video.getFFmpeg()
    command.input(input.toString())
    for (const input of tempVideo) command.input(input.toString())

    const normalize = `setsar=1/1`
    const pad = `scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=w=${width}:h=${height}:x=trunc((ow-iw)/4)*2:y=trunc((oh-ih)/4)*2:color=black`
    command.complexFilter(
      [
        `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
        video.map((_, i) => `[${i + 1}]anull[a${i}]`),
        video.map((_, i) => `[${i + 1}]${pad},${normalize}[v${i}]`),
        `${all('v')}concat=n=${video.length}:v=1:a=0[video]`,
        `${all('a')}concat=n=${video.length}:v=0:a=1[audio]`,
        // overlay in RGB: converted to 4:2:0 first, the blank's chroma would bleed into the rows around the video
        `[i][video]overlay=${blank.x}:${blank.y}:format=rgb,format=yuv420p[marge]`,
      ].flat(),
    )
    command.map('[marge]')
    command.map('[audio]')

    command.output(this.utils.file.path.toString())
    await this.utils.video.runFFMpegIntegration(command, title)

    return {temp: removeList}
  }
}
