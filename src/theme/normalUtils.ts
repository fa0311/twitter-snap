import { promises as fs } from "fs";
import {
  MediaExtended,
  MediaVideoInfoVariant,
} from "twitter-openapi-typescript-generated";
import ffmpeg from "fluent-ffmpeg";
import ffprobe from "fluent-ffmpeg";
import path from "path";
import log4js from "log4js";

const logger = log4js.getLogger();

export const getBiggerMedia = (
  extMedia: MediaExtended[],
  margin: number,
  width: number
) => {
  const video = extMedia.filter((e) => e.type !== "photo");
  const sorted = [...video].sort(
    (a, b) =>
      b.videoInfo!.aspectRatio[1] / b.videoInfo!.aspectRatio[0] -
      a.videoInfo!.aspectRatio[1] / a.videoInfo!.aspectRatio[0]
  );
  if (sorted.length === 0) return { width: 0, height: 0, index: 0 };

  const [aspectWidth, aspectHeight] = sorted[0].videoInfo!.aspectRatio;
  const w = width - margin * 2;
  const h = (w / aspectWidth) * aspectHeight;
  return { width: w, height: h, index: extMedia.indexOf(sorted[0]) };
};

type VideoConverterParam = {
  video: MediaVideoInfoVariant[];
  index: number;
  title: string;
  output: string;
  width: number;
  height: number;
  margin: number;
  removeTemp: boolean;
};

const dump = (command: ffmpeg.FfmpegCommand) => {
  console.log(
    command
      ._getArguments()
      .map((e) => `"${e}"`)
      .join(" ")
  );
};

const run = (command: ffmpeg.FfmpegCommand): Promise<unknown> => {
  // dump(command);
  return new Promise((resolve, reject) => {
    command.on("end", resolve);
    command.on("error", reject);
    command.run();
  });
};

const runProbe = async (
  command: ffprobe.FfmpegCommand
): Promise<ffmpeg.FfprobeData> => {
  // dump(command);
  return new Promise((resolve, reject) => {
    command.ffprobe((err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

export const videoConverter = async ({
  video,
  index,
  title,
  output,
  width,
  height,
  margin,
  removeTemp,
}: VideoConverterParam) => {
  const removeList: string[] = [];
  const o = path.parse(output);
  const copyName = (name: string) => path.join(path.parse(output).dir, name);

  const res = video.map(async ({ url }, i) => {
    const temp = copyName(`temp-${o.name}-${i}${o.ext}`);
    const tempAudio = copyName(`temp-audio-${o.name}-${i}.aac`);
    const tempOutput = copyName(`temp-output-${o.name}-${i}${o.ext}`);

    const command = ffmpeg();
    command.input(url);
    command.output(temp);
    await run(command);

    if (removeTemp) {
      removeList.push(temp);
    }

    const probe = ffprobe();
    probe.input(temp);

    const data = await runProbe(probe);
    const duration = data.format.duration!;
    const video = data.streams.find((e) => e.codec_type === "video");
    const audio = data.streams.find((e) => e.codec_type === "audio");

    if (!audio) {
      const command = ffmpeg();
      command.input("anullsrc=channel_layout=mono:sample_rate=44100");
      command.inputFormat("lavfi");
      command.addOption("-t", duration.toString());
      command.output(tempAudio);
      await run(command);

      const command2 = ffmpeg();
      command2.input(temp);
      command2.input(tempAudio);
      command2.output(tempOutput);
      await run(command2);

      removeList.push(tempAudio);
      removeList.push(tempOutput);

      return tempOutput;
    } else if (!video) {
      throw new Error("video not found");
    } else {
      return temp;
    }
  });

  const tempVideo = await Promise.all(res);

  const all = (e: string) => {
    return `${video.map((_, i) => `[${e}${i}]`).join("")}`;
  };
  const png = copyName(`temp-${o.name}.png`);

  const pad = (i: number): string => {
    if (i === index) return `[v${i}]`;
    return `:force_original_aspect_ratio=1,pad=${width}:${height}:-1:(oh-ih)/2:color=white[v${i}]`;
  };

  const command = ffmpeg();
  command.input(png);
  tempVideo.forEach((input) => command.input(input));
  command.complexFilter(
    [
      `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
      video.map((_, i) => `[${i + 1}]anull[a${i}]`),
      video.map((_, i) => `[${i + 1}]scale=${width}:${height}${pad(i)}`),
      `${all("v")}concat=n=${video.length}:v=1:a=0[video]`,
      `${all("a")}concat=n=${video.length}:v=0:a=1[audio]`,
      `[i][video]overlay=30:H-${height + margin}[marge]`,
    ].flat()
  );
  command.map("[marge]");
  command.map("[audio]");
  const comment =
    "Snapped by twitter-snap https://github.com/fa0311/twitter-snap";

  command.addOption("-metadata", `title=${title}`);
  command.addOption("-metadata", `comment=${comment}`);
  command.output(output);
  await run(command);

  const removed = removeList.map((e) => fs.unlink(e));
  await Promise.all(removed);
};
