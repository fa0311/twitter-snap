import fs from 'node:fs/promises'
import { launch } from 'puppeteer'

import { Cookie, SnapAppCookies } from './cookies.js'
import { DirectoryPath, FilePath } from './path.js'

export class SnapAppBrowserUtilsParams {
  sessionType?: 'browser' | 'file' | 'guest'
  browserProfile?: string
  browserHeadless?: boolean
  cookiesFile?: string
}

export class SnapAppBrowserUtils {
  public sessionType: 'browser' | 'file' | 'guest'
  private flags: Required<SnapAppBrowserUtilsParams>

  constructor(flags: SnapAppBrowserUtilsParams) {
    this.sessionType = flags.sessionType ?? 'guest'
    this.flags = {
      sessionType: this.sessionType,
      browserProfile: flags.browserProfile ?? '~/browser',
      browserHeadless: flags.browserHeadless ?? false,
      cookiesFile: flags.cookiesFile ?? 'cookies.json',
    }
  }

  async get() {
    return launch({
      defaultViewport: null,
      headless: this.flags.browserHeadless,
      timeout: 0,
      userDataDir: DirectoryPath.from(this.flags.browserProfile).toString(),
    })
  }

  fileLogin = async () => {
    const data = await fs.readFile(FilePath.from(this.flags.cookiesFile).toString(), 'utf8')

    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) {
      return new SnapAppCookies(parsed.map(({name, value, domain}: Cookie) => ({name, value, domain})) as Cookie[])
    }

    if (typeof parsed === 'object') {
      return new SnapAppCookies(Object.entries(parsed).map(([name, value]) => ({name, value})) as Cookie[])
    }

    throw new Error('Invalid cookies')
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
