#!/usr/bin/env node
import { TwitterSnap } from "./core/twitterSnap";
import { Command } from "commander";
import { promises as fs } from "fs";
import { getClient } from "./utils/cookies";
import { getFonts } from "./utils/fonts";

const version = "0.0.8";

const program = new Command();
program.name("twitter-snap").version(version);

program
  .argument("<string>", "tweet url or tweet id")
  .option("-o, --output <path>", "output file path", "output.png")
  .option("-w, --width <number>", "image width", "600")
  .option("-h, --height <number>", "image height")
  .option("-t, --theme <string>", "theme", "normal")
  .option("--fonts <path>", "font config file path .json")
  .option(
    "--emoji <string>",
    "emoji type (twemoji,openmoji,blobmoji,noto,fluent,fluentFlat)",
    "twemoji"
  )
  .option("--cookies <path>", "net escape cookie file path .txt")
  .action(
    async (text, { output, width, height, theme, fonts, emoji, cookies }) => {
      const id = isNaN(text) ? text.split("/").pop() : text;

      const twitterSnap = new TwitterSnap({
        width: parseInt(width),
        height: height ? parseInt(height) : undefined,
        client: cookies && getClient(cookies),
        fonts: fonts && getFonts(fonts),
        emoji: emoji || "twemoji",
      });

      const res = await twitterSnap.render({ id, themeName: theme });
      const png = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(output, png);

      process.exit(0);
    }
  );
program.parse(process.argv);
