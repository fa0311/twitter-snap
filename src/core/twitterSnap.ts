import { ReactElement } from "react";
import Normal from "./../theme/normal.js";
import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "@vercel/og/dist/types";
import {
  TwitterOpenApi,
  TwitterOpenApiClient,
  TweetApiUtilsData,
} from "twitter-openapi-typescript";

export type ThemeComponent = (props: {
  data: TweetApiUtilsData;
  param: TwitterSnapParams;
}) => {
  write: (props: {
    name: string;
    ext: string;
    data: ImageResponse;
  }) => Promise<void>;
  element: ReactElement;
};

export type Component = (props: {
  data: TweetApiUtilsData;
  param: TwitterSnapParams;
}) => ReactElement;

export type TwitterSnapParams = {
  width: number;
  height?: number;
  format?: string;
  margin?: number;
  client?: TwitterOpenApiClient;
  fonts?: ImageResponseOptions["fonts"];
  emoji?: ImageResponseOptions["emoji"];
};

type TwitterSnapRenderParams = {
  id: string;
  themeName?: string;
};
type TwitterSnapRenderResponse = (props: {
  name: string;
  ext: string;
}) => Promise<void>;

export class TwitterSnap {
  client: TwitterOpenApiClient | undefined;

  static themes: { [key: string]: ThemeComponent } = {
    normal: Normal,
  };

  constructor(private param: TwitterSnapParams) {}

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
    const { element, write } = theme({ data: tweet.data!, param: this.param });
    const data = new ImageResponse(element, {
      width: this.param.width,
      height: this.param.height,
      fonts: this.param.fonts,
      emoji: this.param.emoji,
    });
    const res: TwitterSnapRenderResponse = ({ name, ext }) => {
      return write({ name, ext, data });
    };
    return res;
  };
}
