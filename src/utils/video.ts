import {default as ffmpeg, default as ffprobe} from 'fluent-ffmpeg'

export type GetFFmpegType = () => ffmpeg.FfmpegCommand
export type DumpCommandType = (prefix: string, command: ffmpeg.FfmpegCommand) => void
export type RunFFmpegType = (command: ffmpeg.FfmpegCommand) => Promise<unknown>
export type RunFFprobeType = (command: ffprobe.FfmpegCommand) => Promise<ffmpeg.FfprobeData>

export type VideoUtilsParam = {
  ffmpegAdditonalOption?: string[]
  ffmpegPath?: string
  ffprobePath?: string
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

  runFFMpegIntegration: RunFFmpegType = (command) => {
    for (const option of this.flags.ffmpegAdditonalOption) {
      command.addOption(option)
    }

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
