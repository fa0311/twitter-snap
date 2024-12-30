import * as fflate from 'fflate'

import {FilePath} from '../../../utils/path.js'
import {SnapRenderColorUtils, SnapRenderUtils} from '../../../utils/render.js'
import {PixivData, UgoiraBody} from '../type.js'

export const ugoiraEncode = async (utils: SnapRenderUtils, ugoira: UgoiraBody, output: FilePath) => {
  const imagesTemp = utils.file.getTemp('txt')

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
      const path = tempList[file].slice(-1).toString()
      return [`file '${path}'`, `duration ${delay / 1000}`]
    })
    .join('\n')

  await imagesTemp.writeFile(images)

  command.input(imagesTemp.toString())
  command.inputOptions('-f concat')
  command.inputOptions('-safe 0')

  command.output(output.toString())
  await utils.video.runFFMpeg(command)
}

export const pixivVideoRender = async (data: PixivData, utils: SnapRenderColorUtils, input: FilePath) => {
  const margin: number = 30
  const padding: number = 12
  const title = `https://www.pixiv.net/artworks/${data.meta.illust.id}`

  if (!data.ugoira) {
    await utils.video.fromImage(input.toString(), utils.file.path.toString(), title)
    return
  }

  const ugoiraTemp = utils.file.getTemp('mp4')
  await ugoiraEncode(utils, data.ugoira, ugoiraTemp)

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

  command.map('[marge]')
  command.output(utils.file.path.toString())

  await utils.video.runFFMpegIntegration(command, title)
}
