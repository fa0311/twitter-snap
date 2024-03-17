import {type ImageResponse} from '@vercel/og'
import {promises as fs} from 'node:fs'

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']>[0]
type FontFile = Omit<Fonts, 'data'> & {data: string}

export const getFonts = async (path: string): Promise<Fonts[]> => {
  const raw = await fs.readFile(path, 'utf8')
  const fonts: FontFile[] = JSON.parse(raw)
  const res = fonts.map(async (font) => ({
      ...font,
      data: await fs.readFile(font.data),
    }))
  return Promise.all(res)
}
