import { ImageResponseOptions } from "@vercel/og/dist/types";
import { promises as fs } from "fs";

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type Fonttheme = "normal" | "italic";
interface FontOptions {
  data: string;
  name: string;
  weight?: Weight;
  theme?: Fonttheme;
  lang?: string;
}

type Fonts = ImageResponseOptions["fonts"];

export const getFonts = async (path: string): Promise<Fonts> => {
  const raw = await fs.readFile(path, "utf-8");
  const fonts: FontOptions[] = JSON.parse(raw);
  return await Promise.all(
    fonts.map(async (font) => {
      const data = await fs.readFile(font.data);
      return {
        ...font,
        data: data,
      };
    })
  );
};
