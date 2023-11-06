import { NextRequest } from "next/server";
import { TwitterOpenApi } from "twitter-openapi-typescript";

const guest = new TwitterOpenApi().getGuestClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const client = await guest;
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }
  const tweet = await client.getDefaultApi().getTweetResultByRestId({
    tweetId: id,
  });
  return new Response(JSON.stringify(tweet), {
    headers: {
      "content-type": "application/json",
    },
  });
}
