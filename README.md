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
  $ twitter-snap  ID [--api getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTweetsAndReplies|getUserMedia|getLikes|getBookmarks] [--browserHeadless] [--browserProfile <value>] [--cookiesFile <value>] [--debug] [--ffmpegAdditonalOption <value>] [--ffmpegPath <value>] [--ffprobePath <value>] [--fontPath <value>] [--limit <value>] [--noCleanup] [-o <value>] [--sessionType <value>] [--simpleLog] [--sleep <value>] [--theme RenderOceanBlueColor|RenderOceanBlueDarkColor|RenderSunsetGardenColor|RenderSunsetGardenDarkColor|RenderDawnBlossomColor|RenderDawnBlossomDarkColor|RenderFierySunsetColor|RenderFierySunsetDarkColor|RenderTwilightSkyColor|RenderTwilightSkyDarkColor|RenderPlainColor|RenderPlainDarkColor|RenderTransparent|RenderTransparentDark|RenderTransparentShadow|RenderTransparentDarkShadow|RenderMakeItAQuote] [--width <value>] [--scale <value>]

ARGUMENTS
  ID  Twitter status id

FLAGS
  -o, --output=<value>
      [default: {id}.{if-photo:png:mp4}] Output file name

  --api=<option>
      [default: getTweetResultByRestId] API type
      <options: getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTim
      eline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUse
      rTweetsAndReplies|getUserMedia|getLikes|getBookmarks>

  --browserHeadless
      Browser headless

  --browserProfile=<value>
      [default: ~/.cache/twitter-snap/profiles] Browser profile

  --cookiesFile=<value>
      [default: cookies.json] Cookies file

  --debug
      Debug

  --ffmpegAdditonalOption=<value>
      FFmpeg additonal option

  --ffmpegPath=<value>
      [default: ffmpeg] FFmpeg path

  --ffprobePath=<value>
      [default: ffprobe] FFprobe path

  --fontPath=<value>
      [default: ~/.cache/twitter-snap/fonts] Font path

  --limit=<value>
      [default: 30] Limit count

  --noCleanup
      Cleanup

  --scale=<value>
      [default: 1] Scale

  --sessionType=<value>
      [default: guest] Session type

  --simpleLog
      Simple log

  --sleep=<value>
      Sleep (ms)

  --theme=<option>
      [default: RenderOceanBlueColor] Theme type
      <options: RenderOceanBlueColor|RenderOceanBlueDarkColor|RenderSunsetGardenCo
      lor|RenderSunsetGardenDarkColor|RenderDawnBlossomColor|RenderDawnBlossomDark
      Color|RenderFierySunsetColor|RenderFierySunsetDarkColor|RenderTwilightSkyCol
      or|RenderTwilightSkyDarkColor|RenderPlainColor|RenderPlainDarkColor|RenderTr
      ansparent|RenderTransparentDark|RenderTransparentShadow|RenderTransparentDar
      kShadow|RenderMakeItAQuote>

  --width=<value>
      [default: 650] Width

DESCRIPTION
  Create beautiful Tweet images fast
  https://github.com/fa0311/twitter-snap

EXAMPLES
  Create a snap from tweet id with minimal commands.

    $ twitter-snap https://twitter.com/elonmusk/status/1349129669258448897

  Create a snap using the RenderMakeItAQuote theme.

    $ twitter-snap --interactive
```

## Dependence

- [ffmpeg](https://ffmpeg.org/) (for video)
