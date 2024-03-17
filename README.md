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

## Arguments

```shell
$ bin/run --help
Create beautiful Tweet images fast

USAGE
  $ twitter-snap  ID [--api
    getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTweetsAndReplies|getUserMedia|getLikes|ge
    tBookmarks] [--theme RenderBasic] [-o <value>] [--cleanup] [--limit <value>] [--debug] [--sleep <value>] [--session_type <value>] [--cookies_file <value>] [--browser_profile <value>]
    [--browser_headless]

ARGUMENTS
  ID  Twitter status id

FLAGS
  -o, --output=<value>           [default: {id}.{if-photo:png:mp4}] Output file name
      --api=<option>             [default: getTweetResultByRestId] API type
                                 <options: getTweetResultByRestId|getTweetDetail|getSearchTimeline|getHomeTimeline|getHomeLatestTimeline|getListLatestTweetsTimeline|getUserTweets|getUserTw
                                 eetsAndReplies|getUserMedia|getLikes|getBookmarks>
      --browser_headless         Browser headless
      --browser_profile=<value>  [default: C:\Users\yuki/.cache/twitter-snap/profiles] Browser profile
      --cleanup                  Cleanup
      --cookies_file=<value>     [default: cookies.json] Cookies file
      --debug                    Debug
      --limit=<value>              [default: 30] Limit count
      --session_type=<value>     [default: guest] Session type
      --sleep=<value>            Sleep (ms)
      --theme=<option>           [default: RenderBasic] Theme type
                                 <options: RenderBasic>

DESCRIPTION
  Create beautiful Tweet images fast
  https://github.com/fa0311/twitter-snap

EXAMPLES
  $ twitter-snap 1765415187161464972

  $ twitter-snap 1765415187161464972 --session_type browser

  $ twitter-snap 1765415187161464972 --session_type file --cookies_file cookies.json

  $ twitter-snap 44196397 --api getUserTweets --limit 10

  $ twitter-snap 44196397 --api getUserTweets --output "data/{user-screen-name}/{id}.{if-photo:png:mp4}"
```

## Dependence

- [ffmpeg](https://ffmpeg.org/) (for video)
