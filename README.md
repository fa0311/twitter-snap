# twitter-snap

Create beautiful Tweet images fast.
Fast, good design, Browser is not a dependency.

```shell
npx twitter-snap@latest https://twitter.com/elonmusk/status/1770222178279252062
```

<p float="left">
  <img src="./docs/img/output-1.png" width="49%" />
  <img src="./docs/img/output-2.png" width="49%" /> 
  <img src="./docs/img/output-3.png" width="49%" />
  <img src="./docs/img/output-4.png" width="49%" />
</p>

## Install

`npm -g i twitter-snap@latest`

## Arguments

```shell
$ twitter-snap --help
Create beautiful Tweet images fast

USAGE
  $ twitter-snap  ID [--api getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTweetsAndReplies|getUserMedia|getLikes|getBookmarks]
    [--browserHeadless] [--browserProfile <value>] [--cookiesFile <value>] [--debug] [--ffmpegAdditonalOption <value>] [--ffmpegPath <value>] [--ffprobePath <value>] [--fontPath <value>] [--limit <value>] [--noCleanup] [-o <value>] [--sessionType
    <value>] [--simpleLog] [--sleep <value>] [--theme RenderOceanBlueColor|RenderOceanBlueDarkColor|RenderSunsetGardenColor|RenderSunsetGardenDarkColor|RenderDawnBlossomColor|RenderDawnBlossomDarkColor|RenderFierySunsetColor|RenderFierySunsetDarkColor|R
    enderTwilightSkyColor|RenderTwilightSkyDarkColor|RenderPlainColor|RenderPlainDarkColor|RenderTransparent|RenderTransparentDark|RenderTransparentShadow|RenderTransparentDarkShadow|RenderMakeItAQuote] [--width <value>]

ARGUMENTS
  ID  Twitter status id

FLAGS
  -o, --output=<value>                 [default: {id}.{if-photo:png:mp4}] Output file name
      --api=<option>                   [default: getTweetResultByRestId] API type
                                       <options: getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTweetsAndReplies|getUserMedia|getLikes|getBookmarks>
      --browserHeadless                Browser headless
      --browserProfile=<value>         [default: /workspaces/twitter-snap/.cache/twitter-snap/profiles] Browser profile
      --cookiesFile=<value>            [default: cookies.json] Cookies file
      --debug                          Debug
      --ffmpegAdditonalOption=<value>  FFmpeg additonal option
      --ffmpegPath=<value>             [default: ffmpeg] FFmpeg path
      --ffprobePath=<value>            [default: ffprobe] FFprobe path
      --fontPath=<value>               [default: /workspaces/twitter-snap/.cache/twitter-snap/fonts] Font path
      --limit=<value>                  [default: 30] Limit count
      --noCleanup                      Cleanup
      --sessionType=<value>            [default: guest] Session type
      --simpleLog                      Simple log
      --sleep=<value>                  Sleep (ms)
      --theme=<option>                 [default: RenderOceanBlueColor] Theme type
                                       <options: RenderOceanBlueColor|RenderOceanBlueDarkColor|RenderSunsetGardenColor|RenderSunsetGardenDarkColor|RenderDawnBlossomColor|RenderDawnBlossomDarkColor|RenderFierySunsetColor|RenderFierySunsetDarkColor|Render
                                       TwilightSkyColor|RenderTwilightSkyDarkColor|RenderPlainColor|RenderPlainDarkColor|RenderTransparent|RenderTransparentDark|RenderTransparentShadow|RenderTransparentDarkShadow|RenderMakeItAQuote>
      --width=<value>                  [default: 650] Width

DESCRIPTION
  Create beautiful Tweet images fast
  https://github.com/fa0311/twitter-snap

EXAMPLES
  Create a snap from tweet id with minimal commands.

    $ twitter-snap 1349129669258448897

  Create a snap using the RenderMakeItAQuote theme.

    $ twitter-snap 1349129669258448897 --theme RenderMakeItAQuote

  Create a snap using the browser session.

    $ twitter-snap 1349129669258448897 --session-type browser

  Create a snap using the file session.

    $ twitter-snap 1349129669258448897 --session-type file --cookies-file cookies.json

  Create snaps of 10 tweets from a user ID for that user.

    $ twitter-snap 44196397 --api getUserTweets --limit 10

  Create snaps from a user profile URL.

    $ twitter-snap https://twitter.com/elonmusk

  Create a snap from a tweet URL.

    $ twitter-snap https://twitter.com/elonmusk/status/1349129669258448897

  Create snaps from a user ID and save them with the count number.

    $ twitter-snap 44196397 --api getUserTweets -o "{user-screen-name}/{count}.png"

  Create snaps from a user ID and save them in a data folder.

    $ twitter-snap 44196397 --api getUserTweets -o "data/{user-screen-name}/{id}.{if-photo:png:mp4}"

  Create snaps from a user ID and save them with the tweet date.

    $ twitter-snap 44196397 --api getUserTweets -o "{time-tweet-yyyy}-{time-tweet-mm}-{time-tweet-dd}/{id}.png"
```

## Dependence

- [ffmpeg](https://ffmpeg.org/) (for video)
