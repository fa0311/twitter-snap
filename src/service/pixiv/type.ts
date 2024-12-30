export type PixivData = {
  illust: IllustBody[]

  meta: {
    illust: IllustMeta
    user: IllustUserMeta
  }
  ugoira: UgoiraBody | undefined
}

export type IllustDataResponse = {
  illust: {
    [key: string]: IllustMeta
  }
  timestamp: string
  user: {
    [key: string]: IllustUserMeta
  }
}

export type IllustMeta = {
  alt: string
  bookStyle: number
  bookmarkCount: number
  bookmarkData: null
  comicPromotion: null
  commentCount: number
  contestBanners: unknown[]
  contestData: null
  createDate: string
  description: string
  descriptionBoothId: null
  descriptionYoutubeId: null
  fanboxPromotion: null
  height: number
  id: string
  illustComment: string
  illustId: string
  illustTitle: string
  illustType: number
  imageResponseCount: number
  imageResponseData: unknown[]
  imageResponseOutData: unknown[]
  isBookmarkable: boolean
  isHowto: boolean
  isOriginal: boolean
  likeCount: number
  likeData: boolean
  pageCount: number
  pollData: null
  responseCount: number
  restrict: number
  seriesNavData: null
  sl: number
  tags: {
    authorId: string
    isLocked: boolean
    tags: {
      deletable: boolean
      locked: boolean
      tag: string
      userId: string
      userName: string
    }[]
    writable: boolean
  }
  title: string
  uploadDate: string
  urls: {
    mini: string
    original: string
    regular: string
    small: string
    thumb: string
  }
  userAccount: string
  userId: string
  userIllusts: Record<
    string,
    {
      aiType: number
      alt: string
      bookmarkData: null
      createDate: string
      description: string
      height: number
      id: string
      illustType: number
      isBookmarkable: boolean
      isMasked: boolean
      isUnlisted: boolean
      pageCount: number
      profileImageUrl?: string
      restrict: number
      sl: number
      tags: string[]
      title: string
      titleCaptionTranslation: {
        workCaption: null | string
        workTitle: null | string
      }
      updateDate: string
      url: string
      userId: string
      userName: string
      width: number
      xRestrict: number
    } | null
  >
  userName: string
  viewCount: number
  width: number
  xRestrict: number
  zoneConfig: {
    '500x500': {
      url: string
    }
    rectangle: {
      url: string
    }
    responsive: {
      url: string
    }
  }
}

export type IllustUserMeta = {
  background: {
    color: null | string
    isPrivate: boolean
    repeat: null | string
    url: string
  }
  commission: any | null
  image: string
  imageBig: string
  isBlocking: boolean
  isFollowed: boolean
  isMypixiv: boolean
  name: string
  partial: number
  premium: boolean
  sketchLiveId: null | string
  sketchLives: any[]
  userId: string
}

export type APIResponse<T> = {
  body: T
  error: boolean
  message: string
}

export type IllustBody = {
  height: number
  urls: {
    original: string
    regular: string
    small: string
    thumb_mini: string
  }
  width: number
}

export type UgoiraBody = {
  frames: {
    delay: number
    file: string
  }[]
  mime_type: string
  originalSrc: string
  src: string
}
