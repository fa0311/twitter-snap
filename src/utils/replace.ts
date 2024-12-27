import {FilePath} from './path.js'

export type FileReplace = [string, number | string | undefined]

const if2 = (e: string) => {
  return `{${e}:(?<a>[^{}]*?):(?<b>[^{}]*?)}`
}

const if4 = (e: string) => {
  return `{${e}:(?<a>[^{}]*?):(?<b>[^{}]*?):(?<c>[^{}]*?):(?<d>[^{}]*?)}`
}

export const getName = (
  type: 'image' | 'json' | 'media' | 'video',
  placeholder: FileReplace[],
  output: string,
  count: number,
) => {
  const all = () => {
    return [
      [if2('if-photo'), type === 'image' ? '$1' : '$2'],
      [if2('if-video'), type === 'video' ? '$1' : '$2'],
      [if2('if-json'), type === 'json' ? '$1' : '$2'],
      [if2('if-media'), type === 'media' ? '$1' : '$2'],
      [if4('if-type'), type === 'image' ? '$1' : type === 'video' ? '$2' : type === 'json' ? '$3' : '$4'],
      ['{time-now-yyyy}', new Date().getFullYear().toString().padStart(4, '0')],
      ['{time-now-mm}', (new Date().getMonth() + 1).toString().padStart(2, '0')],
      ['{time-now-dd}', new Date().getDate().toString().padStart(2, '0')],
      ['{time-now-hh}', new Date().getHours().toString().padStart(2, '0')],
      ['{time-now-mi}', new Date().getMinutes().toString().padStart(2, '0')],
      ['{time-now-ss}', new Date().getSeconds().toString().padStart(2, '0')],
      ['{count}', count.toString()],
      ['{stdout}', 'stdout_is_not_supported_in_this_theme'],
    ] as FileReplace[]
  }

  const last = () => {
    return [
      ['--curly-brace-open--', '{'],
      ['--curly-brace-close--', '}'],
    ] as FileReplace[]
  }

  const replaceData = [...all(), ...placeholder]
  const s = (e: FileReplace[1]) => (e === undefined ? '' : e.toString())
  const list = ['', output]
  while (list.at(-1) !== list.at(-2)) {
    while (list.at(-1) !== list.at(-2)) {
      list.push(replaceData.reduce((acc, [k, v]) => acc.replaceAll(new RegExp(k, 'g'), s(v)), list.at(-1)!))
    }

    list.push(list.at(-1)!.replaceAll(/{[^{}]*?}/g, ''))
  }

  return FilePath.from(last().reduce((acc, [k, v]) => acc.replaceAll(new RegExp(k, 'g'), s(v)), list.at(-1)!))
}
