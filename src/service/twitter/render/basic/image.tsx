import split from 'graphemesplit'
import * as React from 'react'
import {TweetApiUtilsData} from 'twitter-openapi-typescript'
import {
  NoteTweetResultRichTextTagRichtextTypesEnum as RichtextTypesEnum,
  TypeName,
  User,
  type UserProfileImageShapeEnum,
  UserUnion,
} from 'twitter-openapi-typescript-generated'

import {SnapRenderColorUtils} from '../../../../utils/render.js'
import {RenderCssType, RenderWidgetType, getBiggerMedia, getResizedMediaByWidth} from '../utils/utils.js'

export class RenderTweetImage {
  backgroundColor: string
  subBackgroundColor: string
  textColor: string
  subTextColor: string
  borderColor: string
  imageBorderColor: string
  cardSuffix: string
  fontFamily: string
  rawAssetsUrl: string
  margin: number = 30
  padding: number = 12

  constructor(public utils: SnapRenderColorUtils, public video: boolean) {
    this.backgroundColor = this.utils.element.getDark() ? '#000000' : '#ffffff'
    this.subBackgroundColor = this.utils.element.getDark() ? '#16181c' : '#f7f9f9'
    this.textColor = this.utils.element.getDark() ? '#ffffff' : '#000000'
    this.subTextColor = this.utils.element.getDark() ? '#71767b' : '#536471'
    this.borderColor = this.utils.element.getDark() ? '#2f3336' : '#cfd9de'
    this.imageBorderColor = this.utils.element.getDark() ? '#000000' : '#e6e6e6'
    this.cardSuffix = this.utils.element.getDark() ? '-dark' : ''
    this.fontFamily = 'Segoe UI,Meiryo,system-ui,sans-serif'
    this.rawAssetsUrl = 'https://raw.githubusercontent.com/fa0311/twitter-snap-core/main/assets'
  }

