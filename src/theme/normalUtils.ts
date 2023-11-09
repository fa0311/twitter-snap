import {
  MediaExtended,
  MediaVideoInfoVariant,
} from "twitter-openapi-typescript-generated";
import ffmpeg from "fluent-ffmpeg";

export const getBiggerMedia = (extMedia: MediaExtended[], margin: number) => {
  const video = extMedia.filter((e) => e.type === "video");
  const sorted = [...video].sort(
    (a, b) =>
      b.videoInfo!.aspectRatio[1] / b.videoInfo!.aspectRatio[0] -
      a.videoInfo!.aspectRatio[1] / a.videoInfo!.aspectRatio[0]
  );
  if (sorted.length === 0) return { width: 0, height: 0 };

  const [aspectWidth, aspectHeight] = sorted[0].videoInfo!.aspectRatio;
  const width = 600 - margin * 2;
  const height = (width / aspectWidth) * aspectHeight;
  return { width, height };
};

type VideoConverterParam = {
  video: MediaVideoInfoVariant[];
  name: string;
  ext: string;
  width: number;
  height: number;
  margin: number;
};

const dump = (command: ffmpeg.FfmpegCommand) => {
  console.log(
    command
      ._getArguments()
      .map((e) => `"${e}"`)
      .join(" ")
  );
};

const run = async (command: ffmpeg.FfmpegCommand) => {
  await new Promise((resolve, reject) => {
    command.on("end", resolve);
    command.on("error", reject);
    command.run();
  });
};

export const videoConverterMute = async ({
  video,
  name,
  ext,
  width,
  height,
  margin,
}: VideoConverterParam) => {
  const all = (e: string) => {
    return `${video.map((_, i) => `[${e}${i}]`).join("")}`;
  };

  const command = ffmpeg();
  const [pw, ph] = [width, height].map((e) => Number(e + 0.5));
  command.input(`temp-${name}.png`);
  video.forEach(({ url }) => command.input(url));
  command.complexFilter(
    [
      `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
      video.map(
        (_, i) =>
          `[${
            i + 1
          }]scale=${width}:${height}:force_original_aspect_ratio=1,pad=${pw}:${ph}:-1:(oh-ih)/2:color=white[v${i}]`
      ),
      `${all("v")}concat=n=${video.length}:v=1:a=0[video]`,
      `[i][video]overlay=30:H-${height + margin}[marge]`,
    ].flat()
  );
  command.map("[marge]");
  if (ext === "png") {
    command.output(`${name}.mp4`);
  } else {
    command.output(`${name}.${ext}`);
  }
  // dump(command);
  try {
    await run(command);
  } catch (e) {
    throw e;
  }
};

export const videoConverter = async ({
  video,
  name,
  ext,
  width,
  height,
  margin,
}: VideoConverterParam) => {
  const all = (e: string) => {
    return `${video.map((_, i) => `[${e}${i}]`).join("")}`;
  };

  const command = ffmpeg();
  command.input(`temp-${name}.png`);
  video.forEach(({ url }) => command.input(url));
  command.complexFilter(
    [
      `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
      video.map((_, i) => `[${i + 1}]anull[a${i}]`),
      video.map(
        (_, i) =>
          `[${
            i + 1
          }]scale=${width}:${height}:force_original_aspect_ratio=1,pad=${
            width / 2
          }:${height / 2}:-1:(oh-ih)/2:color=white[v${i}]`
      ),
      `${all("v")}concat=n=${video.length}:v=1:a=0[video]`,
      `${all("a")}concat=n=${video.length}:v=0:a=1[audio]`,
      `[i][video]overlay=30:H-${height + margin}[marge]`,
    ].flat()
  );
  command.map("[marge]");
  command.map("[audio]");
  if (ext === "png") {
    command.output(`${name}.mp4`);
  } else {
    command.output(`${name}.${ext}`);
  }
  // dump(command);
  try {
    await run(command);
  } catch (e) {
    throw e;
  }
};
