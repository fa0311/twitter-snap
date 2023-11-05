import Normal from "./../style/normal";
import { ImageResponse } from "@vercel/og";
import { TwitterOpenApi, TweetApiUtilsData } from "twitter-openapi-typescript";

export type StyleComponent = (props: {
  data: TweetApiUtilsData;
}) => React.ReactElement;

type TwitterSnapParams = {
  width: number;
  height?: number;
};
type TwitterSnapRenderParams = {
  id: string;
  styleName?: string;
};

export class TwitterSnap {
  width!: number;
  height!: number | undefined;

  static styles: { [key: string]: StyleComponent } = {
    normal: Normal,
  };

  constructor(param: TwitterSnapParams) {
    this.width = param.width;
    this.height = param.height;
  }

  render = async ({ id, styleName }: TwitterSnapRenderParams) => {
    const client = await new TwitterOpenApi().getGuestClient();
    const tweet = await client.getDefaultApi().getTweetResultByRestId({
      tweetId: id,
    });
    const style = TwitterSnap.styles[styleName || "normal"];
    const res = new ImageResponse(style({ data: tweet.data! }), {
      width: this.width,
      height: this.height,
    });
    return res;
  };
}
