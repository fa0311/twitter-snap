import split from 'graphemesplit'
import * as React from 'react'
import {TweetApiUtilsData} from 'twitter-openapi-typescript'
import {Tweet} from 'twitter-openapi-typescript-generated'

import {SnapRenderUtils} from '../../../../utils/render.js'
import {RenderWidgetType} from '../utils/utils.js'

export class RenderMakeItAQuoteImage {
  constructor(public utils: SnapRenderUtils) {}

  tweetReplace = (tweet: string): string => {
    return tweet
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'")
  }

  tweetNormalize = (tweet: Tweet): string => {
    if (tweet.noteTweet?.noteTweetResults.result.text) {
      return this.tweetReplace(tweet.noteTweet.noteTweetResults.result.text)
    }

    if (tweet.legacy?.fullText) {
      if ((tweet.legacy.entities.media ?? []).length > 0) {
        return this.tweetReplace(tweet.legacy.fullText.replace(/https:\/\/t\.co\/[\dA-Za-z]{10}$/, ''))
      } else {
        return this.tweetReplace(tweet.legacy.fullText)
      }
    } else {
      return ''
    }
  }

  render: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const reg = [/_[a-z]+\.([a-z]+)$/, '.$1'] as const
    const icon = data.user.legacy.profileImageUrlHttps.replace(...reg)
    const note = data.tweet.noteTweet?.noteTweetResults.result
    const legacy = data.tweet.legacy!
    const {name, screenName} = data.user.legacy
    const id = screenName
    return (
      <div
        style={{
          display: 'flex',
          width: this.utils.width,
          height: this.utils.width * 0.5,
          background: '#000000',
        }}
      >
        <img
          alt="icon"
          src={icon}
          style={{
            width: this.utils.width * 0.5,
            height: this.utils.width * 0.5,
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))',
          }}
        />
        <div style={{display: 'flex'}}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              alignItems: 'center',
              width: this.utils.width * 0.75 - 20,
              left: this.utils.width * -0.25,
            }}
          >
            {this.tweetRender({data})}
            <p style={{padding: this.utils.element.applyScale(14), margin: '0'}}></p>
            <p
              style={{
                fontSize: this.utils.element.applyScale(14),
                color: '#ffffff',
                margin: '0',
              }}
            >
              - {name}
            </p>
            <p
              style={{
                fontSize: this.utils.element.applyScale(14),
                color: '#888888',
                margin: '0',
              }}
            >
              @{id}
            </p>
          </div>
        </div>
      </div>
    )
  }

  tweetRender: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const note = data.tweet.noteTweet?.noteTweetResults.result
    const legacy = data.tweet.legacy!
    const text = this.tweetNormalize(data.tweet)
    const trueSplit = split(text).map((char, index) => ({char, index}))

    const textDataList: string[][] = []

    for (const [i, data] of trueSplit.entries()) {
      if (i === 0) {
        textDataList.push([data.char])
      } else {
        const last = textDataList.pop()!
        const add: string[][] = []

        if (/[\d./A-Za-z]/.test(data.char)) {
          last.push(data.char)
        } else if (data.char === ' ') {
          last.push(data.char)
          add.push([])
        } else {
          add.push([data.char])
        }

        textDataList.push(last)
        for (const data of add) textDataList.push(data)
      }
    }

    return (
      <p
        style={{
          display: 'flex',
          margin: '0',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {textDataList.map((data, i) => {
          const n = data.length === 1 && data[0] === '\n'
          const last = i > 0 && textDataList[i - 1]
          const lastN = last && last.length === 1 && last[0] === '\n'

          return (
            <span
              key={i}
              style={{
                display: 'flex',
                fontSize: this.utils.element.applyScale(20),
                color: '#ffffff',
                margin: '0',
                ...(n ? {width: '100%'} : {}),
                ...(lastN ? {height: '1em'} : {}),
              }}
            >
              {data.map((char, i) => (
                <span
                  key={i}
                  style={{
                    ...(char === ' ' ? {width: '0.25em'} : {}),
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
          )
        })}
      </p>
    )
  }
}
