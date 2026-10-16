import ffmpeg from 'fluent-ffmpeg'

export type VideoUtilsParam = {
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffmpegTimeout?: number
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
      ffmpegTimeout: flags.ffmpegTimeout ?? -1,
      ffmpegAdditonalOption: flags.ffmpegAdditonalOption ?? [],
    }
  }

  bypassFFmpeg(command: ffmpeg.FfmpegCommand) {
    const bk = command.availableFormats.bind(command)
    command.availableFormats = (cb) => {
      bk((err, data) => {
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

  getFFmpeg = () => {
    return ffmpeg({
      timeout: this.flags.ffmpegTimeout < 0 ? undefined : this.flags.ffmpegTimeout,
    }).setFfmpegPath(this.flags.ffmpegPath)
  }

  getFFprobe = () => {
    return ffmpeg().setFfprobePath(this.flags.ffprobePath)
  }

  dumpFFmpegCommand = (prefix: string, command: ffmpeg.FfmpegCommand) => {
    const suffix = command
      ._getArguments()
      .map((e) => `"${e}"`)
      .join(' ')
    const c = `${prefix} ${suffix}`
    console.debug(c)
  }

  runFFMpeg = (command: ffmpeg.FfmpegCommand) => {
    this.bypassFFmpeg(command)
    this.dumpFFmpegCommand('ffmpeg', command)
    return new Promise<void>((resolve, reject) => {
      command.on('end', () => resolve())
      command.on('error', reject)
      command.run()
    })
  }

  runFFMpegIntegration = (command: ffmpeg.FfmpegCommand, title: string) => {
    for (const option of this.flags.ffmpegAdditonalOption) {
      command.addOption(option)
    }

    // 色々便利なメタデータをつけるmp4
    const comment = 'Snapped by twitter-snap https://github.com/fa0311/twitter-snap'
    command.addOption('-metadata', `title=${title}`)
    command.addOption('-metadata', `comment=${comment}`)
    command.addOption('-metadata', `creation_time=${new Date().toISOString()}`)

    return this.runFFMpeg(command)
  }

  runProbe = (command: ffmpeg.FfmpegCommand) => {
    this.bypassFFmpeg(command)
    this.dumpFFmpegCommand('ffprobe', command)
    return new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
      command.ffprobe((err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    })
  }
}
