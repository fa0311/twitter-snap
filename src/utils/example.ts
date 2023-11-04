import { buildTweetApiUtils } from "twitter-openapi-typescript/dist/src/utils";
import { TweetResultByRestIdResponse } from "twitter-openapi-typescript-generated";
import { TweetResultByRestIdResponseFromJSONTyped } from "twitter-openapi-typescript-generated/dist/models/TweetResultByRestIdResponse";

const example = async () => {
  const response: TweetResultByRestIdResponse = await fetch(
    "./../sample/sample1.json"
  ).then((res) => res.json());
  const value = TweetResultByRestIdResponseFromJSONTyped(response, true);
  const data = buildTweetApiUtils({ result: value.data.tweetResult });
  return data!;
};

export default example;
