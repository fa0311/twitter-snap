import satori, { SatoriOptions } from "satori";
import { Transformer } from "@napi-rs/image";
import Normal from "./../style/normal";
import * as fs from "fs";

import { TwitterOpenApi } from "twitter-openapi-typescript";

export type StyleComponent = (props: {
  name: string;
  id: string;
  icon: string;
  text: string;
}) => React.ReactElement;

type TwitterSnapParams = {
  width: number;
  height: number;
  font: string;
  boldFont: string;
  lang?: string;
};

export class TwitterSnap {
  width!: number;
  height!: number;
  option!: SatoriOptions;

  constructor(param: TwitterSnapParams) {
    this.width = param.width;
    this.height = param.height;

    this.option = {
      width: this.width,
      height: this.height,
      fonts: [
        {
          name: "Regular",
          data: fs.readFileSync(param.font),
          weight: 400,
          style: "normal",
          lang: param.lang,
        },
        {
          name: "Bold",
          data: fs.readFileSync(param.boldFont),
          weight: 700,
          style: "normal",
          lang: param.lang,
        },
      ],
    };
  }

  render = async (id: string) => {
    const client = await new TwitterOpenApi().getGuestClient();
    const tweet = await client.getDefaultApi().getTweetResultByRestId({
      tweetId: id,
    });
    const data = {
      name: tweet!.data!.user!.legacy.name,
      id: tweet!.data!.user!.legacy.screenName,
      icon: tweet.data!.user.legacy.profileImageUrlHttps,
      text: tweet.data!.tweet.legacy!.fullText,
    };

    const svg = await satori(Normal(data), this.option);
    return new TwitterSnapWriter({
      width: this.width,
      height: this.height,
      svg: svg,
    });
  };
}

type TwitterSnapWriterParams = {
  width: number;
  height: number;
  svg: string;
};

export class TwitterSnapWriter {
  width!: number;
  height!: number;
  data!: string;
  _trasformer: Transformer | undefined;

  constructor(param: TwitterSnapWriterParams) {
    this.width = param.width;
    this.height = param.height;
    this.data = param.svg;
  }

  get trasformer() {
    if (!this._trasformer) {
      this._trasformer = Transformer.fromSvg(this.data);
      this._trasformer.crop(0, 0, this.width, this.height);
    }
    return this._trasformer;
  }

  save = async (output: string) => {
    const ext = output.split(".").pop();
    const exts: {
      [key: string]: (output: string) => Promise<void>;
    } = {
      raw: this.raw,
      svg: this.svg,
      png: this.png,
      jpeg: this.jpeg,
      jpg: this.jpeg,
      jpe: this.jpeg,
      bmp: this.bmp,
      dib: this.bmp,
      rle: this.bmp,
      "2bp": this.bmp,
      "2pbb": this.bmp,
      ico: this.ico,
      cur: this.ico,
      tif: this.tiff,
      webp: this.webp,
      avif: this.avif,
      pnm: this.pnm,
      tga: this.tga,
      tpic: this.tga,
      ff: this.farbfeld,
    };
    const method = exts[ext!];
    if (!method) {
      throw new Error("Unsupported file format");
    }
    await method(output);
  };

  svg = async (output: string) => {
    await fs.promises.writeFile(output, this.data);
  };
  raw = async (output: string) => {
    await fs.promises.writeFile(output, this.data);
  };
  jpeg = async (output: string) => {
    const data = await this.trasformer.jpeg();
    await fs.promises.writeFile(output, data);
  };

  png = async (output: string) => {
    const data = await this.trasformer.png();
    await fs.promises.writeFile(output, data);
  };

  bmp = async (output: string) => {
    const data = await this.trasformer.bmp();
    await fs.promises.writeFile(output, data);
  };

  ico = async (output: string) => {
    const data = await this.trasformer.ico();
    await fs.promises.writeFile(output, data);
  };
  tiff = async (output: string) => {
    const data = await this.trasformer.tiff();
    await fs.promises.writeFile(output, data);
  };
  webp = async (output: string) => {
    const data = await this.trasformer.webp();
    await fs.promises.writeFile(output, data);
  };
  avif = async (output: string) => {
    const data = await this.trasformer.avif();
    await fs.promises.writeFile(output, data);
  };
  pnm = async (output: string) => {
    const data = await this.trasformer.pnm();
    await fs.promises.writeFile(output, data);
  };
  tga = async (output: string) => {
    const data = await this.trasformer.tga();
    await fs.promises.writeFile(output, data);
  };
  farbfeld = async (output: string) => {
    const data = await this.trasformer.farbfeld();
    await fs.promises.writeFile(output, data);
  };
}
