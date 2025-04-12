import {ImageResponse} from '@vercel/og'
import fs from 'node:fs/promises'

import {DirectoryPath, FilePath, URLPath} from './path.js'

type TempType =
  | {
      path: DirectoryPath
      type: 'dir'
    }
  | {
      path: FilePath
      type: 'file'
    }

export class FileUtils {
  tempPathList: TempType[]

  constructor(public path: FilePath) {
    this.tempPathList = []
  }

  getTemp = (extension?: string) => {
    const path = this.path.update({
      name: `temp-${this.tempPathList.length}-${this.path.name}`,
      extension: extension ?? this.path.extension,
    })
    this.tempPathList.push({path, type: 'file'})
    return path
  }

  getTempList = () => {
    const path = new DirectoryPath(`${this.path.dir}/temp-${this.tempPathList.length}-${this.path.name}`)
    this.tempPathList.push({path, type: 'dir'})
    return path
  }

  tempCleanup = async () => {
    await Promise.all(
      this.tempPathList.map(async (temp) => {
        await fs.rm(temp.path.toString(), {recursive: temp.type === 'dir'})
      }),
    )
    this.tempPathList = []
  }

  writeFile = async (data: ArrayBuffer, path: FilePath) => {
    await path.writeFile(Buffer.from(data))
  }

  tempImg = async (img: ImageResponse) => {
    const temp = this.getTemp('png')
    await this.writeFile(await img.arrayBuffer(), temp)
    return temp
  }

  temp = async (data: ArrayBuffer) => {
    const temp = this.getTemp()
    await this.writeFile(data, temp)
    return temp
  }

  saveImg = async (img: ImageResponse) => {
    await this.writeFile(await img.arrayBuffer(), this.path)
  }

  save = async (data: ArrayBuffer) => {
    await this.writeFile(data, this.path)
  }

  saveFetch = async (url: URLPath, init?: RequestInit) => {
    const buffer = await fetch(url.toString(), init)
    await this.writeFile(await buffer.arrayBuffer(), this.path.update({extension: url.extension}))
  }
}
