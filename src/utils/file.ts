import {ImageResponse} from '@vercel/og'
import fs from 'node:fs/promises'

import {FilePath, URLPath} from './path'

export class FileUtils {
  tempPathList: FilePath[]
  jsonOutputData: any

  constructor(public path: FilePath, public stdout = false) {
    this.tempPathList = []
  }

  getTemp = (extension?: string) => {
    const path = this.path.update({
      name: `temp-${this.tempPathList.length}-${this.path.name}`,
      extension: extension ?? this.path.extension,
    })
    this.tempPathList.push(path)
    return path
  }

  tempCleanup = async () => {
    await Promise.all(this.tempPathList.map(async (temp) => fs.rm(temp.toString())))
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

  saveFetch = async (url: URLPath) => {
    const buffer = await fetch(url.toString())
    await this.writeFile(await buffer.arrayBuffer(), this.path.update({extension: url.extension}))
  }

  jsonOutput = async (data: any) => {
    if (this.stdout) {
      this.jsonOutputData = data
    } else {
      await this.path.update({extension: 'json'}).writeFile(JSON.stringify(data, null, 2))
    }
  }
}
