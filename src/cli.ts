#!/usr/bin/env node
import { TwitterSnap } from "./core/twitterSnap";
import { Command } from "commander";
import { promises as fs } from "fs";

const version = "0.0.4";
const font = "assets/NotoSansCJKjp-Regular.otf";
const boldFont = "assets/NotoSansCJKjp-Bold.otf";
const emojiFont = "assets/twemoji/{code}.svg";

const program = new Command();
program.name("twitter-snap").version(version);

program
  .argument("<string>", "tweet url or tweet id")
  .option("-o, --output <path>", "output file path", "output.png")
  .option("-w, --width <number>", "image width", "600")
  .option("-h, --height <number>", "image height")
  .option("-s, --style <string>", "style", "normal")
  .option("--font <path>", "font path", font)
  .option("--bold-font <path>", "bold font path", boldFont)
  .option("--emoji-font <path>", "emoji font path", emojiFont)
  .action(async (text, { output, width, height, style, font, boldFont }) => {
    const id = isNaN(text) ? text.split("/").pop() : text;
    const twitterSnap = new TwitterSnap({
      width: parseInt(width),
      height: height ? parseInt(height) : undefined,
      font: [
        {
          name: "Regular",
          data: await fs.readFile(font),
          weight: 400,
          style: "normal",
        },
        {
          name: "Bold",
          data: await fs.readFile(boldFont),
          weight: 700,
          style: "normal",
        },
      ],
      emojiFont: emojiFont,
    });
    const writer = await twitterSnap.render({ id, styleName: style });
    await writer.save(output);
    process.exit(0);
  });
program.parse(process.argv);
