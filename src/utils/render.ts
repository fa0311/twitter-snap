import {ImageResponse} from '@vercel/og'

import {ElementColorUtils, ElementUtils} from './element.js'
import {FileUtils} from './file.js'
import {FontOptions} from './font.js'
import {Logger} from './logger.js'
import {VideoUtils} from './video.js'

export class SnapRenderBaseUtils {
  public stdout: any = undefined
  constructor(
    public logger: Logger,
    public file: FileUtils,
    public video: VideoUtils,
    public font: FontOptions,
    public width: number,
  ) {}

  render = async (element: React.ReactElement) => {
    return new ImageResponse(element, {
      emoji: this.font.emoji,
      fonts: this.font.text,
      height: undefined,
      width: this.width,
    })
  }
}

export class SnapRenderUtils extends SnapRenderBaseUtils {
  constructor(
    logger: Logger,
    file: FileUtils,
    video: VideoUtils,
    font: FontOptions,
    width: number,
    public element: ElementUtils,
  ) {
    super(logger, file, video, font, width)
  }

  render = async (element: React.ReactElement) => {
    return new ImageResponse(element, {
      emoji: this.font.emoji,
      fonts: this.font.text,
      height: undefined,
      width: this.width,
    })
  }
}

export class SnapRenderColorUtils extends SnapRenderBaseUtils {
  constructor(
    logger: Logger,
    file: FileUtils,
    video: VideoUtils,
    font: FontOptions,
    width: number,
    public element: ElementColorUtils,
  ) {
    super(logger, file, video, font, width)
  }

  render = async (element: React.ReactElement) => {
    return new ImageResponse(element, {
      emoji: this.font.emoji,
      fonts: this.font.text,
      height: undefined,
      width: this.width,
    })
  }
}
