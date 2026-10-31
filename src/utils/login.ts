import fs from 'node:fs/promises'
import {launch} from 'puppeteer'

import {type Cookie, SnapAppCookies} from './cookies.js'
import {DirectoryPath, FilePath} from './path.js'

export type SnapAppBrowserUtilsParams = {
  sessionType?: 'browser' | 'file' | 'guest'
  browserProfile?: string
  browserHeadless?: boolean
  cookiesFile?: string
  translate?: string
}

export class SnapAppBrowserUtils {
  public sessionType: 'browser' | 'file' | 'guest'
  public translate?: string
  private flags: Required<Omit<SnapAppBrowserUtilsParams, 'translate'>>

  constructor(flags: SnapAppBrowserUtilsParams) {
    this.sessionType = flags.sessionType ?? 'guest'
    this.translate = flags.translate
    this.flags = {
      sessionType: this.sessionType,
      browserProfile: flags.browserProfile ?? '~/.cache/twitter-snap/profiles',
      browserHeadless: flags.browserHeadless ?? false,
      cookiesFile: flags.cookiesFile ?? 'cookies.json',
    }
  }

  async get() {
    return launch({
      args: ['--disable-blink-features=AutomationControlled'],
      defaultViewport: null,
      headless: this.flags.browserHeadless,
      timeout: 0,
      userDataDir: DirectoryPath.from(this.flags.browserProfile).toString(),
    })
  }

  fileLogin = async () => {
    const data = await fs.readFile(FilePath.from(this.flags.cookiesFile).toString(), 'utf8')

    // Either a browser extension export (array of cookies) or a plain {name: value} object.
    const parsed = JSON.parse(data) as Cookie[] | Record<string, string>
    if (Array.isArray(parsed)) {
      return new SnapAppCookies(parsed.map(({name, value, domain}) => ({name, value, domain})))
    }

    return new SnapAppCookies(Object.entries(parsed).map(([name, value]) => ({name, value})))
  }

  puppeteerLogin = async (url: string, pattern: string) => {
    const browser = await this.get()
    const [page] = await browser.pages()

    page.setDefaultNavigationTimeout(0)
    page.setDefaultTimeout(0)

    const hook = new Promise<void>((resolve) => {
      page.on('response', (res) => {
        if (new RegExp(pattern).test(res.url())) {
          resolve()
        }
      })
    })

    await page.goto(url)
    await hook

    const cookies = await browser.cookies()
    await browser.close()
    return new SnapAppCookies(cookies)
  }
}
