import * as fflate from 'fflate'

import {FilePath} from '../../../utils/path.js'
import {SnapRenderColorUtils} from '../../../utils/render.js'
import {PixivData, UgoiraBody} from '../type.js'

const ugoiraEncode = async (utils: SnapRenderColorUtils, ugoira: UgoiraBody) => {
  const imagesTemp = utils.file.getTemp('txt')
  const ugoiraTemp = utils.file.getTemp('mp4')

  const massiveFileBuf = await fetch(ugoira.originalSrc, {
    headers: {
      referer: 'https://www.pixiv.net/',
    },
  }).then((res) => res.arrayBuffer())

  const massiveFile = new Uint8Array(massiveFileBuf)
  const massiveAgain = await new Promise<fflate.Unzipped>((resolve, reject) => {
    fflate.unzip(massiveFile, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
  const tempDir = utils.file.getTempList()

  const tempListEntries = await Promise.all(
    Object.entries(massiveAgain).map(async ([path, data]) => {
      const temp = tempDir.toFilePath(path)
      await temp.writeFile(data)
      return [path, temp] as const
    }),
  )
  const tempList = Object.fromEntries(tempListEntries)
  const command = utils.video.getFFmpeg()

  const images = Object.values(ugoira.frames)
    .flatMap(({delay, file}) => {
      return [`file '${tempList[file].sliceDirectory(1)}'`, `duration ${delay / 1000}`]
    })
    .join('\n')

  await imagesTemp.writeFile(images)

  command.input(imagesTemp.toString())
  command.inputOptions('-f concat')
  command.inputOptions('-safe 0')

  command.output(ugoiraTemp.toString())
  await utils.video.runFFMpeg(command)

  return ugoiraTemp
}

export const pixivVideoRender = async (data: PixivData, utils: SnapRenderColorUtils, input: FilePath) => {
  const margin: number = 30
  const padding: number = 12

  if (!data.ugoira) {
    return []
  }

  const ugoiraTemp = await ugoiraEncode(utils, data.ugoira)

  const ugoiraCommand = utils.video.getFFprobe()
  ugoiraCommand.input(ugoiraTemp.toString())
  const ugoiraData = await utils.video.runProbe(ugoiraCommand)

  const width = utils.width - utils.element.applyScaleNum((margin + padding) * 2)
  const overlay = utils.element.applyScaleNum(margin + padding)

  const command = utils.video.getFFmpeg()
  command.input(input.toString())
  command.input(ugoiraTemp.toString())

  command.complexFilter([
    `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
    `[1]scale=${width}:-1[video]`,
    `[i][video]overlay=x=${overlay}:y=${overlay}[marge]`,
  ])

  // ffmpeg -i "temp/temp-0-bmqrak5gsuo.png" -i "temp/temp-2-bmqrak5gsuo.mp4" -y -filter_complex "[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i];[1:v]scale='min(iw,(W-10)):-1'[video];[i][video]overlay=x=5:y=10[marge]" -map "[marge]" -preset ultrafast -metadata title="Pixiv Ugoira" -metadata comment="Snapped by twitter-snap https://github.com/fa0311/twitter-snap" "temp/bmqrak5gsuo.mp4"

  command.map('[marge]')
  command.output(utils.file.path.toString())

  await utils.video.runFFMpegIntegration(command, 'Pixiv Ugoira')
}
