import React from "react";

import { ThemeComponent } from "./../core/twitterSnap.js";
import NormalComponent from "./normalComponent.js";
import {
  getBiggerMedia,
  videoConverter,
  videoConverterMute,
} from "./normalUtils.js";

import fs from "fs/promises";

const Normal: ThemeComponent = ({ data, param }) => {
  const extEntities = data.tweet.legacy!.extendedEntities;
  const extMedia = extEntities?.media ?? [];
  return {
    element: <NormalComponent data={data} param={param} />,

    write: async ({ name, ext, data }) => {
      if (param.format == "video") {
        const v = extMedia.filter((e) => e.type === "video");
        const margin = (param.margin ?? 20) + 12;
        const { width, height } = getBiggerMedia(
          extEntities?.media ?? [],
          margin
        );

        const video = v.map((e) => {
          return [...e.videoInfo!.variants].sort((a, b) => {
            if (a.bitrate === undefined) return -1;
            if (b.bitrate === undefined) return 1;
            return b.bitrate - a.bitrate;
          })[0];
        });
        const png = Buffer.from(await data.arrayBuffer());
        await fs.writeFile(`temp-${name}.png`, png);
        const args = {
          video,
          name,
          ext,
          width,
          height,
          margin,
        };

        try {
          await videoConverter(args);
        } catch (e) {
          await videoConverterMute(args);
        }
        await fs.unlink(`temp-${name}.png`);
      } else {
        const png = Buffer.from(await data.arrayBuffer());
        await fs.writeFile(`${name}.png`, png);
      }
    },
  };
};

export default Normal;
