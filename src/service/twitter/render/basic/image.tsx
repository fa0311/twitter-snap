import split from 'graphemesplit'
import type {CSSProperties, ReactElement} from 'react'
import {type TweetApiUtilsData, userOrNullConverter} from 'twitter-openapi-typescript'
import {
  type BirdwatchPivot,
  NoteTweetResultRichTextTagRichtextTypesEnum as RichtextTypesEnum,
  type UserProfileImageShapeEnum,
} from 'twitter-openapi-typescript-generated'

import type {SnapRenderColorUtils} from '../../../../utils/render.js'
import {splitLineBreak} from '../../../../utils/text.js'
import {getResizedMediaByWidth} from '../../../../utils/video.js'
import {
  getBiggerMedia,
  getUserAvatarUrl,
  getUserName,
  getUserScreenName,
  getUserVerified,
  getUserVerifiedType,
  type RenderCssType,
  type RenderWidgetType,
} from '../utils/utils.js'

type UnifiedCardDetails = {
  type: 'details'
  data: {title: {content: string}; subtitle: {content: string}}
}

type UnifiedCardGrokShare = {
  type: 'grok_share'
  data: {conversation_preview: {message: string; mediaUrls: string[]}[]}
}

type UnifiedCard = {
  component_objects: Record<string, {type: string}>
  media_entities: Record<string, {media_url_https: string}>
}

const isDetails = (e: {type: string}): e is UnifiedCardDetails => e.type === 'details'
const isGrokShare = (e: {type: string}): e is UnifiedCardGrokShare => e.type === 'grok_share'

export class RenderTweetImage {
  backgroundColor: string
  subBackgroundColor: string
  textColor: string
  subTextColor: string
  borderColor: string
  imageBorderColor: string
  mediaBorderColor: string
  frameBorderColor: string
  mediaRadius: number = 10
  linkColor: string = '#1d9bf0'
  cardSuffix: string
  fontFamily: string
  rawAssetsUrl: string
  margin: number = 30
  padding: number = 12
  bottomPadding: number = 32 // gap + time line below the video blank
  bodyGap: number = 10 // between header, text, quote and video blank

  constructor(
    public utils: SnapRenderColorUtils,
    public video: boolean,
  ) {
    this.backgroundColor = this.utils.element.getDark() ? '#000000' : '#ffffff'
    this.subBackgroundColor = this.utils.element.getDark() ? '#16181c' : '#f7f9f9'
    this.textColor = this.utils.element.getDark() ? '#ffffff' : '#000000'
    this.subTextColor = this.utils.element.getDark() ? '#71767b' : '#536471'
    this.borderColor = this.utils.element.getDark() ? '#2f3336' : '#cfd9de'
    this.imageBorderColor = this.utils.element.getDark() ? '#000000' : '#e6e6e6'
    this.mediaBorderColor = this.imageBorderColor
    this.frameBorderColor = this.utils.element.getDark() ? '#2f3336' : '#eff3f4'
    this.cardSuffix = this.utils.element.getDark() ? '-dark' : ''
    this.fontFamily = 'Segoe UI,Meiryo,system-ui,sans-serif'
    this.rawAssetsUrl = 'https://raw.githubusercontent.com/fa0311/twitter-snap-core/main/assets'
  }

