#!/usr/bin/env node
import { TwitterSnap, TwitterSnapParams } from "./core/twitterSnap.js";
import { Command } from "commander";
import { getClient } from "./utils/cookies.js";
import { getFonts } from "./utils/fonts.js";
import path from "path";

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
  autoOutputFormat?: boolean;
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
  .option("--no-auto-output-format", "auto output format")
  .option("--no-remove-temp", "no remove temp file")
  .action(async (text, param: param) => {
    const id = isNaN(text) ? text.split("/").pop() : text;

    const twitterSnap = new TwitterSnap({
      width: parseInt(param.width),
      height: param.height ? parseInt(param.height) : undefined,
      client: param.cookies ? await getClient(param.cookies) : undefined,
      fonts: param.fonts ? await getFonts(param.fonts) : undefined,
      emoji: param.emoji ? param.emoji : undefined,
      autoFormat: param.autoOutputFormat ? true : false,
      removeTemp: param.removeTemp ? true : false,
    });

    const res = await twitterSnap.render({ id, themeName: param.theme });
    const output = param.output;
    await res({ output });

    process.exit(0);
  });
program.parse(process.argv);
