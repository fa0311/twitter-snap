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
