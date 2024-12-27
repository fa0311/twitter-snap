const colorConfig = {
  video: true,
  image: true,
  json: false,
  auto: false,
} as const

export const colorThemeList = {
  RenderOceanBlueColor: colorConfig,
  RenderOceanBlueDarkColor: colorConfig,
  RenderSunsetGardenColor: colorConfig,
  RenderSunsetGardenDarkColor: colorConfig,
  RenderDawnBlossomColor: colorConfig,
  RenderDawnBlossomDarkColor: colorConfig,
  RenderFierySunsetColor: colorConfig,
  RenderFierySunsetDarkColor: colorConfig,
  RenderTwilightSkyColor: colorConfig,
  RenderTwilightSkyDarkColor: colorConfig,
  RenderPlainColor: colorConfig,
  RenderPlainDarkColor: colorConfig,
  RenderTransparent: colorConfig,
  RenderTransparentDark: colorConfig,
  RenderTransparentShadow: colorConfig,
  RenderTransparentShadowDark: colorConfig,
} as const

export const themeList = {
  ...colorThemeList,
  Json: {
    video: false,
    image: false,
    json: true,
    auto: false,
  },
  LiteJson: {
    video: false,
    image: false,
    json: true,
    auto: false,
  },
  Media: {
    video: false,
    image: false,
    json: false,
    auto: true,
  },
  RenderMakeItAQuote: {
    video: false,
    image: true,
    json: false,
    auto: false,
  },
}

export type ColorThemeType = keyof typeof colorThemeList
export type ThemeNameType = keyof typeof themeList
