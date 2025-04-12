export type PixivData = {
  illust: IllustBody[]
  meta: {
    illust: PixivBody
    user: UserProfile
  }
  ugoira: UgoiraBody | undefined
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

// ==================================================================

export type PixivBody = {
  illustId: string
  illustTitle: string
  illustComment: string
  id: string
  title: string
  description: string
  illustType: number
  createDate: string
  uploadDate: string
  restrict: number
  xRestrict: number
  sl: number
  urls: PixivUrls
  tags: PixivTags
  alt: string
  userId: string
  userName: string
  userAccount: string
  userIllusts: Record<string, PixivUserIllust | null>
  likeData: boolean
  width: number
  height: number
  pageCount: number
  bookmarkCount: number
  likeCount: number
  commentCount: number
  responseCount: number
  viewCount: number
  bookStyle: string
  isHowto: boolean
  isOriginal: boolean
  imageResponseOutData: any[]
  imageResponseData: any[]
  imageResponseCount: number
  pollData: null
  seriesNavData: null
  descriptionBoothId: null
  descriptionYoutubeId: null
  comicPromotion: null
  fanboxPromotion: null
  contestBanners: any[]
  isBookmarkable: boolean
  bookmarkData: null
  contestData: null
  zoneConfig: PixivZoneConfig
  extraData: PixivExtraData
  titleCaptionTranslation: PixivTitleCaptionTranslation
  isUnlisted: boolean
  request: null
  commentOff: number
  aiType: number
  reuploadDate: null
  locationMask: boolean
  commissionLinkHidden: boolean
  isLoginOnly: boolean
}

export type PixivUrls = {
  mini: string
  thumb: string
  small: string
  regular: string
  original: string
}

export type PixivTags = {
  authorId: string
  isLocked: boolean
  tags: PixivTag[]
  writable: boolean
}

export type PixivTag = {
  tag: string
  locked: boolean
  deletable: boolean
  userId?: string
  userName?: string
}

export type PixivUserIllust = {
  id: string
  title: string
  illustType: number
  xRestrict: number
  restrict: number
  sl: number
  url: string
  description: string
  tags: string[]
  userId: string
  userName: string
  width: number
  height: number
  pageCount: number
  isBookmarkable: boolean
  bookmarkData: null
  alt: string
  titleCaptionTranslation: PixivTitleCaptionTranslation
  createDate: string
  updateDate: string
  isUnlisted: boolean
  isMasked: boolean
  aiType: number
  profileImageUrl: string
}

export type PixivZoneConfig = {
  responsive: PixivAdZone
  rectangle: PixivAdZone
  '500x500': PixivAdZone
  header: PixivAdZone
  footer: PixivAdZone
  expandedFooter: PixivAdZone
  logo: PixivAdZone
  ad_logo: PixivAdZone
  relatedworks: PixivAdZone
}

export type PixivAdZone = {
  url: string
}

export type PixivExtraData = {
  meta: PixivMeta
}

export type PixivMeta = {
  title: string
  description: string
  canonical: string
  alternateLanguages: Record<string, string>
  descriptionHeader: string
  ogp: PixivOGP
  twitter: PixivTwitter
}

export type PixivOGP = {
  description: string
  image: string
  title: string
  type: string
}

export type PixivTwitter = {
  description: string
  image: string
  title: string
  card: string
}

export type PixivTitleCaptionTranslation = {
  workTitle: string | null
  workCaption: string | null
}

// ==================================================================

export type UserProfile = {
  userId: string
  name: string
  image: string
  imageBig: string
  premium: boolean
  isFollowed: boolean
  isMypixiv: boolean
  isBlocking: boolean
  background: string | null
  sketchLiveId: string | null
  partial: number
  sketchLives: any[]
  commission: any | null
  following: number
  mypixivCount: number
  followedBack: boolean
  comment: string
  commentHtml: string
  webpage: string | null
  social: SocialLinks
  canSendMessage: boolean
  region: Region
  age: Age | null
  birthDay: BirthDay | null
  gender: Gender
  job: Job
  workspace: Workspace
  official: boolean
  group: Group[]
}

export type SocialLinks = {
  twitter: {
    url: string
  }
}

export type Region = {
  name: string
  region: string
  prefecture: string
  privacyLevel: string
}

export type Age = {
  name: string | null
  privacyLevel: string | null
}

export type BirthDay = {
  name: string | null
  privacyLevel: string | null
}

export type Gender = {
  name: string
  privacyLevel: string
}

export type Job = {
  name: string
  privacyLevel: string
}

export type Workspace = {
  userWorkspacePc: string
  userWorkspaceMonitor: string
  userWorkspaceTool: string
  userWorkspaceDesktop: string
}

export type Group = {
  id: string
  title: string
  iconUrl: string
}
