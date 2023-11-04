#!/usr/bin/env node
import { TwitterSnap } from "./core/twitterSnap";
import { Command } from "commander";

const version = "0.0.4";
const font = "assets/NotoSansCJKjp-Regular.otf";
const boldFont = "assets/NotoSansCJKjp-Bold.otf";

const program = new Command();
program.name("twitter-snap").version(version);

program
  .argument("<string>", "tweet url or tweet id")
  .option("-o, --output <path>", "output file path", "output.png")
  .option("-w, --width <number>", "image width", "600")
  .option("-h, --height <number>", "image height", "400")
  .option("--font <path>", "font path", font)
  .option("--bold-font <path>", "bold font path", boldFont)
  .action(async (text, { output, width, height, font, boldFont }) => {
    const id = isNaN(text) ? text.split("/").pop() : text;
    const twitterSnap = new TwitterSnap({
      width: parseInt(width),
      height: parseInt(height),
      font: font,
      boldFont: boldFont,
    });
    const writer = await twitterSnap.render(id);
    await writer.save(output);
    process.exit(0);
  });
program.parse(process.argv);
