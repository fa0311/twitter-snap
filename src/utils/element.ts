import {ColorThemeType} from '../config'

export type ElementUtilsParam = {
  scale?: number
  theme: string
}

export class ElementUtils {
  private flags: Required<ElementUtilsParam>
  public theme: string

  constructor(flags: ElementUtilsParam) {
    this.flags = {
      scale: flags.scale ?? 1,
      theme: flags.theme,
    }
    this.theme = flags.theme
  }

  get window() {
    return typeof window === 'undefined'
  }

  applyScaleNum = (value: number): number => {
    return Math.floor(value * this.flags.scale)
  }

  applyScale = (value: number): string => {
    return this.applyScaleNum(value) + 'px'
  }

  applyScales = (value: number[]): string => {
    return value.map((v) => this.applyScale(v)).join(' ')
  }
}

export type ElementColorUtilsParam = {
  scale?: number
  theme: string
}

export class ElementColorUtils extends ElementUtils {
  constructor(flags: ElementColorUtilsParam) {
    super({scale: flags.scale, theme: flags.theme})
  }

  getColorTheme = () => {
    return this.theme as ColorThemeType
  }

  getGradient = (): string => {
    switch (this.getColorTheme()) {
      case 'RenderOceanBlueColor': {
        return 'linear-gradient(-45deg, #0077F2ee 0%, #1DA1F2ee 50%,#4CFFE2ee 100%)'
      }

      case 'RenderOceanBlueDarkColor': {
        return 'linear-gradient(-45deg, #0077F2ee 0%, #1DA1F2ee 50%,#4CFFE2ee 100%)'
      }

      case 'RenderSunsetGardenColor': {
        return 'linear-gradient(135deg, #ffced6 0%, #ffdeba 50%, #b5f4b5 100%)'
      }

      case 'RenderSunsetGardenDarkColor': {
        return 'linear-gradient(135deg, #ffced6 0%, #ffdeba 50%, #b5f4b5 100%)'
      }

      case 'RenderDawnBlossomColor': {
        return 'linear-gradient(45deg, #ffd5dc 0%, #aa55aa 100%)'
      }

      case 'RenderDawnBlossomDarkColor': {
        return 'linear-gradient(45deg, #ffd5dc 0%, #aa55aa 100%)'
      }

      case 'RenderFierySunsetColor': {
        return 'linear-gradient(135deg, #FF0000aa 0%, #FFA500aa 100%)'
      }

      case 'RenderFierySunsetDarkColor': {
        return 'linear-gradient(135deg, #FF0000aa 0%, #FFA500aa 100%)'
      }

      case 'RenderTwilightSkyColor': {
        return 'linear-gradient(-45deg, #0077F2ee 0%,#c783ebee 100%)'
      }

      case 'RenderTwilightSkyDarkColor': {
        return 'linear-gradient(-45deg, #0077F2ee 0%,#c783ebee 100%)'
      }

      case 'RenderPlainColor': {
        return '#ffffff'
      }

      case 'RenderPlainDarkColor': {
        return '#000000'
      }

      case 'RenderTransparent': {
        return 'none'
      }

      case 'RenderTransparentDark': {
        return 'none'
      }

      case 'RenderTransparentShadow': {
        return 'none'
      }

      case 'RenderTransparentShadowDark': {
        return 'none'
      }
    }
  }

  getBoxShadow = (): string => {
    switch (this.getColorTheme()) {
      case 'RenderOceanBlueColor': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderOceanBlueDarkColor': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderSunsetGardenColor': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderSunsetGardenDarkColor': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderDawnBlossomColor': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderDawnBlossomDarkColor': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderFierySunsetColor': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderFierySunsetDarkColor': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderTwilightSkyColor': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderTwilightSkyDarkColor': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderPlainColor': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderPlainDarkColor': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderTransparent': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderTransparentDark': {
        return '0px 0px 0px 0px #ffffff00'
      }

      case 'RenderTransparentShadow': {
        return '0px 0px 20px 0px #00000088'
      }

      case 'RenderTransparentShadowDark': {
        return '0px 0px 20px 0px #00000088'
      }
    }
  }

  getDark = (): boolean => {
    switch (this.getColorTheme()) {
      case 'RenderOceanBlueColor': {
        return false
      }

      case 'RenderOceanBlueDarkColor': {
        return true
      }

      case 'RenderSunsetGardenColor': {
        return false
      }

      case 'RenderSunsetGardenDarkColor': {
        return true
      }

      case 'RenderDawnBlossomColor': {
        return false
      }

      case 'RenderDawnBlossomDarkColor': {
        return true
      }

      case 'RenderFierySunsetColor': {
        return false
      }

      case 'RenderFierySunsetDarkColor': {
        return true
      }

      case 'RenderTwilightSkyColor': {
        return false
      }

      case 'RenderTwilightSkyDarkColor': {
        return true
      }

      case 'RenderPlainColor': {
        return false
      }

      case 'RenderPlainDarkColor': {
        return true
      }

      case 'RenderTransparent': {
        return false
      }

      case 'RenderTransparentDark': {
        return true
      }

      case 'RenderTransparentShadow': {
        return false
      }

      case 'RenderTransparentShadowDark': {
        return true
      }
    }
  }
}
