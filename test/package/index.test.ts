import {getFonts, twitterSnapGuest, twitterUrlConvert} from '../../src/main'

describe('package test', () => {
  it('package guest', async () => {
    const id = '1349129669258448897'
    const [client, api] = await twitterSnapGuest() // or twitterSnapCookies or twitterSnapPuppeteer
    const fonts = await getFonts('temp/fonts')
    await client({id: id, limit: 1, type: 'getTweetResultByRestId', startId: id}, async (render) => {
      const finalize = await render({
        output: `temp/${id}.{if-photo:png:mp4}`,
        themeName: 'RenderOceanBlueColor',
        themeParam: {
          fonts: fonts,
          width: 1440,
        },
      })
      await finalize({cleanup: true})
    })
  })
  it('package url', async () => {
    const url = 'https://twitter.com/elonmusk/status/1349129669258448897'

    const [client, api] = await twitterSnapGuest()
    const fonts = await getFonts('temp/fonts')
    const [id, type] = await twitterUrlConvert({url: url, api: api})
    await client({id: id, limit: 1, type: type, startId: id}, async (render) => {
      const finalize = await render({
        output: `temp/${id}.{if-photo:png:mp4}`,
        themeName: 'RenderOceanBlueColor',
        themeParam: {
          fonts: fonts,
          width: 1440,
        },
      })
      await finalize({cleanup: true})
    })
  })
})
