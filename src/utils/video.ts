import {default as ffmpeg, default as ffprobe} from 'fluent-ffmpeg'

export type GetFFmpegType = () => ffmpeg.FfmpegCommand
export type DumpCommandType = (prefix: string, command: ffmpeg.FfmpegCommand) => void
export type RunFFmpegType = (command: ffmpeg.FfmpegCommand) => Promise<unknown>
export type RunFFMpegIntegrationType = (command: ffmpeg.FfmpegCommand, title: string) => Promise<unknown>
export type RunFFprobeType = (command: ffprobe.FfmpegCommand) => Promise<ffmpeg.FfprobeData>

export type VideoUtilsParam = {
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffprobePath?: string
}

export const getResizedMediaByWidth = (aspectRatioWidth: number, aspectRatioHeight: number, width: number) => {
  const h = (width * aspectRatioHeight) / aspectRatioWidth
  const height = Math.floor(h / 2) * 2
  return {width, height}
}

export class VideoUtils {
  private flags: Required<VideoUtilsParam>
  constructor(flags: VideoUtilsParam) {
    this.flags = {
      ffmpegPath: flags.ffmpegPath ?? 'ffmpeg',
      ffprobePath: flags.ffprobePath ?? 'ffprobe',
      ffmpegAdditonalOption: flags.ffmpegAdditonalOption ?? [],
    }
  }

  bypassFFmpeg(command: ffmpeg.FfmpegCommand) {
    const bk = command.availableFormats
    command.availableFormats = (cb: (err: any, data: any) => void) => {
      bk.bind(command)((err, data) => {
        const lavfi = {
          canDemux: true,
          canMux: true,
          description: 'Lavfi',
        }
        cb(err, {...data, lavfi})
      })
    }
  }

  fromImage = async (input: string, output: string, title: string) => {
    const command = this.getFFmpeg()
    command.input(input)
    command.addInputOptions('-loop', '1')
    command.addOption('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2')
    command.addOption('-r', '30')
    command.addOption('-t', '5')
    command.addOption('-c:v', 'libx264')
    command.addOption('-pix_fmt', 'yuv420p')
    command.output(output)
    await this.runFFMpegIntegration(command, title)
  }

  getFFmpeg: GetFFmpegType = () => {
    return ffmpeg().setFfmpegPath(this.flags.ffmpegPath)
  }

  getFFprobe: GetFFmpegType = () => {
    return ffprobe().setFfprobePath(this.flags.ffprobePath)
  }

  dumpFFmpegCommand: DumpCommandType = (prefix, command) => {
    const suffix = command
      ._getArguments()
      .map((e) => `"${e}"`)
      .join(' ')
    const c = `${prefix} ${suffix}`
    console.debug(c)
  }

  runFFMpeg: RunFFmpegType = (command) => {
    this.bypassFFmpeg(command)
    this.dumpFFmpegCommand('ffmpeg', command)
    return new Promise((resolve, reject) => {
      command.on('end', resolve)
      command.on('error', reject)
      command.run()
    })
  }

  runFFMpegIntegration: RunFFMpegIntegrationType = (command, title) => {
    for (const option of this.flags.ffmpegAdditonalOption) {
      command.addOption(option)
    }

    const comment = 'Snapped by twitter-snap https://github.com/fa0311/twitter-snap'
    command.addOption('-metadata', `title=${title}`)
    command.addOption('-metadata', `comment=${comment}`)

    return this.runFFMpeg(command)
  }

  runProbe: RunFFprobeType = (command) => {
    this.bypassFFmpeg(command)
    this.dumpFFmpegCommand('ffprobe', command)
    return new Promise((resolve, reject) => {
      command.ffprobe((err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    })
  }
}
