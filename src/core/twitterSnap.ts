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
}) => {
  write: (props: { output: string; data: ImageResponse }) => Promise<void>;
  element: ReactElement;
};

export type Component = (props: {
  data: TweetApiUtilsData;
  param: TwitterSnapParams;
}) => ReactElement;

export type TwitterSnapParams = {
  width: number;
  height?: number;
  client?: TwitterOpenApiClient;
  fonts?: ImageResponseOptions["fonts"];
  emoji?: ImageResponseOptions["emoji"];
  autoFormat: boolean;
  removeTemp: boolean;
};

type TwitterSnapRenderParams = {
  id: string;
  themeName?: string;
};
type TwitterSnapRenderResponse = (props: { output: string }) => Promise<void>;

export class TwitterSnap {
  static themes: { [key: string]: ThemeComponent } = {
    normal: Normal,
  };

  constructor(private param: TwitterSnapParams) {}

  getClient = async () => {
    if (this.param.client) return this.param.client;
    return await new TwitterOpenApi().getGuestClient();
  };

  render = async ({ id, themeName }: TwitterSnapRenderParams) => {
    const api = (await this.getClient()).getDefaultApi();
    const tweet = await api.getTweetResultByRestId({
      tweetId: id,
    });

    const extEntities = tweet.data!.tweet.legacy!.extendedEntities;
    const extMedia = extEntities?.media ?? [];
    const video = !!extMedia.find((e) => e.type !== "photo");
    const theme = TwitterSnap.themes[themeName || "normal"];
    const { element, write } = theme({ data: tweet.data!, param: this.param });
    const data = new ImageResponse(element, {
      width: this.param.width,
      height: this.param.height,
      fonts: this.param.fonts,
      emoji: this.param.emoji,
    });
    const res: TwitterSnapRenderResponse = ({ output }) => {
      if (this.param.autoFormat && video) {
        return write({ output, data });
      } else if (this.param.autoFormat && !video) {
        const o = path.parse(output);
        return write({ output: path.join(o.dir, `${o.name}.png`), data });
      } else {
        return write({ output, data });
      }
    };
    return res;
  };
}
