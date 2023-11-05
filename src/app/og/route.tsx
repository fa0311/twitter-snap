import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { TwitterSnap } from "./../../core/twitterSnap";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("text");
  if (!id) {
    return new Response("Missing text", { status: 400 });
  }

  const twitterSnap = new TwitterSnap({
    width: 600,
  });
  return await twitterSnap.render({ id });
}
