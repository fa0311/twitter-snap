export const colorThemeList = {
  RenderOceanBlueColor: 'element',
  RenderOceanBlueDarkColor: 'element',
  RenderSunsetGardenColor: 'element',
  RenderSunsetGardenDarkColor: 'element',
  RenderDawnBlossomColor: 'element',
  RenderDawnBlossomDarkColor: 'element',
  RenderFierySunsetColor: 'element',
  RenderFierySunsetDarkColor: 'element',
  RenderTwilightSkyColor: 'element',
  RenderTwilightSkyDarkColor: 'element',
  RenderPlainColor: 'element',
  RenderPlainDarkColor: 'element',
  RenderTransparent: 'element',
  RenderTransparentDark: 'element',
  RenderTransparentShadow: 'element',
  RenderTransparentShadowDark: 'element',
  RenderXReference: 'element',
  RenderXReferenceDark: 'element',
} as const

export const themeList = {
  ...colorThemeList,
  Json: 'json',
  LiteJson: 'json',
  Media: 'other',
  RenderMakeItAQuote: 'element',
} as const

export type ColorThemeType = keyof typeof colorThemeList
export type ThemeNameType = keyof typeof themeList

export type ThemeFeatureType = (typeof themeList)[ThemeNameType]

export const themeNameList = Object.keys(themeList) as ThemeNameType[]

// Theme names of one kind: ThemeOf<'json'> is 'Json' | 'LiteJson'
export type ThemeOf<K extends ThemeFeatureType> = {
  [N in ThemeNameType]: (typeof themeList)[N] extends K ? N : never
}[ThemeNameType]

export const hasKind = <K extends ThemeFeatureType>(theme: ThemeNameType, kind: K): theme is ThemeOf<K> =>
  themeList[theme] === kind
