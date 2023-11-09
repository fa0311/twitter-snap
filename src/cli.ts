#!/usr/bin/env node
import { TwitterSnap } from "./core/twitterSnap.js";
import { Command } from "commander";
import { getClient } from "./utils/cookies.js";
import { getFonts } from "./utils/fonts.js";
import { spilitFileName } from "./utils/file.js";

const version = "0.0.10";

const program = new Command();
program.name("twitter-snap").version(version);

program
  .argument("<string>", "tweet url or tweet id")
  .option("-o, --output <path>", "output file path", "output.png")
  .option("-w, --width <number>", "image width", "600")
  .option("-h, --height <number>", "image height")
  .option("-t, --theme <string>", Object.keys(TwitterSnap.themes).join())
  .option("--format <string>", "output format")
  .option("--margin <number>", "margin")
  .option("--fonts <path>", "font config file path .json")
  .option(
    "--emoji <string>",
    "emoji type (twemoji,openmoji,blobmoji,noto,fluent,fluentFlat)",
    "twemoji"
  )
  .option("--cookies <path>", "net escape cookie file path .txt")
  .action(
    async (
      text,
      { output, width, height, format, margin, theme, fonts, emoji, cookies }
    ) => {
      const id = isNaN(text) ? text.split("/").pop() : text;

      const twitterSnap = new TwitterSnap({
        width: parseInt(width),
        height: height ? parseInt(height) : undefined,
        margin: margin,
        format: format,
        client: cookies && (await getClient(cookies)),
        fonts: fonts && (await getFonts(fonts)),
        emoji: emoji,
      });

      const res = await twitterSnap.render({ id, themeName: theme });
      await res(spilitFileName(output));

      process.exit(0);
    }
  );
program.parse(process.argv);
