import * as React from 'react'

import {SnapRenderColorUtils} from '../../../utils/render.js'
import {IllustBody, IllustData, IllustUser} from './../type.js'

type ExtractGroups<T extends string> = T extends `${infer _Start}(?<${infer GroupName}>${infer _Rest})${infer Tail}`
  ? {[K in GroupName | keyof ExtractGroups<Tail>]: string}
  : {}

const htmlReplace = (text: string): string => {
  return text.replaceAll('&lt;', '<').replaceAll('&gt;', '>')
}

const match = <T extends string>(text: T, callback: (groups: ExtractGroups<T>) => React.ReactElement) => {
  return [text, callback] as const
}

const htmlParse = (text: string): React.ReactElement => {
  const replace = [
    match('<a href="(?<url>.*?)" target="_blank">(?<text>.*?)</a>', ({url, text}) => {
      return (
        <span
          style={{
            color: '#3d7699',
            textDecoration: 'underline',
          }}
        >
          {text}
        </span>
      )
    }),
  ]

  const pattern = `(${replace.map((e) => e[0]).join('|')})`
  const regex = new RegExp(pattern, 'g')
  let skip = 0

  const parsedText = text.split('<br />').map((item, index) => {
    const child = item
      .split(regex)
      .map((item, index) => {
        if (skip > 0) {
          skip--
          return null
        } else if (replace.some((e) => new RegExp(e[0]).test(item))) {
          const match = replace.find((e) => new RegExp(e[0]).test(item))
          const groups = new RegExp(match![0]).exec(item)!.groups!
          skip = item.match(new RegExp(match![0]))!.length - 1
          return match![1](groups as any)
        } else {
          return (
            <span key={index} style={{color: '#000000'}}>
              {item}
            </span>
          )
        }
      })
      .filter((e) => e !== null)

    return (
      <p key={index} style={{margin: 0}}>
        {child}
      </p>
    )
  })

  return <>{parsedText}</>
}

export const pixivRender = async (
  [data, user, body]: [IllustData, IllustUser, IllustBody],
  utils: SnapRenderColorUtils,
  video: boolean,
) => {
  const margin: number = 30
  const padding: number = 12

  // https://www.pixiv.net/ajax/illust/125647849/ugoira_meta?lang=ja&version=a64d52acd3aace2086ab632abec7a061c10825fe

  const imageList = await Promise.all(
    body.map(async (item) => {
      const image = await fetch(item.urls.original, {
        headers: {
          referer: 'https://www.pixiv.net/',
        },
      })
      return `data:image/png;base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`
    }),
  )

  const userImage = await (async () => {
    const image = await fetch(user.image, {
      headers: {
        referer: 'https://www.pixiv.net/',
      },
    })
    return `data:image/png;base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`
  })()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: utils.element.applyScale(10),
        background: utils.element.getGradient(),
      }}
    >
      <div
        style={{
          width: '100%',
          background: utils.element.getDark() ? '#000000' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: utils.element.applyScale(margin),
          padding: utils.element.applyScale(padding),
          gap: utils.element.applyScale(12),
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
            margin: 0,
          }}
        >
          {data.title}
        </p>
        <div
          style={{
            display: 'flex',
            color: '#000000',
            fontSize: utils.element.applyScale(12),
          }}
        >
          {htmlParse(htmlReplace(data.description))}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
          {data.xRestrict === 1 && (
            <p
              style={{
                color: '#ff0000',
                fontWeight: 'bold',
                fontSize: utils.element.applyScale(12),
                padding: utils.element.applyScales([0, 4]),
                margin: 0,
              }}
            >
              {'R-18'}
            </p>
          )}

          {data.isOriginal && (
            <p
              style={{
                color: '#3d7699',
                fontWeight: 'bold',
                fontSize: utils.element.applyScale(12),
                padding: utils.element.applyScales([0, 4]),
                margin: 0,
              }}
            >
              {'Original'}
            </p>
          )}

          {data.tags?.tags
            ?.filter((item) => item.tag !== 'R-18')
            ?.map((item, index) => {
              return (
                <p
                  key={index}
                  style={{
                    color: '#3d7699',
                    fontWeight: item.tag === 'R-18' ? 'bold' : 'normal',
                    fontSize: utils.element.applyScale(12),
                    padding: utils.element.applyScales([0, 4]),
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
            gap: utils.element.applyScale(4),
            alignItems: 'center',
          }}
        >
          <p
            style={{
              color: '#858585',
              fontSize: utils.element.applyScale(12),
              margin: 0,
            }}
          >
            {`Views: ${data.viewCount}`}
          </p>
          <p
            style={{
              color: '#858585',
              fontSize: utils.element.applyScale(12),
              margin: 0,
            }}
          >
            {`Likes: ${data.likeCount}`}
          </p>
          <p
            style={{
              color: '#858585',
              fontSize: utils.element.applyScale(12),
              margin: 0,
            }}
          >
            {`Bookmarks: ${data.bookmarkCount}`}
          </p>
        </div>

        {/*
          {new Date(data.createDate).toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })} */}
        <p
          style={{
            color: '#858585',
            fontSize: utils.element.applyScale(12),
            margin: 0,
          }}
        >
          {new Date(data.createDate).toLocaleString('en-US', {
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
            gap: utils.element.applyScale(4),
          }}
        >
          <img
            alt="User Icon"
            src={userImage}
            style={{
              width: utils.element.applyScale(40),
              height: utils.element.applyScale(40),
              borderRadius: '50%',
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
                color: '#000000',
                fontWeight: 'bold',
                margin: utils.element.applyScale(4),
                fontSize: utils.element.applyScale(12),
              }}
            >
              {data.userName}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
