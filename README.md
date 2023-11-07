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
Usage: twitter-snap [options] <string>

Arguments:
  string                 tweet url or tweet id

Options:
  -V, --version          output the version number
  -o, --output <path>    output file path (default: "output.png")
  -w, --width <number>   image width (default: "600")
  -h, --height <number>  image height
  -t, --theme <string>   theme (default: "normal")
  --fonts <path>         font config file path .json
  --emoji <string>       emoji type (twemoji,openmoji,blobmoji,noto,fluent,fluentFlat) (default: "twemoji")
  --cookies <path>       net escape cookie file path .txt
  --help                 display help for command
```

### Fonts

You can specify the font by creating a font config file. (path: `--fonts`)

```json
[
    {
        "data": "NotoSansJP-Regular.ttf",
        "name": "Noto Sans JP",
        "weight": 400,
        "theme": "normal",
        "lang": "ja-JP"
    },
    {
        "data": "NotoSansJP-Bold.ttf",
        "name": "Noto Sans JP",
        "weight": 700,
        "theme": "normal",
        "lang": "ja-JP"
    }
]
```
