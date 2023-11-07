import { ReactElement } from "react";
import Normal from "./../theme/normal.js";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "@vercel/og/dist/types";
import {
  TwitterOpenApi,
  TwitterOpenApiClient,
  TweetApiUtilsData,
} from "twitter-openapi-typescript";

export type themeComponent = (props: {
  data: TweetApiUtilsData;
}) => ReactElement;

type TwitterSnapParams = {
  width: number;
  height?: number;
  client?: TwitterOpenApiClient | Promise<TwitterOpenApiClient>;
  fonts?: ImageResponseOptions["fonts"];
  emoji?: ImageResponseOptions["emoji"];
};

type TwitterSnapRenderParams = {
  id: string;
  themeName?: string;
};

export class TwitterSnap {
  width!: number;
  height!: number | undefined;
  client!: TwitterOpenApiClient | Promise<TwitterOpenApiClient>;
  fonts: ImageResponseOptions["fonts"];
  emoji: ImageResponseOptions["emoji"];

  static themes: { [key: string]: themeComponent } = {
    normal: Normal,
  };

  constructor(param: TwitterSnapParams) {
    this.width = param.width;
    this.height = param.height;
    this.client = param.client || new TwitterOpenApi().getGuestClient();
    this.fonts = param.fonts;
    this.emoji = param.emoji;
  }

  getClient = async () => {
    if (this.client instanceof Promise) {
      this.client = await this.client;
    }
    return this.client;
  };

  render = async ({ id, themeName }: TwitterSnapRenderParams) => {
    const api = (await this.getClient()).getDefaultApi();
    const tweet = await api.getTweetResultByRestId({
      tweetId: id,
    });
    const theme = TwitterSnap.themes[themeName || "normal"];
    const res = new ImageResponse(theme({ data: tweet.data! }), {
      width: this.width,
      height: this.height,
      fonts: this.fonts,
      emoji: this.emoji,
    });
    return res;
  };
}