  getBadgeWidget: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const src = (() => {
      if (getUserVerifiedType(data.user) === 'Business') {
        return `${this.rawAssetsUrl}/twitter/gold-badge.png`
      }

      if (getUserVerifiedType(data.user) === 'Government') {
        return `${this.rawAssetsUrl}/twitter/gray-badge.png`
      }

      return `${this.rawAssetsUrl}/twitter/blue-badge.png`
    })()
    return (
      <img
        src={src}
        style={{
          width: this.utils.element.applyScale(15),
          height: this.utils.element.applyScale(15),
          marginTop: this.utils.element.applyScale(4),
        }}
      />
    )
  }

  getCardURL = (): string => {
    return `${this.rawAssetsUrl}/twitter/card${this.cardSuffix}.png`
  }

  // Width left for the tweet body once the frame's margin and padding are taken off
  contentWidth = (): number => this.utils.width - this.utils.element.applyScaleNum((this.margin + this.padding) * 2)

  // Where the video goes on the rendered image: inside the 1px frame of the blank, measured from the left and the bottom
  videoInset = () => {
    const border = this.utils.element.applyScaleNum(1)
    return {
      x: this.utils.element.applyScaleNum(this.margin + this.padding) + border,
      bottom: this.utils.element.applyScaleNum(this.margin + this.padding + this.bottomPadding) + border,
      width: this.contentWidth() - border * 2,
    }
  }

  removeUnsupportChar = (text: string): string => {
    return [...text]
      .map((c) => {
        const code = c.codePointAt(0) ?? 0
        if (code >= 0x0600 && code <= 0x06ff) {
          return ''
        }

        if (code >= 0x0750 && code <= 0x077f) {
          return ''
        }

        if (code >= 0x08a0 && code <= 0x08ff) {
          return ''
        }

        return c
      })
      .join('')
  }

  getIconShapeWidget: (props: {type: UserProfileImageShapeEnum}) => CSSProperties = ({type}) => {
    switch (type) {
      case 'Square': {
        return {
          borderRadius: 4,
        }
      }

      case 'Circle': {
        return {
          borderRadius: '50%',
        }
      }

      case 'Hexagon': {
        return {
          borderRadius: '50%',
        }
        // return {
        //   borderRadius: "50%",
        //   clipPath:
        //     "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        // };
      }
    }
  }

  icon: RenderWidgetType<{alt: string; margin?: number; size: number; src?: string; type?: UserProfileImageShapeEnum}> =
    ({alt, margin, size, src, type}) => {
      const scaledSize = this.utils.element.applyScale(size)
      const style = {
        width: scaledSize,
        height: scaledSize,
        margin: this.utils.element.applyScale(margin ?? 4),
        ...(type ? this.getIconShapeWidget({type}) : {borderRadius: '50%'}),
      }

      if (!src) {
        return <div style={{...style, background: this.subBackgroundColor}} />
      }

      return <img alt={alt} src={src} style={style} />
    }

  textOverFlowCSS: RenderCssType<{lineClamp: number}> = ({lineClamp}) => {
    return {
      display: this.utils.element.window ? '-webkit-box' : 'block',
      WebkitLineClamp: lineClamp,
      lineClamp,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }
  }

  // Counts as x.com shows them: 9,999 / 12K / 340K / 366.6M (truncated, not rounded)
  toKMB = (num: number): string => {
    if (num < 10000) return num.toLocaleString('en-US')
    if (num < 1000000) return `${Math.floor(num / 1000)}K`
    if (num < 1000000000) return `${(Math.floor(num / 100000) / 10).toFixed(1)}M`
    return `${(Math.floor(num / 100000000) / 10).toFixed(1)}B`
  }

  // "Oct 22" this year, "Oct 22, 2024" otherwise, as x.com dates a quoted tweet
  shortDate = (time: string): string => {
    const date = new Date(time)
    const thisYear = date.getFullYear() === new Date().getFullYear()
    return date.toLocaleString('en-US', {month: 'short', day: 'numeric', ...(thisYear ? {} : {year: 'numeric'})})
  }

  toOriginal = (url: URL): URL => {
    // name=orig is the only variant the CDN serves for every photo; format=jpg&name=4096x4096 answers 404 for some
    url.searchParams.set('name', 'orig')
    return url
  }

  htmlParse = (text: string): string => {
    return text.replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  }

  render: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          padding: this.utils.element.applyScale(this.margin),
          background: this.utils.element.getGradient(),
          fontFamily: this.fontFamily,
        }}
      >
        <div
          style={{
            width: '100%',
            background: this.backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: this.utils.element.applyScale(10),
            padding: this.utils.element.applyScale(this.padding),
            gap: this.utils.element.applyScale(12),
            boxShadow: this.utils.element.getBoxShadow(),
          }}
        >
          <this.userRender data={data} />
          {data.tweet.card?.legacy && <this.ogp data={data} quoted={false} />}
          {data.tweet.birdwatchPivot && <this.birdwatch data={data.tweet.birdwatchPivot} />}

          <this.bottonWidget data={data} />
        </div>
      </div>
    )
  }

  bottonWidget: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const time = data.tweet.legacy!.createdAt

    const timeString = new Date(time).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })

    const dateString = new Date(time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const view = data.tweet.views?.count
    const sub = {color: this.subTextColor, fontSize: this.utils.element.applyScale(15)}
    const small = {fontSize: this.utils.element.applyScale(14), lineHeight: this.utils.element.applyScale(16)}

    return (
      <p
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: this.utils.element.applyScale(0),
          gap: this.utils.element.applyScale(4),
          lineHeight: this.utils.element.applyScale(20),
        }}
      >
        <span style={sub}>{timeString}</span>
        <span style={sub}>·</span>
        <span style={sub}>{dateString}</span>
        {view && <span style={sub}>·</span>}
        {view && <span style={{...small, color: this.textColor, fontWeight: '700'}}>{this.toKMB(Number(view))}</span>}
        {view && <span style={{...small, color: this.subTextColor}}>Views</span>}
      </p>
    )
  }

  poll: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const values = data.tweet.card?.legacy?.bindingValues ?? []
    const get = (key: string) => values.find((v) => v.key === key)?.value
    const choices = [1, 2, 3, 4].flatMap((i) => {
      const label = get(`choice${i}_label`)?.stringValue
      return label === undefined ? [] : [{label, count: Number(get(`choice${i}_count`)?.stringValue ?? 0)}]
    })
    const total = choices.reduce((sum, {count}) => sum + count, 0)
    const max = Math.max(...choices.map(({count}) => count))
    const end = new Date(get('end_datetime_utc')?.stringValue ?? 0)
    const final = get('counts_are_final')?.booleanValue || end.getTime() <= Date.now()
    const font = this.utils.element.applyScale(15)

    const timeLeft = (() => {
      const minutes = Math.ceil((end.getTime() - Date.now()) / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`
      if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} left`
      return `${minutes} minute${minutes === 1 ? '' : 's'} left`
    })()

    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: this.utils.element.applyScale(12)}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: this.utils.element.applyScale(4)}}>
          {choices.map(({label, count}, i) => {
            const percent = total === 0 ? 0 : (count / total) * 100
            const lead = count === max
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  position: 'relative',
                  alignItems: 'center',
                  height: this.utils.element.applyScale(32),
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${percent}%`,
                    minWidth: this.utils.element.applyScale(7),
                    borderRadius: this.utils.element.applyScale(4),
                    background: lead ? '#1d9bf094' : this.borderColor,
                  }}
                />
                <p
                  style={{
                    flexGrow: 1,
                    margin: this.utils.element.applyScale(0),
                    padding: this.utils.element.applyScales([0, 12]),
                    fontSize: font,
                    fontWeight: lead ? '700' : '400',
                    color: this.textColor,
                    ...this.textOverFlowCSS({lineClamp: 1}),
                  }}
                >
                  {this.removeUnsupportChar(label)}
                </p>
                <p
                  style={{
                    margin: this.utils.element.applyScale(0),
                    paddingLeft: this.utils.element.applyScale(12),
                    fontSize: font,
                    fontWeight: lead ? '700' : '400',
                    color: this.textColor,
                  }}
                >
                  {`${percent.toFixed(1)}%`}
                </p>
              </div>
            )
          })}
        </div>
        <p
          style={{
            display: 'flex',
            margin: this.utils.element.applyScale(0),
            gap: this.utils.element.applyScale(4),
            fontSize: font,
            color: this.subTextColor,
          }}
        >
          <span>{`${total.toLocaleString('en-US')} vote${total === 1 ? '' : 's'}`}</span>
          <span>·</span>
          <span>{final ? 'Final results' : timeLeft}</span>
        </p>
      </div>
    )
  }

  birdwatch: RenderWidgetType<{data: BirdwatchPivot}> = ({data}) => {
    const border = `${this.utils.element.applyScale(1)} solid ${this.borderColor}`
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: this.utils.element.applyScale(12)}}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border,
            borderRadius: this.utils.element.applyScale(16),
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: this.utils.element.applyScale(8),
              padding: this.utils.element.applyScale(12),
              borderRadius: this.utils.element.applyScales([15, 15, 0, 0]),
              background: this.subBackgroundColor,
            }}
          >
            <svg
              width={this.utils.element.applyScale(19)}
              height={this.utils.element.applyScale(19)}
              viewBox="0 0 24 24"
              fill="#1d9bf0"
              style={{flexShrink: 0}}
            >
              <path d="M5.5 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm18.25 13.91c-.18-2.01-.78-3.72-1.81-4.96C20.89 10.7 19.45 10 17.75 10c-.35 0-.68.03-1.01.09-.18.54-.45 1.05-.8 1.49.74.46 1.41 1.05 1.99 1.76 1.05 1.3 1.71 2.91 2.06 4.66h3.85l-.09-1.09zM18.5 9c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM6.07 13.34c.58-.71 1.25-1.3 1.99-1.76-.35-.44-.62-.95-.8-1.49-.33-.06-.66-.09-1.01-.09-1.7 0-3.14.7-4.19 1.95C1.032 13.19.433 14.9.254 16.91L.157 18H4.01c.35-1.75 1.01-3.36 2.06-4.66zM15 8.5c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm-7.37 6.1c-1.07 1.32-1.69 3.15-1.88 5.31L5.66 21h12.68l-.09-1.09c-.19-2.16-.81-3.99-1.88-5.31-1.08-1.35-2.59-2.1-4.37-2.1s-3.28.75-4.37 2.1z" />
            </svg>
            <p
              style={{
                flexGrow: 1,
                flexShrink: 1,
                margin: this.utils.element.applyScale(0),
                padding: this.utils.element.applyScales([2, 0]),
                fontSize: this.utils.element.applyScale(14),
                fontWeight: '700',
                color: this.textColor,
              }}
            >
              {this.removeUnsupportChar(data.title)}
            </p>
          </div>
          {data.subtitle && (
            <div
              style={{
                display: 'flex',
                paddingTop: this.utils.element.applyScale(12),
                paddingBottom: this.utils.element.applyScale(12),
                paddingLeft: this.utils.element.applyScale(12),
                paddingRight: this.utils.element.applyScale(12),
              }}
            >
              <this.paragraph
                chars={this.richText(data.subtitle.text, data.subtitle.entities)}
                fontSize={15}
                lineHeight={20}
              />
            </div>
          )}
          {data.callToAction && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: this.utils.element.applyScale(12),
                borderTop: border,
              }}
            >
              <p
                style={{
                  margin: this.utils.element.applyScale(0),
                  fontSize: this.utils.element.applyScale(14),
                  color: this.textColor,
                }}
              >
                {this.removeUnsupportChar(data.callToAction.prompt)}
              </p>
              <p
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: this.utils.element.applyScale(32),
                  margin: this.utils.element.applyScale(0),
                  padding: this.utils.element.applyScales([0, 16]),
                  border,
                  borderRadius: this.utils.element.applyScale(9999),
                  fontSize: this.utils.element.applyScale(14),
                  fontWeight: '700',
                  color: this.textColor,
                }}
              >
                {this.removeUnsupportChar(data.callToAction.title)}
              </p>
            </div>
          )}
        </div>
        {data.footer && (
          <this.paragraph
            chars={this.richText(data.footer.text, data.footer.entities)}
            color={this.subTextColor}
            fontSize={13}
            lineHeight={16}
          />
        )}
      </div>
    )
  }

  // Graphemes of a text, the entity ranges (code point indices, as X counts them) in the link color
  richText = (text: string, entities: {fromIndex: number; toIndex: number}[]) => {
    let index = 0
    return split(text).map((char) => {
      const link = entities.some(({fromIndex, toIndex}) => fromIndex <= index && index < toIndex)
      index += [...char].length
      return {char, properties: link ? {color: this.linkColor} : {}}
    })
  }

  // Lays text out as a browser does: a flex-wrap of UAX #14 units, a newline unit forcing the break
  paragraph: RenderWidgetType<{
    chars: {char: string; properties: CSSProperties}[]
    color?: string
    fontSize: number
    lineHeight: number
  }> = ({chars, color, fontSize, lineHeight}) => {
    const units = splitLineBreak(chars)
    return (
      <p
        style={{
          fontSize: this.utils.element.applyScale(fontSize),
          lineHeight: this.utils.element.applyScale(lineHeight),
          margin: this.utils.element.applyScale(0),
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {units.map((y, i) => {
          const n = y.length === 1 && y[0].char === '\n'
          const last = i > 0 && units[i - 1]
          const lastN = last && last.length === 1 && last[0].char === '\n'

          return (
            <span
              key={i}
              style={{
                display: 'flex',
                ...(n ? {width: '100%'} : {}),
                ...(n && lastN ? {height: this.utils.element.applyScale(lineHeight)} : {}),
              }}
            >
              {y.map(({char, properties}, i) => (
                <span
                  key={i}
                  style={{
                    color: color ?? this.textColor,
                    ...(char === ' ' ? {width: '0.25em'} : {}),
                    ...properties,
                  }}
                >
                  {this.removeUnsupportChar(char)}
                </span>
              ))}
            </span>
          )
        })}
      </p>
    )
  }

  // Cards; inside a quoted tweet the large image runs flush with the box and carries no caption
  ogp: RenderWidgetType<{data: TweetApiUtilsData; quoted: boolean}> = ({data, quoted}) => {
    const legacy = data.tweet.card?.legacy
    if (legacy?.name.startsWith('poll')) return <this.poll data={data} />
    const value = (key: string) => legacy?.bindingValues.find((v) => v.key === key)?.value
    const thumbnail = value('thumbnail_image_original')?.imageValue
    // broadcast thumbnails come as webp, which the renderer cannot decode; the CDN serves the same file as jpg
    const toJpg = (image: {url: string}) => {
      const url = new URL(image.url)
      if (url.searchParams.get('format') === 'webp') url.searchParams.set('format', 'jpg')
      return {...image, url: url.toString()}
    }
    const broadcast = value('broadcast_thumbnail_x_large')?.imageValue
    const summary = value('summary_photo_image_original')?.imageValue ?? (broadcast && toJpg(broadcast))
    const player = value('player_image_large')?.imageValue
    const title = value('title')?.stringValue ?? value('broadcast_title')?.stringValue
    const vanityUrl = value('vanity_url')?.stringValue
    const description = value('description')?.stringValue
    const unifiedCard = value('unified_card')?.stringValue

    if (summary) {
      return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{width: '100%', display: 'flex', position: 'relative'}}>
            <img
              src={summary.url}
              style={{
                width: '100%',
                borderRadius: quoted ? 0 : this.utils.element.applyScale(this.mediaRadius),
                border: quoted ? 'none' : `${this.utils.element.applyScale(1)} solid ${this.mediaBorderColor}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: this.utils.element.applyScale(12),
                left: this.utils.element.applyScale(12),
                right: this.utils.element.applyScale(12),
                display: 'flex',
              }}
            >
              <p
                style={{
                  fontSize: this.utils.element.applyScale(13),
                  lineHeight: this.utils.element.applyScale(16),
                  padding: this.utils.element.applyScales([2, 8]),
                  margin: this.utils.element.applyScale(0),
                  background: '#000000c4',
                  color: '#ffffff',
                  borderRadius: this.utils.element.applyScale(4),
                  ...this.textOverFlowCSS({lineClamp: 1}),
                }}
              >
                {title}
              </p>
            </div>
          </div>
          {vanityUrl && !quoted && (
            <p
              style={{
                fontSize: this.utils.element.applyScale(13),
                lineHeight: this.utils.element.applyScale(16),
                margin: this.utils.element.applyScales([4, 0, 0, 0]),
                color: this.subTextColor,
              }}
            >
              From {vanityUrl}
            </p>
          )}
        </div>
      )
    }

    if (unifiedCard) {
      const unifiedCardData = JSON.parse(unifiedCard) as UnifiedCard
      const components = Object.values(unifiedCardData.component_objects)
      const detailsData = components.find(isDetails)
      const grokData = components.find(isGrokShare)

      if (detailsData) {
        const imgData = Object.values(unifiedCardData.media_entities)[0] // MediaExtended

        return (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <div style={{width: '100%', display: 'flex', position: 'relative'}}>
              <img
                src={imgData.media_url_https}
                style={{
                  width: '100%',
                  borderRadius: this.utils.element.applyScale(this.mediaRadius),
                  border: `${this.utils.element.applyScale(1)} solid ${this.mediaBorderColor}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: this.utils.element.applyScale(12),
                  left: this.utils.element.applyScale(12),
                  right: this.utils.element.applyScale(12),
                  display: 'flex',
                }}
              >
                <p
                  style={{
                    fontSize: this.utils.element.applyScale(13),
                    lineHeight: this.utils.element.applyScale(16),
                    padding: this.utils.element.applyScales([2, 8]),
                    margin: this.utils.element.applyScale(0),
                    background: '#000000c4',
                    color: '#ffffff',
                    borderRadius: this.utils.element.applyScale(4),
                    ...this.textOverFlowCSS({lineClamp: 1}),
                  }}
                >
                  {this.removeUnsupportChar(detailsData.data.title.content)}
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: this.utils.element.applyScale(13),
                lineHeight: this.utils.element.applyScale(16),
                margin: this.utils.element.applyScales([4, 0, 0, 0]),
                color: this.subTextColor,
              }}
            >
              From {this.removeUnsupportChar(detailsData.data.subtitle.content)}
            </p>
          </div>
        )
      }

      if (grokData) {
        const ask = grokData.data.conversation_preview[0].message
        const answer = grokData.data.conversation_preview[1].message
        const answerUrl = grokData.data.conversation_preview[1].mediaUrls[0]
        return (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                position: 'relative',
                flexDirection: 'column',
                borderRadius: this.utils.element.applyScale(this.mediaRadius),
                border: `${this.utils.element.applyScale(1)} solid ${this.mediaBorderColor}`,
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: this.utils.element.applyScale(16),
                    background: this.subBackgroundColor,
                  }}
                >
                  <p
                    style={{
                      fontSize: this.utils.element.applyScale(17),
                      margin: this.utils.element.applyScale(0),
                      color: this.textColor,
                      fontWeight: '700',
                      ...this.textOverFlowCSS({lineClamp: 2}),
                    }}
                  >
                    {this.removeUnsupportChar(ask)}
                  </p>
                  <p
                    style={{
                      fontSize: this.utils.element.applyScale(13),
                      margin: this.utils.element.applyScale(0),
                      color: this.subTextColor,
                    }}
                  >
                    {answerUrl ? 'Image by Grok' : 'Answer by Grok'}
                  </p>
                </div>
                {answerUrl && (
                  <img
                    src={answerUrl}
                    style={{
                      width: '100%',
                      borderRadius: this.utils.element.applyScales([0, 0, this.mediaRadius, this.mediaRadius]),
                    }}
                  />
                )}
                {!answerUrl && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: this.utils.element.applyScale(16),
                    }}
                  >
                    <div
                      style={{
                        fontSize: this.utils.element.applyScale(15),
                        margin: this.utils.element.applyScale(0),
                        color: this.textColor,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {this.removeUnsupportChar(answer)
                        .split('\n')
                        .map((e) => (
                          <p key={e} style={{margin: this.utils.element.applyScale(0)}}>
                            {this.removeUnsupportChar(e)}
                          </p>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      throw new Error('unifiedCardData is not found')
    }

    const size = 129
    const url = player?.url ?? thumbnail?.url

    const img = (() => {
      if (url) {
        return (
          <img
            src={url}
            style={{
              width: this.utils.element.applyScale(size),
              height: this.utils.element.applyScale(size),
              borderRadius: this.utils.element.applyScales([this.mediaRadius, 0, 0, this.mediaRadius]),
              objectFit: 'cover',
              borderRight: `${this.utils.element.applyScale(1)} solid ${this.borderColor}`,
            }}
          />
        )
      }

      return (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: this.utils.element.applyScales([this.mediaRadius, 0, 0, this.mediaRadius]),
            borderRight: `${this.utils.element.applyScale(1)} solid ${this.borderColor}`,
            background: this.subBackgroundColor,
          }}
        >
          <img
            src={this.getCardURL()}
            style={{
              width: this.utils.element.applyScale(30),
              height: this.utils.element.applyScale(30),
            }}
          />
        </div>
      )
    })()

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          borderRadius: this.utils.element.applyScale(this.mediaRadius),
          border: `${this.utils.element.applyScale(1)} solid ${this.borderColor}`,
        }}
      >
        {img}
        <div
          style={{
            padding: this.utils.element.applyScale(12),
            display: 'flex',
            flexDirection: 'column',
            gap: this.utils.element.applyScale(2),
            justifyContent: 'center',
            width: this.contentWidth() - this.utils.element.applyScaleNum(size),
          }}
        >
          <p
            style={{
              widows: '100%',
              fontSize: this.utils.element.applyScale(15),
              margin: this.utils.element.applyScale(0),
              color: this.subTextColor,
              ...this.textOverFlowCSS({lineClamp: 1}),
            }}
          >
            {vanityUrl}
          </p>
          <p
            style={{
              fontSize: this.utils.element.applyScale(15),
              margin: this.utils.element.applyScale(0),
              color: this.textColor,
              ...this.textOverFlowCSS({lineClamp: 1}),
            }}
          >
            {title && this.removeUnsupportChar(title)}
          </p>
          <p
            style={{
              fontSize: this.utils.element.applyScale(15),
              margin: this.utils.element.applyScale(0),
              color: this.subTextColor,
              ...this.textOverFlowCSS({lineClamp: 2}),
            }}
          >
            {description && this.removeUnsupportChar(description)}
          </p>
        </div>
      </div>
    )
  }

  username: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const verified = getUserVerified(data.user)
    const name = getUserName(data.user)
    const label = data.user.affiliatesHighlightedLabel?.label?.badge?.url
    return (
      <div
        style={{
          display: 'flex',
          gap: this.utils.element.applyScale(4),
        }}
      >
        <p
          style={{
            margin: this.utils.element.applyScale(0),
            fontSize: this.utils.element.applyScale(15),
            fontWeight: '700',
            color: this.textColor,
          }}
        >
          {this.removeUnsupportChar(name)}
        </p>
        {(data.user.isBlueVerified || verified || data.user.professional) && this.getBadgeWidget({data})}
        {label && (
          <img
            src={label}
            style={{
              width: this.utils.element.applyScale(15),
              height: this.utils.element.applyScale(15),
              border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
              marginTop: this.utils.element.applyScale(4),
            }}
          />
        )}
      </div>
    )
  }

  userRender: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const legacy = data.tweet.legacy!
    const extEntities = legacy.extendedEntities

    const videoBlank = (() => {
      const [, blank] = getBiggerMedia(extEntities?.media ?? [])
      if (blank && this.video) {
        const inset = this.videoInset()
        const border = this.utils.element.applyScaleNum(1)
        const resizedMedia = getResizedMediaByWidth(
          blank.videoInfo!.aspectRatio[0],
          blank.videoInfo!.aspectRatio[1],
          inset.width,
        )
        return (
          <div
            style={{
              display: 'flex',
              width: resizedMedia.width + border * 2,
              height: resizedMedia.height + border * 2,
              borderRadius: this.utils.element.applyScale(this.mediaRadius),
              border: `${border}px solid ${this.mediaBorderColor}`,
            }}
          ></div>
        )
      }
    })()

    return (
      <div
        style={{
          display: 'flex',
          gap: this.utils.element.applyScale(this.bodyGap),
          flexDirection: 'column',
        }}
      >
        <this.header data={data} />
        <this.tweetRender data={data} quoted={false} />
        {data.quoted && <this.quotedRender data={data.quoted} />}
        {videoBlank}
      </div>
    )
  }

  header: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const reg = [/_[a-z]+\.([a-z]+)$/, '.$1'] as const
    const icon = getUserAvatarUrl(data.user)?.replace(...reg)
    const id = getUserScreenName(data.user)
    return (
      <div
        style={{
          display: 'flex',
          gap: this.utils.element.applyScale(2),
          alignItems: 'center',
        }}
      >
        <this.icon alt="icon" size={40} src={icon} type={data.user.profileImageShape} />
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {this.username({data})}
          <p
            style={{
              fontSize: this.utils.element.applyScale(15),
              margin: this.utils.element.applyScale(0),
              color: this.subTextColor,
            }}
          >
            @{id}
          </p>
        </div>
      </div>
    )
  }

  // The quoted tweet as x.com shows it: 12px padding, one header line (avatar 24, name, handle, date), media flush with the box
  quotedRender: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const icon = getUserAvatarUrl(data.user)
    const id = getUserScreenName(data.user)
    const card = data.tweet.card?.legacy
    const flush = (data.tweet.legacy?.extendedEntities?.media ?? []).length > 0 || card !== undefined
    const sub = {
      margin: this.utils.element.applyScale(0),
      fontSize: this.utils.element.applyScale(15),
      lineHeight: this.utils.element.applyScale(20),
      color: this.subTextColor,
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `${this.utils.element.applyScale(1)} solid ${this.borderColor}`,
          borderRadius: this.utils.element.applyScale(16),
          paddingTop: this.utils.element.applyScale(12),
          paddingLeft: this.utils.element.applyScale(12),
          paddingRight: this.utils.element.applyScale(12),
          paddingBottom: this.utils.element.applyScale(flush ? 0 : 12),
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: this.utils.element.applyScale(4)}}>
          <this.icon alt="icon" margin={0} size={24} src={icon} type={data.user.profileImageShape} />
          {this.username({data})}
          <p style={sub}>@{id}</p>
          <p style={sub}>·</p>
          <p style={sub}>{this.shortDate(data.tweet.legacy!.createdAt)}</p>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', marginTop: this.utils.element.applyScale(4)}}>
          <this.tweetRender data={data} quoted={true} />
        </div>
        {card && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: this.utils.element.applyScale(4),
              marginLeft: -this.utils.element.applyScaleNum(12),
              marginRight: -this.utils.element.applyScaleNum(12),
            }}
          >
            <this.ogp data={data} quoted={true} />
          </div>
        )}
      </div>
    )
  }

  // Photos as x.com lays them out: one photo at full width; several side by side at one height, fitted to the width
  // when that keeps them 240px tall, otherwise a carousel 0.68 of the width tall with each photo at most 0.8 wide (cropped).
  // Inside a quoted tweet the media runs flush with the box.
  mediaGroup: RenderWidgetType<{
    media: {height: number; idStr: string; mediaUrlHttps: string; width: number}[]
    quoted: boolean
    spaced: boolean
  }> = ({media, quoted, spaced}) => {
    const s = this.utils.element.applyScaleNum
    const border = quoted ? 0 : s(1)
    const width = quoted ? this.contentWidth() - s(1) * 2 : this.contentWidth()
    const src = (m: {mediaUrlHttps: string}) => this.toOriginal(new URL(m.mediaUrlHttps)).toString()
    const spacing = {
      ...(spaced ? {marginTop: this.utils.element.applyScale(quoted ? 4 : 12)} : {}),
      ...(quoted ? {marginLeft: -s(12), marginRight: -s(12)} : {}),
    }

    if (media.length === 1) {
      const [m] = media
      return (
        <img
          alt="img"
          src={src(m)}
          style={{
            width: width,
            height: Math.round(((width - border * 2) * m.height) / m.width) + border * 2,
            borderRadius: quoted ? 0 : this.utils.element.applyScale(this.mediaRadius),
            border: `${border}px solid ${this.mediaBorderColor}`,
            ...spacing,
          }}
        />
      )
    }

    const gap = s(4)
    const frame = s(1)
    const aspects = media.map(({width, height}) => width / height)
    const fit = (width - gap * (media.length - 1) - frame * 2 * media.length) / aspects.reduce((a, b) => a + b, 0)
    const inner = Math.round(fit >= s(240) ? fit : Math.round(width * 0.68) - frame * 2)
    const maxInner = Math.round(width * 0.8) - frame * 2

    // Frames past the right edge are cut like the real carousel: each frame clips its own photo
    let x = 0
    const frames = media.flatMap((m, i) => {
      const full = Math.min(Math.round(aspects[i] * inner), maxInner) + frame * 2
      const visible = Math.min(full, width - x)
      x += full + gap
      return visible > 0 ? [{m, full, visible}] : []
    })

    return (
      <div style={{display: 'flex', gap, width, ...spacing}}>
        {frames.map(({m, full, visible}) => (
          <div
            key={m.idStr}
            style={{
              display: 'flex',
              width: visible,
              height: inner + frame * 2,
              overflow: 'hidden',
              flexShrink: 0,
              borderRadius: this.utils.element.applyScale(8),
              border: `${frame}px solid ${this.frameBorderColor}`,
            }}
          >
            <img
              alt="img"
              src={src(m)}
              style={{width: full - frame * 2, height: inner, objectFit: 'cover', flexShrink: 0}}
            />
          </div>
        ))}
      </div>
    )
  }

  tweetRender: RenderWidgetType<{data: TweetApiUtilsData; quoted: boolean}> = ({data, quoted}) => {
    const note = data.tweet.noteTweet?.noteTweetResults.result
    const legacy = data.tweet.legacy!
    const text = note?.text ?? legacy.fullText
    const noteEntity = note?.entitySet
    const legacySet = data.tweet.legacy!.entities
    const extEntities = legacy.extendedEntities
    const inlineMedia = note?.media?.inlineMedia ?? []
    const richtextTags = note?.richtext?.richtextTags ?? []
    const video = this.video && !quoted

    const normalizeMap: {
      array: number
      str: number
    }[] = [{array: 0, str: 0}]

    const trueSplit = split(text).map((char, index) => ({char, index}))

    for (const {char} of trueSplit) {
      const last = normalizeMap.at(-1)!
      normalizeMap.push({
        array: [...char].length + last.array,
        str: char.length + last.str,
      })
    }

    const normalizeRichtextTags = richtextTags.map(({fromIndex, toIndex, richtextTypes}) => ({
      start: normalizeMap.findIndex(({str}) => str === fromIndex),
      end: normalizeMap.findIndex(({str}) => str === toIndex),
      type: richtextTypes,
    }))

    const normalizeInlineMedia = inlineMedia.map(({index, mediaId}) => ({
      index: normalizeMap.findIndex(({str}) => str === index),
      mediaId,
    }))

    const normalizeHashtags = [...(noteEntity?.hashtags ?? []), ...(legacySet?.hashtags ?? [])].map(({indices}) => ({
      start: normalizeMap.findIndex(({array}) => array === indices[0]),
      end: normalizeMap.findIndex(({array}) => array === indices[1]),
    }))

    const normalizeMedia = [...(extEntities?.media ?? [])].map(
      ({indices, idStr, mediaUrlHttps, type, originalInfo}) => ({
        start: normalizeMap.findIndex(({array}) => array === indices[0]),
        end: normalizeMap.findIndex(({array}) => array === indices[1]),
        remove: video && type !== 'photo',
        idStr,
        mediaUrlHttps,
        width: originalInfo.width,
        height: originalInfo.height,
      }),
    )

    const normalizeUrls = [...(noteEntity?.urls ?? []), ...(legacySet?.urls ?? [])].map(({indices, displayUrl}) => ({
      start: normalizeMap.findIndex(({array}) => array === indices[0]),
      end: normalizeMap.findIndex(({array}) => array === indices[1]),
      displayUrl,
    }))

    const normalizeUserMentions = [...(noteEntity?.userMentions ?? []), ...(legacySet?.userMentions ?? [])].map(
      ({indices, screenName}) => ({
        start: normalizeMap.findIndex(({array}) => array === indices[0]),
        end: normalizeMap.findIndex(({array}) => array === indices[1]),
        screenName,
      }),
    )

    const charIndices: {
      chars: string[]
      end: number
      start: number
    }[] = []

    const insert: {
      fn: () => ReactElement
      index: number
    }[] = []

    // Media that share a position in the text are laid out together (a row / carousel, as x.com does)
    const groups = new Map<number, typeof normalizeMedia>()
    for (const m of normalizeMedia) {
      const inline = normalizeInlineMedia.find(({mediaId}) => mediaId === m.idStr)

      if (m.remove) {
        charIndices.push({start: m.start, end: m.end, chars: []})
        continue
      }

      if (!inline && !note) charIndices.push({start: m.start, end: m.end, chars: []})
      const index = inline ? inline.index : note ? trueSplit.length : m.start
      groups.set(index, [...(groups.get(index) ?? []), m])
    }

    for (const [index, media] of groups) {
      insert.push({index, fn: () => <this.mediaGroup key={index} media={media} quoted={quoted} spaced={index > 0} />})
    }

    for (const {start, end, displayUrl} of normalizeUrls) {
      charIndices.push({
        start,
        end,
        chars: split(displayUrl),
      })
    }

    const htmlEscape = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
    }

    for (const {index} of trueSplit) {
      const escaped = Object.entries(htmlEscape).find(([key]) => {
        return [...key].every((c, i) => c === trueSplit[index + i].char)
      })
      if (escaped) {
        charIndices.push({
          start: index,
          end: index + escaped[0].length,
          chars: [...escaped[1]],
        })
      }
    }

    const replacedSplit: typeof trueSplit = []
    for (const {char, index} of trueSplit) {
      const ignore = charIndices.some(({start, end}) => start <= index && index < end)
      if (ignore) {
        const start = charIndices.find(({start}) => start === index)
        for (const c of start?.chars ?? []) replacedSplit.push({char: c, index})
      } else {
        replacedSplit.push({char, index})
      }
    }

    const charDataList = replacedSplit.map(({char, index}) => {
      const link = [...normalizeHashtags, ...normalizeUrls, ...normalizeUserMentions].some(
        ({start, end}) => start <= index && index < end,
      )
      const bold = normalizeRichtextTags.some(
        ({start, end, type}) => start <= index && index < end && type.includes(RichtextTypesEnum.Bold),
      )
      const italic = normalizeRichtextTags.some(
        ({start, end, type}) => start <= index && index < end && type.includes(RichtextTypesEnum.Italic),
      )
      const properties: CSSProperties = {
        ...(link ? {color: '#1d9bf0'} : {}),
        ...(bold ? {fontWeight: '700'} : {}),
        ...(italic ? {fontStyle: 'italic'} : {}),
      }
      return {
        char,
        index,
        properties,
      }
    })

    const paragraphs: {chars: typeof charDataList; end: number; start: number}[] = []

    for (const [i, data] of charDataList.entries()) {
      const split = insert.some((e) => e.index === data.index)

      if (split || i === 0) {
        paragraphs.push({start: data.index, end: data.index, chars: [data]})
      } else {
        const last = paragraphs.at(-1)!
        last.end = data.index
        last.chars.push(data)
      }
    }

    // console.log("insert", insert);
    // console.log("charIndices", charIndices);
    // console.log("textDataList", textDataList);
    // console.log("data", data);

    // console.log("insert", insert);
    // textDataList.forEach((e) => {
    //     console.log("start", e.start);
    //     console.log("end", e.end);
    // });

    const textElement: ReactElement[] = []

    for (const {fn} of insert.filter(({index}) => index === 0)) textElement.push(fn())

    for (const [i, t] of paragraphs.entries()) {
      for (const {fn} of insert.filter(({index}) => t.start - 1 === index)) textElement.push(fn())
      textElement.push(
        <this.paragraph key={i} chars={t.chars} fontSize={quoted ? 15 : 17} lineHeight={quoted ? 20 : 24} />,
      )
      for (const {fn} of insert.filter(({index}) => t.end + 1 === index)) textElement.push(fn())
    }

    if (textElement.length === 0) {
      for (const {fn} of insert) textElement.push(fn())
    }
    // } else {
    //     const last = textDataList[textDataList.length - 1];
    //     insert.filter(({ index }) => index > last.end).forEach(({ fn }) => textElement.push(fn()));
    // }

    const mediaSource = [...(extEntities?.media ?? [])]
      .map((e) => e.additionalMediaInfo?.sourceUser?.userResults.result)
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .map((user) => userOrNullConverter(user))
      .filter((e): e is NonNullable<typeof e> => e !== undefined)

    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: this.utils.element.applyScale(4),
        }}
      >
        {textElement}
        {mediaSource.length === 0 ? null : (
          <p
            style={{
              display: 'flex',
              width: '100%',
              margin: this.utils.element.applyScale(0),
              gap: this.utils.element.applyScale(2),
            }}
          >
            <span
              style={{
                color: this.subTextColor,
                fontSize: this.utils.element.applyScale(15),
              }}
            >
              From
            </span>
            <span
              style={{
                color: this.textColor,
                fontSize: this.utils.element.applyScale(15),
                fontWeight: '700',
              }}
            >
              {mediaSource.map((user) => getUserName(user)).join(', ')}
            </span>
          </p>
        )}
      </div>
    )
  }
}
