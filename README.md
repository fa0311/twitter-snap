# twitter-snap

Create beautiful Tweet images fast.
Fast, good design, Browser is not a dependency.

```shell
npx twitter-snap https://twitter.com/elonmusk/status/1518623997054918657
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

### Font

You can specify the font by creating a font config file.

```json
[
  {
    "data": "./fonts/NotoSansJP-Regular.otf",
    "name": "Noto Sans JP",
    "weight": 400,
    "theme": "normal",
    "lang": "ja-JP"
  }
]
```
