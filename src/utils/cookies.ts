import { promises as fs } from "fs";
import { TwitterOpenApi } from "twitter-openapi-typescript";

export const getClient = async (path: string) => {
  const raw = await fs.readFile(path, "utf-8");

  const line = raw.split("\n");
  const row = line.map((l) => l.split("\t"));
  const cookies = row
    .filter(([domain]) => domain.endsWith("twitter.com"))
    .reduce(
      (acc, [, , , , , name, value]) => ({
        ...acc,
        [name]: value,
      }),
      {} as { [key: string]: string }
    );

  return new TwitterOpenApi().getClientFromCookies(cookies);
};
