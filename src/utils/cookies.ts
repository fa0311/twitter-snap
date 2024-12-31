export type Cookie = {
  domain?: string
  name: string
  value: string
}

export class SnapAppCookies {
  constructor(public cookies: Cookie[]) {}

  get(domain: string[]) {
    const cookies = this.cookies.filter((cookie) => {
      if (cookie.domain === undefined) {
        return true
      }

      if (cookie.domain[0] === '.') {
        return domain.some((d) => cookie.domain!.endsWith(d))
      }

      return domain.includes(cookie.domain!)
    })
    return new SnapAppCookies(cookies)
  }

  toString() {
    return this.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
  }

  toKeyValues() {
    return this.cookies.map((cookie) => ({[cookie.name]: cookie.value})).reduce((a, b) => ({...a, ...b}), {})
  }
}
