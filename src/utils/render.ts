import type {ReactElement} from 'react'
import satori from 'satori'
import sharp from 'sharp'

import type {ElementColorUtils, ElementUtils} from './element.js'
import type {FileUtils} from './file.js'
import {type FontOptions, type FontTextOptions, loadAdditionalAsset} from './font.js'
import type {Logger} from './logger.js'
import type {VideoUtils} from './video.js'

export const renderPng = async (
  element: ReactElement,
  options: {width: number; height?: number; fonts: FontTextOptions[]},
) => {
  const svg = await satori(element, {...options, loadAdditionalAsset})
  return sharp(Buffer.from(svg)).resize(options.width).png().toBuffer()
}

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
    return renderPng(element, {width: this.width, fonts: this.font.text ?? []})
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
