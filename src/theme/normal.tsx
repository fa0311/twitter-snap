import React from "react";

import { ThemeComponent } from "./../core/twitterSnap.js";
import NormalComponent from "./normalComponent.js";
import { getBiggerMedia, videoConverter } from "./normalUtils.js";

import fs from "fs/promises";
import path from "path";

const Normal: ThemeComponent = ({ data, param, video }) => {
  const extEntities = data.tweet.legacy!.extendedEntities;
  const extMedia = extEntities?.media ?? [];
  const v = extMedia.filter((e) => e.type !== "photo");

  const screenName = data.user.legacy!.screenName;
  const id = data.tweet.legacy!.idStr;

  const title = `https://twitter.com/${screenName}/status/${id}`;

  return {
    element: <NormalComponent data={data} video={video} width={param.width} />,

    writePhoto: async ({ output, data }) => {
      const png = Buffer.from(await data.arrayBuffer());
      await fs.writeFile(output, png);
    },

    writeVideo: async ({ output, data }) => {
      const o = path.parse(output);
      const margin = 20 + 12;
      const { width, height, index } = getBiggerMedia(
        extEntities?.media ?? [],
        margin,
        param.width
      );

      const video = v.map((e) => {
        return [...e.videoInfo!.variants].sort((a, b) => {
          if (a.bitrate === undefined) return -1;
          if (b.bitrate === undefined) return 1;
          return b.bitrate - a.bitrate;
        })[0];
      });
      const png = Buffer.from(await data.arrayBuffer());
      const name = path.join(o.dir, `temp-${o.name}.png`);
      await fs.writeFile(name, png);

      const removeTemp = param.removeTemp;
      const args = {
        video,
        index,
        title,
        output,
        width,
        height,
        margin,
        removeTemp,
      };

      await videoConverter(args);
      await fs.unlink(name);
    },
  };
};

export default Normal;
