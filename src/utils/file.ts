import fs from 'node:fs/promises'

import {DirectoryPath, type FilePath, type URLPath} from './path.js'

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
        await fs.rm(temp.path.toString(), {force: true, recursive: temp.type === 'dir'}) // a probe may never have written its file
      }),
    )
    this.tempPathList = []
  }

  writeFile = async (data: ArrayBuffer, path: FilePath) => {
    await path.writeFile(Buffer.from(data))
  }

  tempImg = async (img: Buffer) => {
    const temp = this.getTemp('png')
    await temp.writeFile(img)
    return temp
  }

  temp = async (data: ArrayBuffer) => {
    const temp = this.getTemp()
    await this.writeFile(data, temp)
    return temp
  }

  saveImg = async (img: Buffer) => {
    await this.path.writeFile(img)
  }

  save = async (data: ArrayBuffer) => {
    await this.writeFile(data, this.path)
  }

  saveFetch = async (url: URLPath, init?: RequestInit) => {
    const buffer = await fetch(url.toString(), init)
    await this.writeFile(await buffer.arrayBuffer(), this.path.update({extension: url.extension}))
  }
}
