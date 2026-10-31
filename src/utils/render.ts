import {ImageResponse} from '@vercel/og'
import type {ReactElement} from 'react'

import type {ElementColorUtils, ElementUtils} from './element.js'
import type {FileUtils} from './file.js'
import type {FontOptions} from './font.js'
import type {Logger} from './logger.js'
import type {VideoUtils} from './video.js'

export class SnapRenderBaseUtils {
  public stdout: unknown = undefined
  constructor(
    public logger: Logger,
    public file: FileUtils,
    public video: VideoUtils,
    public font: FontOptions,
    public width: number,
    public translate?: string,
  ) {}

  render = async (element: ReactElement) => {
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
    translate?: string,
  ) {
    super(logger, file, video, font, width, translate)
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
    translate?: string,
  ) {
    super(logger, file, video, font, width, translate)
  }
}
