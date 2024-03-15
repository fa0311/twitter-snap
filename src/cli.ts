// #!/usr/bin/env node

import {twitterSnapPuppeteer} from './core/twitterSnap'

const snap = await twitterSnapPuppeteer()
await snap({id: '900282258736545792', type: 'getLikes', max: 100}, async (render) => {
  const finalize = await render({
    themeName: 'RenderBasic',
    themeParam: {
      width: 600,
    },
    output: 'temp/{id}.png',
  })
  await finalize({
    cleanup: true,
  })
})
