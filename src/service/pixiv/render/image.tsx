import split from 'graphemesplit'
import * as React from 'react'

import {SnapRenderColorUtils} from '../../../utils/render.js'
import {PixivData} from '../type.js'

type ExtractGroups<T extends string> = T extends `${infer _Start}(?<${infer GroupName}>${infer _Rest})${infer Tail}`
  ? {[K in GroupName | keyof ExtractGroups<Tail>]: string}
  : {}

const htmlReplace = (text: string): string => {
  return text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;#44;', ',')
}

const match = <T extends string>(text: T, callback: (groups: ExtractGroups<T>) => React.ReactElement[]) => {
  return [text, callback] as const
}

const textWrap = (text: string, style: React.CSSProperties) => {
  const trueSplit = split(text).map((char, index) => ({char, index}))
  const splitText = trueSplit.map((item, index) => {
    return (
      <span key={index} style={style}>
        {item.char}
      </span>
    )
  })
  return splitText
}

const htmlParse = (text: string): React.ReactElement[] => {
  const replace = [
    match('<a href="(?<url>.*?)" target="_blank">(?<text>.*?)</a>', ({text}) => {
      return textWrap(text, {color: '#3d7699'})
    }),
    match('<strong>(?<text>.*?)</strong>', ({text}) => {
      return textWrap(text, {fontWeight: 'bold'})
    }),
  ]

  const parsedText = text.split('<br />').map((item, index) => {
    if (item === '') {
      return <div key={index} style={{height: '1em'}}></div>
    } else {
      const data = replace.reduce((acc, e) => acc.flatMap((item) => item.split(e[0])), [item])
      const child = data.map((item) => {
        if (replace.some((e) => new RegExp(e[0]).test(item))) {
          const match = replace.find((e) => new RegExp(e[0]).test(item))
          const groups = new RegExp(match![0]).exec(item)!.groups!
          return match![1](groups as any)
        } else {
          return textWrap(item, {color: '#474747'})
        }
      })

      return (
        <div key={index} style={{display: 'flex', flexDirection: 'row', margin: 0, flexWrap: 'wrap'}}>
          {child}
        </div>
      )
    }
  })

  return parsedText
}

export const pixivRender = async (data: PixivData, utils: SnapRenderColorUtils, video: boolean) => {
  const margin: number = 30
  const padding: number = 12
  const rawAssetsUrl = 'https://raw.githubusercontent.com/fa0311/twitter-snap-core/main/assets'

  const imageList = await Promise.all(
    data.illust.map(async (item) => {
      const image = await fetch(item.urls.original, {
        headers: {
          referer: 'https://www.pixiv.net/',
        },
      })
      const type = image.headers.get('content-type')
      const base64 = Buffer.from(await image.arrayBuffer()).toString('base64')
      return `data:${type};base64,${base64}`
    }),
  )

  const userImage = await (async () => {
    const image = await fetch(data.meta.user.image, {
      headers: {
        referer: 'https://www.pixiv.net/',
      },
    })
    const type = image.headers.get('content-type')
    const base64 = Buffer.from(await image.arrayBuffer()).toString('base64')
    return `data:${type};base64,${base64}`
  })()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: utils.element.applyScale(margin),
        background: utils.element.getGradient(),
      }}
    >
      <div
        style={{
          width: '100%',
          background: utils.element.getDark() ? '#000000' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: utils.element.applyScale(10),
          padding: utils.element.applyScale(padding),
          gap: utils.element.applyScale(4),
          boxShadow: utils.element.getBoxShadow(),
        }}
      >
        {imageList.map((item, index) => {
          return <img key={index} src={item.toString()} style={{width: '100%'}} />
        })}
        <p
          style={{
            color: '#000000',
            fontSize: utils.element.applyScale(16),
            fontWeight: 'bold',
            margin: utils.element.applyScales([4, 0]),
          }}
        >
          {data.meta.illust.title}
        </p>
        <div
          style={{
            display: 'flex',
            color: '#474747',
            fontSize: utils.element.applyScale(12),
            flexDirection: 'column',
          }}
        >
          {...htmlParse(htmlReplace(data.meta.illust.description))}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            margin: utils.element.applyScales([4, 0]),
            gap: utils.element.applyScale(4),
          }}
        >
          {data.meta.illust.xRestrict === 1 && (
            <p
              style={{
                color: '#ff0000',
                fontWeight: 'bold',
                fontSize: utils.element.applyScale(12),
                margin: 0,
              }}
            >
              {'R-18'}
            </p>
          )}

          {data.meta.illust.isOriginal && (
            <p
              style={{
                color: '#3d7699',
                fontWeight: 'bold',
                fontSize: utils.element.applyScale(12),
                margin: 0,
              }}
            >
              {'Original'}
            </p>
          )}

          {data.meta.illust.tags?.tags
            ?.filter((item) => item.tag !== 'R-18')
            ?.map((item, index) => {
              return (
                <p
                  key={index}
                  style={{
                    color: '#3d7699',
                    fontWeight: item.tag === 'R-18' ? 'bold' : 'normal',
                    fontSize: utils.element.applyScale(12),
                    margin: 0,
                  }}
                >
                  {`#${item.tag}`}
                </p>
              )
            })}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <img
            src={`${rawAssetsUrl}/pixiv/likes.png`}
            style={{
              width: utils.element.applyScale(12),
              margin: 0,
            }}
          />
          <p
            style={{
              color: '#858585',
              fontSize: utils.element.applyScale(12),
              margin: utils.element.applyScales([0, 16, 0, 4]),
            }}
          >
            {data.meta.illust.likeCount.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </p>
          <img
            src={`${rawAssetsUrl}/pixiv/bookmarks.png`}
            style={{
              width: utils.element.applyScale(12),
              margin: 0,
            }}
          />
          <p
            style={{
              color: '#858585',
              fontSize: utils.element.applyScale(12),
              margin: utils.element.applyScales([0, 16, 0, 4]),
            }}
          >
            {data.meta.illust.bookmarkCount.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </p>

          <img
            src={`${rawAssetsUrl}/pixiv/views.png`}
            style={{
              width: utils.element.applyScale(12),
              margin: 0,
            }}
          />
          <p
            style={{
              color: '#858585',
              fontSize: utils.element.applyScale(12),
              margin: utils.element.applyScales([0, 16, 0, 4]),
            }}
          >
            {data.meta.illust.viewCount.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </p>
        </div>

        <p
          style={{
            color: '#858585',
            fontSize: utils.element.applyScale(12),
            margin: utils.element.applyScales([4, 0]),
          }}
        >
          {new Date(data.meta.illust.createDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          })}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            margin: utils.element.applyScales([4, 0, 4, 4]),
          }}
        >
          <img
            alt="User Icon"
            src={userImage}
            style={{
              width: utils.element.applyScale(40),
              height: utils.element.applyScale(40),
              borderRadius: '50%',
              margin: utils.element.applyScales([0, 8, 0, 0]),
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                color: '#474747',
                fontWeight: 'bold',
                margin: utils.element.applyScale(4),
                fontSize: utils.element.applyScale(12),
              }}
            >
              {data.meta.illust.userName}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
