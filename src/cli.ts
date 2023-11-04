#!/usr/bin/env node
import { TwitterSnap } from "./core/twitterSnap";
import { Command } from "commander";
import { promises as fs } from "fs";

const version = "0.0.8";

const program = new Command();
program.name("twitter-snap").version(version);

program
  .argument("<string>", "tweet url or tweet id")
  .option("-o, --output <path>", "output file path", "output.png")
  .option("-w, --width <number>", "image width", "600")
  .option("-h, --height <number>", "image height")
  .option("-s, --style <string>", "style", "normal")
  .action(async (text, { output, width, height, style }) => {
    const id = isNaN(text) ? text.split("/").pop() : text;
    const twitterSnap = new TwitterSnap({
      width: parseInt(width),
      height: height ? parseInt(height) : undefined,
    });
    const res = await twitterSnap.render({ id, styleName: style });
    const png = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(output, png);

    process.exit(0);
  });
program.parse(process.argv);