  getBadgeWidget: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const src = (() => {
      if (data.user.legacy.verifiedType === 'Business') {
        return `${this.rawAssetsUrl}/twitter/gold-badge.png`
      }

      if (data.user.legacy.verifiedType === 'Government') {
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

  removeUnsupportChar = (text: string): string => {
    return [...text]
      .map((c) => {
        const code = c.codePointAt(0)!
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

  getIconShapeWidget: (props: {type: UserProfileImageShapeEnum}) => React.CSSProperties = ({type}) => {
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

  userOrNullConverter = (userResults: UserUnion): User | undefined => {
    if (userResults.typename === TypeName.User) {
      return userResults as User
    }
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

  toKMB = (num: number): string => {
    if (num < 1000) {
      return num.toString()
    }

    if (num < 1000000) {
      return (num / 1000).toFixed(1) + 'K'
    }

    return (num / 1000000).toFixed(1) + 'M'
  }

  toOriginal = (url: URL): URL => {
    const params = {
      format: 'jpg',
      name: '4096x4096', // orig
    }
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

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
          {data.tweet.card && <this.ogp data={data} />}

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
    const font = this.utils.element.applyScale(15)

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: this.utils.element.applyScale(2),
        }}
      >
        <p
          style={{
            display: 'flex',
            margin: this.utils.element.applyScale(0),
            gap: this.utils.element.applyScale(2),
          }}
        >
          <span style={{color: this.subTextColor, fontSize: font}}>{timeString}</span>
          <span style={{color: this.subTextColor, fontSize: font}}>·</span>
          <span style={{color: this.subTextColor, fontSize: font}}>{dateString}</span>
        </p>
        {view && (
          <p
            style={{
              display: 'flex',
              margin: this.utils.element.applyScale(0),
              gap: this.utils.element.applyScale(2),
            }}
          >
            <span style={{color: this.subTextColor, fontSize: font}}>·</span>
          </p>
        )}
        {view && (
          <p
            style={{
              display: 'flex',
              margin: this.utils.element.applyScale(0),
              gap: this.utils.element.applyScale(4),
            }}
          >
            <span
              style={{
                color: this.textColor,
                fontSize: font,
                fontWeight: '700',
              }}
            >
              {this.toKMB(Number(view))}
            </span>
            <span style={{color: this.subTextColor, fontSize: font}}>Views</span>
          </p>
        )}
      </div>
    )
  }

  ogp: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const legacy = data.tweet.card?.legacy
    const thumbnail = legacy?.bindingValues.find((v) => v.key === 'thumbnail_image_original')?.value.imageValue
    const summary = legacy?.bindingValues.find((v) => v.key === 'summary_photo_image_original')?.value.imageValue
    const player = legacy?.bindingValues.find((v) => v.key === 'player_image_large')?.value.imageValue
    const title = legacy?.bindingValues.find((v) => v.key === 'title')?.value.stringValue
    const domain = legacy?.bindingValues.find((v) => v.key === 'domain')?.value.stringValue
    const vanityUrl = legacy?.bindingValues.find((v) => v.key === 'vanity_url')?.value.stringValue
    const description = legacy?.bindingValues.find((v) => v.key === 'description')?.value.stringValue
    const unifiedCard = legacy?.bindingValues.find((v) => v.key === 'unified_card')?.value.stringValue
    const cardUrl = legacy?.bindingValues.find((v) => v.key === 'card_url')?.value.stringValue

    // data.tweet.card?.legacy?.bindingValues.forEach((v) => {
    //     console.log(v.key, v.value);
    // });

    if (summary) {
      return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{width: '100%', display: 'flex', position: 'relative'}}>
            <img
              src={summary.url}
              style={{
                width: '100%',
                borderRadius: this.utils.element.applyScale(10),
                border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
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
                  padding: this.utils.element.applyScales([0, 4]),
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
          <p
            style={{
              fontSize: this.utils.element.applyScale(13),
              margin: this.utils.element.applyScale(0),
              color: this.subTextColor,
            }}
          >
            From {vanityUrl}
          </p>
        </div>
      )
    }

    if (unifiedCard) {
      const unifiedCardData = JSON.parse(unifiedCard!)
      const detailsData: any = Object.values(unifiedCardData.component_objects).find((e: any) => e.type === 'details')
      const grokData: any = Object.values(unifiedCardData.component_objects).find((e: any) => e.type === 'grok_share')

      if (detailsData) {
        const imgData: any = Object.values(unifiedCardData.media_entities)[0] // MediaExtended

        return (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <div style={{width: '100%', display: 'flex', position: 'relative'}}>
              <img
                src={imgData.media_url_https}
                style={{
                  width: '100%',
                  borderRadius: this.utils.element.applyScale(10),
                  border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
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
                    padding: this.utils.element.applyScales([0, 4]),
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
                margin: this.utils.element.applyScale(0),
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
                borderRadius: this.utils.element.applyScale(10),
                border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
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
                      borderRadius: this.utils.element.applyScales([0, 0, 10, 10]),
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
              borderRadius: this.utils.element.applyScales([10, 0, 0, 10]),
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
            borderRadius: this.utils.element.applyScales([10, 0, 0, 10]),
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
          borderRadius: this.utils.element.applyScale(10),
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
            width: this.utils.element.applyScale(this.utils.width - (this.margin + this.padding) * 2 - size),
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
    const {name, verified} = data.user.legacy
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
    const reg = [/_[a-z]+\.([a-z]+)$/, '.$1'] as const
    const icon = data.user.legacy.profileImageUrlHttps.replace(...reg)
    const id = data.user.legacy.screenName
    const legacy = data.tweet.legacy!
    const extEntities = legacy.extendedEntities

    const videoBlank = (() => {
      const [i, blank] = getBiggerMedia(extEntities?.media ?? [])
      if (blank && this.video) {
        const resizedMedia = getResizedMediaByWidth(
          blank.videoInfo!.aspectRatio[0],
          blank.videoInfo!.aspectRatio[1],
          this.utils.width - this.utils.element.applyScaleNum((this.margin + this.padding) * 2),
        )
        return (
          <div
            style={{
              display: 'flex',
              width: resizedMedia.width,
              height: resizedMedia.height,
            }}
          ></div>
        )
      }
    })()

    return (
      <div
        style={{
          display: 'flex',
          gap: this.utils.element.applyScale(10),
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: this.utils.element.applyScale(2),
            alignItems: 'center',
          }}
        >
          <img
            alt="icon"
            src={icon}
            style={{
              width: this.utils.element.applyScale(40),
              height: this.utils.element.applyScale(40),
              margin: this.utils.element.applyScale(4),
              ...this.getIconShapeWidget({type: data.user.profileImageShape}),
            }}
          />
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
        <this.tweetRender data={data} quoted={false} />
        {data.quoted && (
          <div
            style={{
              border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
              borderRadius: this.utils.element.applyScale(16),
              padding: this.utils.element.applyScale(10),
              display: 'flex',
            }}
          >
            <this.quotedRender data={data.quoted} />
          </div>
        )}
        {videoBlank}
      </div>
    )
  }

  quotedRender: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const icon = data.user.legacy.profileImageUrlHttps
    const {name, screenName} = data.user.legacy
    const id = screenName
    return (
      <div
        style={{
          display: 'flex',
          gap: this.utils.element.applyScale(2),
          flexDirection: 'column',
        }}
      >
        <div style={{display: 'flex', gap: this.utils.element.applyScale(2)}}>
          <img
            alt="icon"
            src={icon}
            style={{
              width: this.utils.element.applyScale(24),
              height: this.utils.element.applyScale(24),
              margin: this.utils.element.applyScale(4),
              ...this.getIconShapeWidget({type: data.user.profileImageShape}),
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: this.utils.element.applyScale(6),
            }}
          >
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <this.tweetRender data={data} quoted={true} />
        </div>
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

    const normalizeHashtags = [...(noteEntity?.hashtags ?? []), ...(legacySet?.hashtags ?? [])].map(
      ({indices, tag}) => ({
        start: normalizeMap.findIndex(({array}) => array === indices[0]),
        end: normalizeMap.findIndex(({array}) => array === indices[1]),
        tag,
      }),
    )

    const normalizeMedia = [...(extEntities?.media ?? [])].map(({indices, idStr, mediaUrlHttps, type}) => ({
      start: normalizeMap.findIndex(({array}) => array === indices[0]),
      end: normalizeMap.findIndex(({array}) => array === indices[1]),
      remove: video && type !== 'photo',
      idStr,
      mediaUrlHttps,
    }))

    const normalizeNoteMedia = [...(noteEntity?.media ?? [])].map(({indices, idStr, mediaUrlHttps, type}) => ({
      start: normalizeMap.findIndex(({array}) => array === indices[0]),
      end: normalizeMap.findIndex(({array}) => array === indices[1]),
      remove: video && type !== 'photo',
      idStr,
      mediaUrlHttps,
    }))

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
      fn: () => React.ReactElement
      index: number
    }[] = []

    for (const m of normalizeMedia) {
      const inline = normalizeInlineMedia.find(({mediaId}) => mediaId === m.idStr)

      if (m.remove) {
        charIndices.push({
          start: m.start,
          end: m.end,
          chars: [],
        })
      } else if (inline) {
        insert.push({
          index: inline.index,
          fn: () => (
            <img
              alt="img"
              key={m.idStr}
              src={this.toOriginal(new URL(m.mediaUrlHttps)).toString()}
              style={{
                width: '100%',
                borderRadius: this.utils.element.applyScale(10),
                border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
              }}
            />
          ),
        })
      } else if (note) {
        insert.push({
          index: trueSplit.length,
          fn: () => (
            <img
              alt="img"
              key={m.idStr}
              src={this.toOriginal(new URL(m.mediaUrlHttps)).toString()}
              style={{
                width: '100%',
                borderRadius: this.utils.element.applyScale(10),
                border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
              }}
            />
          ),
        })
      } else {
        charIndices.push({
          start: m.start,
          end: m.end,
          chars: [],
        })
        insert.push({
          index: m.start,
          fn: () => (
            <img
              alt="img"
              key={m.idStr}
              src={this.toOriginal(new URL(m.mediaUrlHttps)).toString()}
              style={{
                width: '100%',
                borderRadius: this.utils.element.applyScale(10),
                border: `${this.utils.element.applyScale(1)} solid ${this.imageBorderColor}`,
                marginTop: this.utils.element.applyScale(8),
              }}
            />
          ),
        })
      }
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

    for (const {char, index} of trueSplit) {
      const escape = Object.entries(htmlEscape).find(([key, _]) => {
        return [...key].every((c, i) => c === trueSplit[index + i].char)
      })
      if (escape) {
        charIndices.push({
          start: index,
          end: index + escape[0].length,
          chars: [...escape[1]],
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
      const properties: React.CSSProperties = {
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

    const textDataList: {
      data: {char: string; properties: React.CSSProperties}[][]
      end: number
      start: number
    }[] = []

    for (const [i, data] of charDataList.entries()) {
      const {index, char} = data
      const split = insert.some((i) => i.index === index)

      if (split || i === 0) {
        textDataList.push({
          start: index,
          end: index + 1,
          data: [[data]],
        })
      } else {
        const last = textDataList.pop()!
        const lastDataLast = last.data.pop()!
        const add: (typeof lastDataLast)[] = []
        const lastData: typeof lastDataLast = []
        const lastChar = lastDataLast.at(-1)

        const matchReg = /[\d./A-Za-z]/

        if (matchReg.test(char)) {
          lastData.push(data)
        } else if (char === ' ') {
          lastData.push(data)
          add.push([])
        } else if (lastChar?.char.match(matchReg)) {
          add.push([data])
        } else {
          lastData.push(data)
          add.push([])
        }

        textDataList.push({
          start: last.start,
          end: index,
          data: [...last.data, [...lastDataLast, ...lastData], ...add],
        })
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

    const textElement: React.ReactElement[] = []

    for (const {fn} of insert.filter(({index}) => index === 0)) textElement.push(fn())

    for (const [i, t] of textDataList.entries()) {
      for (const {fn} of insert.filter(({index}) => t.start - 1 === index)) textElement.push(fn())

      textElement.push(
        <p
          key={i}
          style={{
            fontSize: quoted ? this.utils.element.applyScale(14) : this.utils.element.applyScale(17),
            margin: this.utils.element.applyScale(0),
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {t.data.map((y, i) => {
            const n = y.length === 1 && y[0].char === '\n'
            const last = i > 0 && t.data[i - 1]
            const lastN = last && last.length === 1 && last[0].char === '\n'

            return (
              <span
                key={i}
                style={{
                  display: 'flex',
                  ...(n ? {width: '100%'} : {}),
                  ...(lastN ? {height: '1em'} : {}),
                }}
              >
                {y.map(({char, properties}, i) => (
                  <span
                    key={i}
                    style={{
                      color: this.textColor,
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
        </p>,
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
      .map((user) => this.userOrNullConverter(user))
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
              {mediaSource.map((user) => user.legacy.name).join(', ')}
            </span>
          </p>
        )}
      </div>
    )
  }
}
