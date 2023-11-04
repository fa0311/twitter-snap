# twitter-snap

Create beautiful Tweet images fast.
Fast, good design, Browser is not a dependency.

```shell
npx twitter-snap https://twitter.com/elonmusk/status/1518623997054918657 -h 200
```

![image](./docs/img/output.png)

```shell
Usage: twitter-snap [options] <string>

Arguments:
  string                 tweet url or tweet id

Options:
  -V, --version          output the version number
  -o, --output <path>    output file path (default: "output.png")
  -w, --width <number>   image width (default: "600")
  -h, --height <number>  image height (default: "400")
  --font <path>          font path (default: "assets/NotoSansCJKjp-Regular.otf")
  --bold-font <path>     bold font path (default: "assets/NotoSansCJKjp-Bold.otf")
  --help                 display help for command
```
