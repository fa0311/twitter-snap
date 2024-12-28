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

[More Samples](https://github.com/fa0311/twitter-snap/issues/47)

```shell
# Interactive mode
npx twitter-snap@latest -i
```

<img src="./docs/img/input-1.png" width="49%" />

---

```shell
# Login with cookies
npx twitter-snap@latest https://twitter.com/elonmusk/status/1349129669258448897 --session-type file --cookies-file cookies.json
# Login with puppeteer
npx twitter-snap@latest https://twitter.com/elonmusk/status/1349129669258448897 --session-type browser

# Output the API response directly to a file in raw JSON format.
npx twitter-snap@latest --theme Json https://x.com/elonmusk/status/1349129669258448897 -o output/data.json
# Download the media file and save it directly to a file in its raw format.
npx twitter-snap@latest --theme Media https://x.com/elonmusk/status/1349129669258448897 -o output/{count}
# Use chatgpt to summarize the data in this tweet.
npx twitter-snap@latest --theme LiteJson -o {stdout} https://x.com/elonmusk | chatgpt -p 'Summarize the data in this tweet.'
```

## Install

`npm -g i twitter-snap@latest`

## Docker

```shell
docker run -it --rm -v $(pwd)/output:/app/output ghcr.io/fa0311/twitter-snap/twitter-snap-docker:latest https://x.com/elonmusk/status/1349129669258448897
```

```shell
docker run -it --rm -v $(pwd)/output:/app/output -v $(pwd)/cookies.json:/app/cookies.json twitter-snap https://x.com/elonmusk/status/1349129669258448897 --session-type file
```

`--session-type=browser` is not supported.

`GPU` is not supported.

# Use as a package

```shell
npm i twitter-snap
```

```typescript
const snap = getSnapAppRender({url: 'https://x.com/elonmusk/status/1349129669258448897'})
const font = await snap.getFont()
const session = await snap.login({sessionType: 'guest'})
const render = await snap.getRender({limit: 1, session})

await snap.run(render, async (run) => {
  const res = await run({
    width: 650,
    theme: 'RenderOceanBlueColor',
    font,
    output: 'temp/{id}-{count}.{if-type:png:mp4:json:}',
  })
  await res.file.tempCleanup()
})
```

Also, if you use advanced customization, please use [twitter-snap-core](https://github.com/fa0311/twitter-snap-core).

# Usage

<!-- COMMANDS_PLACEHOLDER_START -->

```shell
$ node bin/run.js --help
Create beautiful Tweet images fast

USAGE
  $ twitter-snap  URL [--browserHeadless] [--browserProfile
    <value>] [--cookiesFile <value>] [--debug] [--interactive]
    [--ffmpegAdditonalOption <value>] [--ffmpegPath <value>] [--ffprobePath
    <value>] [--fontPath <value>] [--limit <value>] [--noCleanup] [-o <value>]
    [--sessionType browser|file|guest] [--simpleLog] [--sleep <value>] [--theme
    RenderOceanBlueColor|RenderOceanBlueDarkColor|RenderSunsetGardenColor|Render
    SunsetGardenDarkColor|RenderDawnBlossomColor|RenderDawnBlossomDarkColor|Rend
    erFierySunsetColor|RenderFierySunsetDarkColor|RenderTwilightSkyColor|RenderT
    wilightSkyDarkColor|RenderPlainColor|RenderPlainDarkColor|RenderTransparent|
    RenderTransparentDark|RenderTransparentShadow|RenderTransparentShadowDark|Js
    on|LiteJson|Media|RenderMakeItAQuote] [--width <value>] [--scale <value>]

ARGUMENTS
  URL  Twitter url

FLAGS
  -o, --output=<value>
      [default: {if-media:{id}-{media-id}:{id}}.{if-type:png:mp4:json:}] Output
      file name

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

  --interactive
      Enable interactive mode

  --limit=<value>
      [default: 20] Limit count

  --noCleanup
      Cleanup

  --scale=<value>
      [default: 1] Scale

  --sessionType=<option>
      [default: guest] Session type
      <options: browser|file|guest>

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
      ansparent|RenderTransparentDark|RenderTransparentShadow|RenderTransparentSha
      dowDark|Json|LiteJson|Media|RenderMakeItAQuote>

  --width=<value>
      [default: 650] Width

DESCRIPTION
  Create beautiful Tweet images fast
  https://github.com/fa0311/twitter-snap

EXAMPLES
  Create a snap from tweet id with minimal commands.

    $ twitter-snap https://twitter.com/elonmusk/status/1349129669258448897

  Enable interactive mode.

    $ twitter-snap --interactive


```

<!-- COMMANDS_PLACEHOLDER_END -->

## Dependence

- [ffmpeg](https://ffmpeg.org/) (for video)
