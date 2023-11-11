import { ReactElement } from "react";
import Normal from "./../theme/normal.js";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "@vercel/og/dist/types";
import {
  TwitterOpenApi,
  TwitterOpenApiClient,
  TweetApiUtilsData,
} from "twitter-openapi-typescript";
import path from "path";

export type ThemeComponent = (props: {
  data: TweetApiUtilsData;
  param: TwitterSnapParams;
  video: boolean;
}) => {
  writePhoto: (props: { output: string; data: ImageResponse }) => Promise<void>;
  writeVideo: (props: { output: string; data: ImageResponse }) => Promise<void>;
  element: ReactElement;
};

export type Component = (props: {
  data: TweetApiUtilsData;
  video: boolean;
}) => ReactElement;

export type TwitterSnapParams = {
  width: number;
  height?: number;
  client?: TwitterOpenApiClient;
  themeName?: string;
  fonts?: ImageResponseOptions["fonts"];
  emoji?: ImageResponseOptions["emoji"];
  autoPhoto: boolean;
  removeTemp: boolean;
};

type TwitterSnapRenderParams = {
  output: string;
  id: string;
};

export class TwitterSnap {
  static themes: { [key: string]: ThemeComponent } = {
    normal: Normal,
  };

  constructor(private param: TwitterSnapParams) {}

  getClient = async () => {
    if (this.param.client) return this.param.client;
    return await new TwitterOpenApi().getGuestClient();
  };

  render = async ({ output, id }: TwitterSnapRenderParams) => {
    const api = (await this.getClient()).getDefaultApi();
    const tweet = await api.getTweetResultByRestId({
      tweetId: id,
    });

    const extEntities = tweet.data!.tweet.legacy!.extendedEntities;
    const extMedia = extEntities?.media ?? [];
    const videoInfo = !!extMedia.find((e) => e.type !== "photo");
    const o = path.parse(output);

    const video = (() => {
      if (this.param.autoPhoto) {
        if (videoInfo) {
          return o.ext !== ".png";
        } else {
          return false;
        }
      } else {
        return o.ext !== ".png";
      }
    })();

    const theme = TwitterSnap.themes[this.param.themeName || "normal"];
    const { element, writePhoto, writeVideo } = theme({
      data: tweet.data!,
      param: this.param,
      video: video,
    });
    const data = new ImageResponse(element, {
      width: this.param.width,
      height: this.param.height,
      fonts: this.param.fonts,
      emoji: this.param.emoji,
    });

    if (video) {
      return writeVideo({ output, data });
    } else if (o.ext !== ".png") {
      return writePhoto({ output: path.join(o.dir, `${o.name}.png`), data });
    } else {
      return writePhoto({ output, data });
    }
  };
}
