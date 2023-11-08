import React from "react";

import { themeComponent } from "./../core/twitterSnap.js";
import NormalComponent from "./normalComponent.js";

import fs from "fs/promises";
import ffmpeg from "fluent-ffmpeg";

const Normal: themeComponent = ({ data }) => {
  const extEntities = data.tweet.legacy!.extendedEntities;
  const extMedia = extEntities?.media ?? [];

  return {
    element: <NormalComponent data={data} />,

    write: async ({ file, data }) => {
      const video = extMedia.filter((e) => e.type === "video");
      if (video.length > 0) {
        const [aspectWidth, aspectHeight] = video[0].videoInfo?.aspectRatio!;
        const variants = video[0].videoInfo!.variants;
        // const url = [...variants].sort(
        //   (a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0)
        // )[0].url;
        const url = variants[0].url;
        const margin = 30;
        const width = 600 - margin * 2;
        const height = (width / aspectWidth) * aspectHeight;

        const png = Buffer.from(await data.arrayBuffer());
        await fs.writeFile(`temp-${file}`, png);
        const command = ffmpeg();
        command.input(`temp-${file}`);
        command.input(url);
        command.complexFilter([
          `[0]scale=trunc(iw/2)*2:trunc(ih/2)*2[i]`,
          `[1]anull[audio]`,
          `[1]scale=${width}:${height}[v]`,
          `[i][v]overlay=30:H-${height + margin}[marge]`,
        ]);

        command.map("[marge]");
        command.map("[audio]");
        command.output(`output-${file}.mp4`);
        console.log(
          command
            ._getArguments()
            .map((e) => `"${e}"`)
            .join(" ")
        );
        await new Promise((resolve, reject) => {
          command.on("end", resolve);
          command.on("error", reject);
          command.run();
        });
      } else {
        const png = Buffer.from(await data.arrayBuffer());
        await fs.writeFile(file, png);
      }
    },
  };
};

export default Normal;
