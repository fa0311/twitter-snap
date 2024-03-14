import { ImageResponse } from "@vercel/og";
import { ImageResponseOptions } from "@vercel/og/dist/types";
import path from "path";
import {
  DefaultApiUtils,
  TweetApiUtils,
  TwitterOpenApi,
  TwitterOpenApiClient,
} from "twitter-openapi-typescript";

import { RenderBasic } from "twitter-snap-core";

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

const getSnapClient = async (client?: TwitterOpenApiClient) => {
  const api = client ? client : await new TwitterOpenApi().getGuestClient();
  return {
    defaultApi: defaultApiSnap(api),
    tweetApi: tweetApiSnap(api),
  };
};

// or でマージする

export type TweetApiMerge<T> = {
  [K in keyof T]: T[K];
};
type TweetApi = TweetApiMerge<DefaultApiUtils & TweetApiUtils>;
type TweetApiKeyOf = keyof TweetApi;
type TweetApiSnapApi = {
  [K in TweetApiKeyOf as K extends `get${infer Rest}` ? K : never]: TweetApi[K];
};
type TweetApiSnapApiType = keyof TweetApiSnapApi;

const tweetApiSnap = async (client: TwitterOpenApiClient) => {
  return async function* (id: string, type: TweetApiSnapApiType, max: number) {
    const api = client.getTweetApi();
    const data = [];
    while (data.length < max) {
      const res = await api[type]({
        focalTweetId: id,
        rawQuery: id,
        listId: id,
        userId: id,
        cursor: undefined,
      });
      res.data.data.forEach((e) => data.push(e));
    }
    res = res.data.cursor.bottom?.value;
    return res;
  };
};

export class TwitterSnap {
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

    const render = new RenderBasic({
      width: 600,
    });

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
