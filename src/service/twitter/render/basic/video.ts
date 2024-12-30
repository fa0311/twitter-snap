import {TweetApiUtilsData} from 'twitter-openapi-typescript'

import {FilePath} from '../../../../utils/path.js'
import {SnapRenderColorUtils} from '../../../../utils/render.js'
import {getResizedMediaByWidth} from '../../../../utils/video.js'
import {getBiggerMedia} from '../utils/utils.js'

export class RenderBasicVideo {
  margin: number = 30
  padding: number = 12
  bottomPadding: number = 31

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
    const {screenName} = data.user.legacy!
    const id = data.tweet.legacy!.idStr
    const title = `https://twitter.com/${screenName}/status/${id}`

    const [_, blank] = getBiggerMedia(extMedia)

    if (!blank) {
      await this.utils.video.fromImage(input.toString(), this.utils.file.path.toString(), title)
      return {temp: removeList}
    }

    const {width, height} = getResizedMediaByWidth(
      blank.videoInfo!.aspectRatio[0],
      blank.videoInfo!.aspectRatio[1],
      this.utils.width - this.utils.element.applyScaleNum((this.margin + this.padding) * 2),
    )

    const res = video.map(async ({url}, i) => {
      const temp = this.utils.file.getTemp()

      const command = this.utils.video.getFFmpeg()
      command.input(url)
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
        command.input('anullsrc=channel_layout=mono:sample_rate=44100')
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

    const overlayWidth = this.utils.element.applyScaleNum(this.margin + this.padding)
    const overlayHeight = `H-${
      height + this.utils.element.applyScaleNum(this.margin + this.padding + this.bottomPadding)
    }`

    const command = this.utils.video.getFFmpeg()
    command.input(input.toString())
    for (const input of tempVideo) command.input(input.toString())

    const normalize = `setsar=1/1`
    const pad = `scale=w=${width}:h=${height}:force_original_aspect_ratio=1,pad=w=${width}:h=${height}:x=trunc((ow-iw)/4)*2:y=trunc((oh-ih)/4)*2:color=white`
    command.complexFilter(
      [
        `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
        video.map((_, i) => `[${i + 1}]anull[a${i}]`),
        video.map((_, i) => `[${i + 1}]${pad},${normalize}[v${i}]`),
        `${all('v')}concat=n=${video.length}:v=1:a=0[video]`,
        `${all('a')}concat=n=${video.length}:v=0:a=1[audio]`,
        `[i][video]overlay=${overlayWidth}:${overlayHeight}[marge]`,
      ].flat(),
    )
    command.map('[marge]')
    command.map('[audio]')

    command.output(this.utils.file.path.toString())
    await this.utils.video.runFFMpegIntegration(command, title)

    return {temp: removeList}
  }
}
