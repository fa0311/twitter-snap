import {Args, Command, Flags} from '@oclif/core'

import {twitterSnap} from '../core/twitterSnap.js'
import {getClient} from '../utils/cookies.js'
import {GetTweetApi, ThemeNameType, getTweetList, themeList} from './../utils/types.js'

export const apiFlag = Flags.custom<'getTweetResultByRestId' | keyof GetTweetApi>({
  description: 'API type',
  options: ['getTweetResultByRestId', ...getTweetList],
  default: 'getTweetResultByRestId',
})

export const themeNameFlag = Flags.custom<ThemeNameType>({
  description: 'Theme type',
  options: Object.keys(themeList),
  default: 'RenderBasic',
})

export default class Default extends Command {
  static args = {
    id: Args.string({description: 'Twitter status id', required: true}),
  }

  static description = 'Twitter Snap'

  static examples = ['twitter-snap 1765415187161464972']

  static flags = {
    api: apiFlag(),
    theme: themeNameFlag(),
    output: Flags.string({description: 'Output file name', default: '{id}.{if-photo:png:mp4}'}),
    cleanup: Flags.boolean({description: 'Cleanup', default: true}),
    max: Flags.integer({description: 'Max count', default: 30}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Default)

    const snap = await twitterSnap({
      cookies: await getClient('cookies.txt'),
    })
    await snap({id: args.id, type: flags.api, max: flags.max}, async (render) => {
      const finalize = await render({
        themeName: flags.theme,
        themeParam: {
          width: 600,
        },
        output: flags.output,
      })
      await finalize({
        cleanup: true,
      })
    })
  }
}
