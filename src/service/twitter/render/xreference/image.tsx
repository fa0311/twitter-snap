import type {TweetApiUtilsData} from 'twitter-openapi-typescript'

import type {SnapRenderColorUtils} from '../../../../utils/render.js'
import {RenderTweetImage} from '../basic/image.js'
import {
  getUserAvatarUrl,
  getUserName,
  getUserScreenName,
  getUserVerified,
  getUserVerifiedType,
  type RenderWidgetType,
} from '../utils/utils.js'

// Icon paths as x.com serves them (viewBox 0 0 24 24 unless noted)
const icons = {
  verified: // viewBox 0 0 22 22
    'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z',
  grok: 'M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466', // viewBox 0 0 33 32
  caret:
    'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply:
    'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  retweet:
    'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  bookmark:
    'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share:
    'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
}

// The post page of x.com, from values measured on the real page (October 2026): a 598px article inside 1px column
// borders with 16px side padding, 17px/24px text, 16px media radius, the time line, then the action bar.
// Chirp is not redistributable, so the text uses the same fallback fonts as the other themes.
export class RenderXReferenceImage extends RenderTweetImage {
  columnBorder = 1
  sidePadding = 16

  constructor(utils: SnapRenderColorUtils, video: boolean) {
    super(utils, video)
    const dark = utils.element.getDark()
    this.backgroundColor = dark ? '#000000' : '#ffffff'
    this.textColor = dark ? '#e7e9ea' : '#0f1419'
    this.subTextColor = dark ? '#71767b' : '#536471'
    this.borderColor = dark ? '#2f3336' : '#cfd9de'
    this.mediaBorderColor = this.borderColor
    this.frameBorderColor = dark ? '#2f3336' : '#eff3f4'
    this.mediaRadius = 16
    this.bodyGap = 12
  }

  contentWidth = (): number =>
    this.utils.width - this.utils.element.applyScaleNum((this.columnBorder + this.sidePadding) * 2)

  svg: RenderWidgetType<{color: string; path: string; size: number; viewBox?: string}> = ({
    color,
    path,
    size,
    viewBox,
  }) => (
    <svg
      width={this.utils.element.applyScale(size)}
      height={this.utils.element.applyScale(size)}
      viewBox={viewBox ?? '0 0 24 24'}
      fill={color}
      style={{flexShrink: 0}}
    >
      <path d={path} />
    </svg>
  )

  render: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const s = this.utils.element.applyScale
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: this.backgroundColor,
          fontFamily: this.fontFamily,
          borderLeft: `${s(this.columnBorder)} solid ${this.frameBorderColor}`,
          borderRight: `${s(this.columnBorder)} solid ${this.frameBorderColor}`,
          paddingTop: s(12),
          paddingBottom: s(12),
          paddingLeft: s(this.sidePadding),
          paddingRight: s(this.sidePadding),
        }}
      >
        <this.userRender data={data} />
        {data.tweet.card?.legacy && (
          <div style={{display: 'flex', flexDirection: 'column', marginTop: s(12)}}>
            <this.ogp data={data} quoted={false} />
          </div>
        )}
        {data.tweet.birdwatchPivot && (
          <div style={{display: 'flex', flexDirection: 'column', marginTop: s(12)}}>
            <this.birdwatch data={data.tweet.birdwatchPivot} />
          </div>
        )}
        <div style={{display: 'flex', marginTop: s(16), marginBottom: s(16)}}>
          <this.bottonWidget data={data} />
        </div>
        <this.actionBar data={data} />
      </div>
    )
  }

  header: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const s = this.utils.element.applyScale
    const reg = [/_[a-z]+\.([a-z]+)$/, '.$1'] as const
    const icon = getUserAvatarUrl(data.user)?.replace(...reg)
    const id = getUserScreenName(data.user)
    return (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: s(8)}}>
          <this.icon alt="icon" margin={0} size={40} src={icon} type={data.user.profileImageShape} />
          <div style={{display: 'flex', flexDirection: 'column'}}>
            {this.username({data})}
            <p style={{margin: s(0), fontSize: s(15), lineHeight: s(20), color: this.subTextColor}}>@{id}</p>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: s(9)}}>
          <this.svg color={this.textColor} path={icons.grok} size={19} viewBox="0 0 33 32" />
          <this.svg color={this.subTextColor} path={icons.caret} size={19} />
        </div>
      </div>
    )
  }

  username: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const s = this.utils.element.applyScale
    const verified = data.user.isBlueVerified || getUserVerified(data.user) || data.user.professional
    const label = data.user.affiliatesHighlightedLabel?.label?.badge?.url
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
        <p style={{margin: s(0), fontSize: s(15), lineHeight: s(20), fontWeight: '700', color: this.textColor}}>
          {this.removeUnsupportChar(getUserName(data.user))}
        </p>
        {verified && <div style={{display: 'flex', marginLeft: s(2)}}>{this.badge({data})}</div>}
        {label && (
          <img
            src={label}
            style={{
              width: s(14),
              height: s(14),
              marginLeft: s(3),
              padding: s(1),
              border: `${s(1)} solid ${this.borderColor}`,
              borderRadius: s(2),
            }}
          />
        )}
      </div>
    )
  }

  // x.com's own check mark for blue; the gold / gray badges stay images
  badge: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const type = getUserVerifiedType(data.user)
    if (type === 'Business' || type === 'Government') {
      const s = this.utils.element.applyScale
      const file = type === 'Business' ? 'gold-badge.png' : 'gray-badge.png'
      return <img src={`${this.rawAssetsUrl}/twitter/${file}`} style={{width: s(19), height: s(19)}} />
    }

    return <this.svg color={this.linkColor} path={icons.verified} size={19} viewBox="0 0 22 22" />
  }

  actionBar: RenderWidgetType<{data: TweetApiUtilsData}> = ({data}) => {
    const s = this.utils.element.applyScale
    const legacy = data.tweet.legacy!
    const items: {count?: number; path: string}[] = [
      {path: icons.reply, count: legacy.replyCount},
      {path: icons.retweet, count: legacy.retweetCount + legacy.quoteCount},
      {path: icons.like, count: legacy.favoriteCount},
      {path: icons.bookmark, count: legacy.bookmarkCount},
      {path: icons.share},
    ]
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: s(48),
          paddingLeft: s(4),
          paddingRight: s(4),
          borderTop: `${s(1)} solid ${this.frameBorderColor}`,
        }}
      >
        {items.map(({path, count}) => (
          <div key={path} style={{display: 'flex', alignItems: 'center'}}>
            <this.svg color={this.subTextColor} path={path} size={23} />
            {count ? (
              <span
                style={{
                  paddingLeft: s(4),
                  paddingRight: s(4),
                  fontSize: s(13),
                  lineHeight: s(16),
                  color: this.subTextColor,
                }}
              >
                {this.toKMB(count)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    )
  }
}
