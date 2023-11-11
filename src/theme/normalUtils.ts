import {
  MediaExtended,
  MediaVideoInfoVariant,
} from "twitter-openapi-typescript-generated";
import ffmpeg from "fluent-ffmpeg";
import ffprobe from "fluent-ffmpeg";

export const getBiggerMedia = (extMedia: MediaExtended[], margin: number) => {
  const video = extMedia.filter((e) => e.type !== "photo");
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
  name,
  ext,
  width,
  height,
  margin,
}: VideoConverterParam) => {
  const outputExt = ext === "png" ? "mp4" : ext;

  const res = video.map(async ({ url }, i) => {
    const temp = `temp-${name}-${i}.${outputExt}`;
    const tempAudio = `temp-audio-${name}-${i}.aac`;
    const tempOutput = `temp-output-${name}-${i}.${outputExt}`;

    const command = ffmpeg();
    command.input(url);
    command.output(temp);
    await run(command);

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

      return tempOutput;
    } else if (!video) {
      throw new Error("video not found");
    } else {
      return temp;
    }
  });

  const tempVideo = await Promise.all(res);

  const [pw, ph] = [width, height].map(Math.ceil);
  const all = (e: string) => {
    return `${video.map((_, i) => `[${e}${i}]`).join("")}`;
  };

  const command = ffmpeg();
  command.input(`temp-${name}.png`);
  tempVideo.forEach((input) => command.input(input));
  command.complexFilter(
    [
      `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
      video.map((_, i) => `[${i + 1}]anull[a${i}]`),
      video.map(
        (_, i) =>
          `[${
            i + 1
          }]scale=${width}:${height}:force_original_aspect_ratio=1,pad=${pw}:${ph}:-1:(oh-ih)/2:color=white[v${i}]`
      ),
      `${all("v")}concat=n=${video.length}:v=1:a=0[video]`,
      `${all("a")}concat=n=${video.length}:v=0:a=1[audio]`,
      `[i][video]overlay=30:H-${height + margin}[marge]`,
    ].flat()
  );

  command.addOption("-metadata", "title=twitter-snap");
  command.addOption("-metadata", "comment=generated by twitter-snap");
  command.addOption("-metadata", "description=twitter-snap");

  command.map("[marge]");
  command.map("[audio]");
  command.output(`${name}.${outputExt}`);
  await run(command);
};
