# twitter-snap

Create beautiful Tweet images fast.
Fast, good design, Browser is not a dependency.

```shell
npx twitter-snap@latest https://twitter.com/elonmusk/status/15186239970549186570
```

```shell
npx twitter-snap 1518623997054918657
```

![image](./docs/img/output.png)

## Install

`npm -g i twitter-snap@latest`

## Arguments

```shell
$ bin/run --help
Create beautiful Tweet images fast

USAGE
  $ twitter-snap  ID [--api getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTweetsAndReplies|getUserMedia|getLikes|getBookmarks] [--browserHeadless] [--browserProfile <value>] [--cookiesFile
    <value>] [--debug] [--limit <value>] [--noCleanup] [-o <value>] [--sessionType <value>] [--simpleLog] [--sleep <value>] [--theme RenderBasic] [--ffmpegAdditonalOption <value>] [--ffmpegPath <value>] [--ffprobePath <value>]

ARGUMENTS
  ID  Twitter status id

FLAGS
  -o, --output=<value>                 [default: {id}.{if-photo:png:mp4}] Output file name
      --api=<option>                   [default: getTweetResultByRestId] API type
                                       <options: getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTweetsAndReplies|getUserMedia|getLikes|getBookmarks>
      --browserHeadless                Browser headless
      --browserProfile=<value>         [default: C:\Users\yuki/.cache/twitter-snap/profiles] Browser profile
      --cookiesFile=<value>            [default: cookies.json] Cookies file
      --debug                          Debug
      --ffmpegAdditonalOption=<value>  FFmpeg additonal option
      --ffmpegPath=<value>             [default: ffmpeg] FFmpeg path
      --ffprobePath=<value>            [default: ffprobe] FFprobe path
      --limit=<value>                  [default: 30] Limit count
      --noCleanup                      Cleanup
      --sessionType=<value>            [default: guest] Session type
      --simpleLog                      Simple log
      --sleep=<value>                  Sleep (ms)
      --theme=<option>                 [default: RenderBasic] Theme type
                                       <options: RenderBasic>

DESCRIPTION
  Create beautiful Tweet images fast
  https://github.com/fa0311/twitter-snap

EXAMPLES
  $ twitter-snap 1349129669258448897

  $ twitter-snap 1349129669258448897 --session-type browser

  $ twitter-snap 1349129669258448897 --session-type file --cookies-file cookies.json

  $ twitter-snap 44196397 --api getUserTweets --limit 10

  $ twitter-snap 44196397 --api getUserTweets -o "data/{user-screen-name}/{id}.{if-photo:png:mp4}"

  $ twitter-snap https://twitter.com/elonmusk

  $ twitter-snap https://twitter.com/elonmusk/status/1349129669258448897

  $ twitter-snap 44196397 --api getUserTweets -o "{user-screen-name}/{count}.png"

  $ twitter-snap 44196397 --api getUserTweets -o "{time-tweet-yyyy}-{time-tweet-mm}-{time-tweet-dd}/{id}.png"
```

## Dependence

- [ffmpeg](https://ffmpeg.org/) (for video)
