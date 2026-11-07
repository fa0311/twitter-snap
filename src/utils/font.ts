import fs from 'node:fs/promises'
import type {Font} from 'satori'

import {DirectoryPath} from './path.js'

export type {Font}

const base = 'https://github.com/fa0311/twitter-snap-core/releases/download/assets-fonts/'
const list = [
  ['SEGOEUISL.TTF', 'Segoe UI', 500, 'normal'],
  ['SEGOEUIB.TTF', 'Segoe UI', 700, 'normal'],
  ['SEGUISLI.TTF', 'Segoe UI', 500, 'italic'],
  ['SEGOEUIZ.TTF', 'Segoe UI', 700, 'italic'],
  ['Meiryo.ttf', 'Meiryo', 500, 'normal'],
  ['Meiryo-Bold.ttf', 'Meiryo', 700, 'normal'],
  ['Meiryo-Italic.ttf', 'Meiryo', 500, 'italic'],
  ['Meiryo-BoldItalic.ttf', 'Meiryo', 700, 'italic'],
] as const

// The font set every service renders with, downloaded once into dir
export const loadFonts = (dir = '~/.cache/twitter-snap/fonts'): Promise<Font[]> => {
  const directory = DirectoryPath.from(dir)
  return Promise.all(
    list.map(async ([file, name, weight, style]) => {
      const path = directory.toFilePath(file)
      const data = await fs.readFile(path.toString()).catch(async () => {
        const data = Buffer.from(await (await fetch(base + file)).arrayBuffer())
        await path.writeFile(data)
        return data
      })
      return {data, name, weight, style}
    }),
  )
}
