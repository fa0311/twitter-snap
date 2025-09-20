import {ImageResponse} from '@vercel/og'
import fs from 'node:fs/promises'

import {DirectoryPath, FilePath} from './path.js'

export type FontTextOptions = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']>[0]
export type FontEmojiOptions = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['emoji']

export type FontOptions = {
  emoji: FontEmojiOptions
  text: FontTextOptions[] | undefined
}

export type FontUtilsOptions = {
  dir?: DirectoryPath
}

export class FontUtils {
  public dir: DirectoryPath

  constructor(param: FontUtilsOptions) {
    this.dir = param.dir ?? DirectoryPath.from('~/.cache/twitter-snap/fonts')
  }

  async getFonts(file: string, fetch: () => Promise<ArrayBuffer>) {
    const path = FilePath.fromDirectory(this.dir.toString(), file)
    try {
      return await fs.readFile(path.toString())
    } catch {
      const data = await fetch()
      await path.writeFile(Buffer.from(data))
      return data
    }
  }
}
