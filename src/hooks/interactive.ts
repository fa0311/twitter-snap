import {cancel, intro, isCancel, outro, select, text} from '@clack/prompts'
import type {Hook} from '@oclif/core'
import clc from 'cli-color'
import Default, {DefaultCommandType} from '../commands/index.js'

const nonEmptyValidation = (input: string) => {
  if (input.trim().length < 1) {
    return 'Please enter a value'
  }
}

const numberValidation = (input: string) => {
  if (isNaN(Number(input))) {
    return 'Please enter a number'
  }
}

const drop = <T extends string>(value: unknown): value is DefaultCommandType['flags'][T] => {
  return !isCancel(value)
}

const hook: Hook.Preparse = async ({argv, options, context}) => {
  const interactive = argv.some((arg) => ['-i', '--interactive'].includes(arg))
  const flags = options.flags as typeof Default.flags
  if (interactive) {
    intro('Twitter Snap Interactive Mode')
    const needLine = flags.theme.options!.length + 4
    if (process.stdout.rows < needLine) {
      cancel(`Please resize your terminal window to at least ${needLine} lines`)
      return process.exit(0)
    }

    const newArgs: string[] = ['']

    const login = await select({
      message: 'Please select a login method',
      options: [
        {value: 'guest', label: 'No login'},
        {value: 'browser', label: 'Login with a browser (recommended)', hint: '--session-type browser'},
        {value: 'file', label: 'Login with a cookies file', hint: '--session-type file'},
      ],
    })
    if (!drop<'sessionType'>(login)) {
      cancel('Operation canceled')
      return process.exit(0)
    }
    newArgs.push('--session-type', login)

    if (login === 'file') {
      const cookiesFile = await text({
        message: 'Please enter the path to the cookies file',
        placeholder: 'cookies.json',
        validate: nonEmptyValidation,
      })

      if (!drop<'cookiesFile'>(cookiesFile)) {
        cancel('Operation canceled')
        return process.exit(0)
      }
      newArgs.push('--cookies-file', cookiesFile)
    }

    const url = await text({
      message: 'Please enter the URL or ID of the tweet you want to snap',
      placeholder: 'https://twitter.com/elonmusk/status/1349129669258448897',
      validate: nonEmptyValidation,
    })

    if (isCancel(url)) {
      cancel('Operation canceled')
      return process.exit(0)
    }
    newArgs[0] = url

    if (!url.startsWith('http')) {
      const api = await select({
        message: 'Please select an API',
        options: flags.api.options!.map((e) => ({value: e, label: e, hint: `--api ${e}`})),
      })
      if (!drop<'api'>(api)) {
        cancel('Operation canceled')
        return process.exit(0)
      }
      newArgs.push('--api', api)
    }

    const theme = await select({
      message: 'Please select a theme',
      options: flags.theme.options!.map((e) => ({value: e, label: e, hint: `--theme ${e}`})),
    })
    if (!drop<'theme'>(theme)) {
      cancel('Operation canceled')
      return process.exit(0)
    }
    newArgs.push('--theme', theme)

    const output = await text({
      message: 'Please enter the output destination, Do not include the extension',
      initialValue: 'output/{id}',
      validate: nonEmptyValidation,
    })
    if (isCancel(output)) {
      cancel('Operation canceled')
      return process.exit(0)
    }

    const outputExt = await (async () => {
      if (theme === 'Json') {
        return '.json'
      } else if (theme === 'MediaOnly') {
        return ''
      } else if (theme === 'RenderMakeItAQuote') {
        return '.png'
      } else {
        const ext = await select({
          message: 'Please select the output format',
          options: [
            {value: '.{if-photo:png:mp4}', label: 'default (mp4/png)', hint: `${output}.{if-photo:png:mp4}`},
            {value: '.png', label: 'image only (png)', hint: `${output}.png`},
            {value: 'other1', label: 'Custom with fallback'},
            {value: 'other2', label: 'Custom without fallback'},
          ],
        })
        if (isCancel(ext)) {
          cancel('Operation canceled')
          return process.exit(0)
        }
        if (ext == 'other1' || ext == 'other2') {
          const extInput = await text({
            message: 'Please enter the output extension',
            placeholder: 'webm',
            validate: nonEmptyValidation,
          })
          if (isCancel(extInput)) {
            cancel('Operation canceled')
            return process.exit(0)
          }
          if (ext == 'other1') {
            return `.{if-photo:png:${extInput}}`
          } else {
            return `.${extInput}`
          }
        } else {
          return ext as string
        }
      }
    })()
    newArgs.push('--output', `${output}${outputExt}`)

    const limit = await text({
      message: 'Please enter the number of tweets to snap',
      initialValue: '30',
      validate: numberValidation,
    })
    if (isCancel(limit)) {
      cancel('Operation canceled')
      return process.exit(0)
    }
    newArgs.push('--limit', limit)

    if (theme !== 'Json' && theme !== 'MediaOnly') {
      const width = await text({
        message: 'Please enter the width of the image',
        initialValue: '650',
        validate: numberValidation,
      })

      if (isCancel(width)) {
        cancel('Operation canceled')
        return process.exit(0)
      }
      newArgs.push('--width', width)

      const scale = await text({
        message: 'Please enter the scale of the image',
        initialValue: '1',
        validate: numberValidation,
      })

      if (isCancel(scale)) {
        cancel('Operation canceled')
        return process.exit(0)
      }

      newArgs.push('--scale', scale)

      outro(clc.cyanBright(newArgs.join(' ')))
      return newArgs
    }
  }

  return argv
}
export default hook
