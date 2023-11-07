import { ReactElement } from "react";
import Normal from "./../theme/normal.js";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "@vercel/og/dist/types";
import {
  TwitterOpenApi,
  TwitterOpenApiClient,
  TweetApiUtilsData,
} from "twitter-openapi-typescript";

export type themeComponent = (props: { data: TweetApiUtilsData }) => {
  write: (props: { file: string; data: ImageResponse }) => Promise<void>;
  element: ReactElement;
};

type TwitterSnapParams = {
  width: number;
  height?: number;
  client?: TwitterOpenApiClient;
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
  client: TwitterOpenApiClient | undefined;
  fonts: ImageResponseOptions["fonts"];
  emoji: ImageResponseOptions["emoji"];

  static themes: { [key: string]: themeComponent } = {
    normal: Normal,
  };

  constructor(param: TwitterSnapParams) {
    this.width = param.width;
    this.height = param.height;
    this.client = param.client;
    this.fonts = param.fonts;
    this.emoji = param.emoji;
  }

  getClient = async () => {
    if (this.client) return this.client;
    return await new TwitterOpenApi().getGuestClient();
  };

  render = async ({ id, themeName }: TwitterSnapRenderParams) => {
    const api = (await this.getClient()).getDefaultApi();
    const tweet = await api.getTweetResultByRestId({
      tweetId: id,
    });
    const theme = TwitterSnap.themes[themeName || "normal"];
    const { element, write } = theme({ data: tweet.data! });
    const res = new ImageResponse(element, {
      width: this.width,
      height: this.height,
      fonts: this.fonts,
      emoji: this.emoji,
    });
    return async (path: string) => {
      return await write({ file: path, data: res });
    };
  };
}
