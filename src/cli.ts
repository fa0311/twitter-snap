#!/usr/bin/env node
import { Command } from "commander";
import { TwitterSnap, TwitterSnapParams } from "./core/twitterSnap.js";
import { getClient } from "./utils/cookies.js";
import { getFonts } from "./utils/fonts.js";

const version = "0.0.10";

const program = new Command();
program.name("twitter-snap").version(version);

type param = {
  output: string;
  width: string;
  height?: string;
  theme?: string;
  fonts?: string;
  emoji?: TwitterSnapParams["emoji"];
  disableAuto?: boolean;
  cookies?: string;
  autoPhoto?: boolean;
  removeTemp?: boolean;
};

const emoji = "(twemoji, openmoji, blobmoji, noto, fluent, fluentFlat)";

program
  .argument("<string>", "tweet url or tweet id")
  .option("-o, --output <path>", "output file path", "output.png")
  .option("-w, --width <number>", "image width", "600")
  .option("-h, --height <number>", "image height")
  .option("-t, --theme <string>", Object.keys(TwitterSnap.themes).join())
  .option("--margin <number>", "margin")
  .option("--fonts <path>", "font config file path .json")
  .option("--emoji <string>", `emoji type ${emoji}`, "twemoji")
  .option("--cookies <path>", "net escape cookie file path .txt")
  .option("--auto-photo", "if the tweet is not a video, save it as an image")
  .option("--no-remove-temp", "no remove temp file")
  .action(async (text, param: param) => {
    const id = isNaN(text) ? text.split("/").pop() : text;

    const twitterSnap = new TwitterSnap({
      width: parseInt(param.width),
      height: param.height ? parseInt(param.height) : undefined,
      client: param.cookies ? await getClient(param.cookies) : undefined,
      themeName: param.theme,
      fonts: param.fonts ? await getFonts(param.fonts) : undefined,
      emoji: param.emoji ? param.emoji : undefined,
      autoPhoto: param.autoPhoto ? true : false,
      removeTemp: param.removeTemp ? true : false,
    });

    await twitterSnap.render({ output: param.output, id });

    process.exit(0);
  });
program.parse(process.argv);
