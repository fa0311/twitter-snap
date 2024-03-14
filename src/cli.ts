// #!/usr/bin/env node

import {twitterSnap} from './core/twitterSnap'
import {getClient} from './utils/cookies'

// import { TwitterOpenApi } from 'twitter-openapi-typescript'
// import { getClient } from './utils/cookies'

// const twitter = new TwitterOpenApi()
// const api = await twitter.getClientFromCookies(await getClient('cookies.txt'))

// const k = await api.getTweetApi().getUserTweets({userId: '900282258736545792'})
// console.log(k)

const snap = await twitterSnap({
  cookies: await getClient('cookies.txt'),
})
await snap({id: '900282258736545792', type: 'getUserTweets', max: 30}, async (render) => {
  const finalize = await render({
    themeName: 'RenderBasic',
    themeParam: {
      width: 600,
    },
    output: 'aaaa.png',
  })
  await finalize({
    cleanup: true,
  })
})

// import { Command } from "commander";

// const version = "0.0.10";

// const program = new Command();
// program.name("twitter-snap").version(version);

// type param = {
//   output: string;
//   width: string;
//   height?: string;
//   theme?: string;
//   fonts?: string;
//   disableAuto?: boolean;
//   cookies?: string;
//   autoPhoto?: boolean;
//   removeTemp?: boolean;
// };

// const emoji = "(twemoji, openmoji, blobmoji, noto, fluent, fluentFlat)";

// program
//   .argument("<string>", "tweet url or tweet id")
//   .option("-o, --output <path>", "output file path", "output.png")
//   .option("-w, --width <number>", "image width", "600")
//   .option("-h, --height <number>", "image height")
//   .option("-t, --theme <string>", "aaa")
//   .option("--margin <number>", "margin")
//   .option("--fonts <path>", "font config file path .json")
//   .option("--emoji <string>", `emoji type ${emoji}`, "twemoji")
//   .option("--cookies <path>", "net escape cookie file path .txt")
//   .option("--auto-photo", "if the tweet is not a video, save it as an image")
//   .option("--no-remove-temp", "no remove temp file")
//   .action(async (text, param: param) => {
//     // const id = isNaN(text) ? text.split("/").pop() : text;

//     // const twitterSnap = new TwitterSnap({
//     //   width: parseInt(param.width),
//     //   height: param.height ? parseInt(param.height) : undefined,
//     //   client: param.cookies ? await getClient(param.cookies) : undefined,
//     //   themeName: param.theme,
//     //   fonts: param.fonts ? await getFonts(param.fonts) : undefined,
//     //   emoji: param.emoji ? param.emoji : undefined,
//     //   autoPhoto: param.autoPhoto ? true : false,
//     //   removeTemp: param.removeTemp ? true : false,
//     // });

//     // await twitterSnap.render({ output: param.output, id });

//     process.exit(0);
//   });
// program.parse(process.argv);

// // const video = (() => {
// //   if (this.param.autoPhoto) {
// //     if (videoInfo) {
// //       return o.ext !== ".png";
// //     } else {
// //       return false;
// //     }
// //   } else {
// //     return o.ext !== ".png";
// //   }
// // })();

// // const o = (() => {
// //         const dir = output.substring(0, output.lastIndexOf("/")) || ".";
// //         const name = output.substring(output.lastIndexOf("/") + 1, output.lastIndexOf("."));
// //         const ext = output.substring(output.lastIndexOf(".") + 1);
// //         return { dir, name, ext };
// //     })();
