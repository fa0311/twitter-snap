import type {Hook} from '@oclif/core'

import {cancel, intro, isCancel, note, outro, select, text} from '@clack/prompts'
import clc from 'cli-color'

import {DefaultCommandType} from '../commands/index.js'
import {themeList} from '../config.js'

const nonEmptyValidation = (input: string) => {
  if (input.trim().length === 0) {
    return 'Please enter a value'
  }
}

const numberValidation = (input: string) => {
  if (Number.isNaN(Number(input))) {
    return 'Please enter a number'
  }
}

const drop = <T extends string>(value: unknown): value is DefaultCommandType['flags'][T] => {
  return !isCancel(value)
}

const exit = (message: string, context: Parameters<Hook<any>>[0]['context']) => {
  cancel(message)
  console.error = () => {}
  context?.exit(1)
  return message
}

const hook: Hook.Preparse = async ({argv, options, context}) => {
  const interactive = argv.some((arg) => ['--interactive', '-i'].includes(arg))
  if (interactive) {
    intro('Twitter Snap Interactive Mode')
    const needLine = Object.keys(themeList).length + 4
    if (process.stdout.rows < needLine) {
      throw exit(`Please resize your terminal window to at least ${needLine} lines`, context)
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
      throw exit('Operation canceled', context)
    }

    newArgs.push('--session-type', login)

    if (login === 'file') {
      const cookiesFile = await text({
        message: 'Please enter the path to the cookies file',
        placeholder: 'cookies.json',
        validate: nonEmptyValidation,
      })

      if (!drop<'cookiesFile'>(cookiesFile)) {
        throw exit('Operation canceled', context)
      }

      newArgs.push('--cookies-file', cookiesFile)
    } else if (login === 'guest') {
      note('In guest mode, you can only use a limited number of features.')
    }

    const url = await text({
      message: 'Please enter the URL of the web page',
      placeholder: 'https://twitter.com/elonmusk/status/1349129669258448897',
      validate: nonEmptyValidation,
    })

    if (isCancel(url)) {
      throw exit('Operation canceled', context)
    }

    newArgs[0] = url

    const theme = await select({
      message: 'Please select a theme',
      options: Object.keys(themeList).map((e) => ({value: e, label: e, hint: `--theme ${e}`})),
    })
    if (!drop<'theme'>(theme)) {
      throw exit('Operation canceled', context)
    }

    newArgs.push('--theme', theme)

    const stdout = await (async () => {
      if (themeList[theme] === 'json') {
        const stdout = await select({
          message: 'Please select the output destination',
          options: [
            {value: 'stdout', label: 'stdout'},
            {value: 'file', label: 'file'},
          ],
        })
        if (!drop<'output'>(stdout)) {
          throw exit('Operation canceled', context)
        }

        return stdout === 'stdout'
      } else {
        return false
      }
    })()

    if (stdout) {
      newArgs.push('--output', '{stdout}')
    } else {
      const output = await text({
        message: 'Please enter the output destination, Do not include the extension',
        initialValue: '{id}-{count}',
        validate: nonEmptyValidation,
      })
      if (isCancel(output)) {
        throw exit('Operation canceled', context)
      }

      const outputExt = await (async () => {
        switch (themeList[theme]) {
          case 'json': {
            return '.json'
          }

          case 'other': {
            return ''
          }

          case 'element': {
            const ext = await select({
              message: 'Please select the output format',
              options: [
                {value: '.{if-photo:png:mp4}', label: 'default (mp4/png)', hint: `${output}.{if-photo:png:mp4}`},
                {value: '.png', label: 'image only (png)', hint: `${output}.png`},
                {value: 'custom with fallback', label: 'Custom with fallback to png'},
                {value: 'custom', label: 'Custom manual entry'},
              ],
            })
            if (isCancel(ext)) {
              throw exit('Operation canceled', context)
            }

            if (ext === 'custom' || ext === 'custom with fallback') {
              const extInput = await text({
                message: 'Please enter the output extension',
                placeholder: 'webm',
                validate: nonEmptyValidation,
              })
              if (isCancel(extInput)) {
                throw exit('Operation canceled', context)
              }

              return ext === 'custom with fallback' ? `.{if-photo:png:${extInput}}` : `.${extInput}`
            } else {
              return ext as string
            }
          }
        }
      })()
      newArgs.push('--output', `${output}${outputExt}`)
    }

    const limit = await text({
      message: 'Please enter the number of tweets to snap',
      initialValue: '30',
      validate: numberValidation,
    })
    if (isCancel(limit)) {
      throw exit('Operation canceled', context)
    }

    newArgs.push('--limit', limit)

    if (theme !== 'Json' && theme !== 'Media') {
      const width = await text({
        message: 'Please enter the width of the image',
        initialValue: '650',
        validate: numberValidation,
      })

      if (isCancel(width)) {
        throw exit('Operation canceled', context)
      }

      newArgs.push('--width', width)

      const scale = await text({
        message: 'Please enter the scale of the image',
        initialValue: '1',
        validate: numberValidation,
      })

      if (isCancel(scale)) {
        throw exit('Operation canceled', context)
      }

      newArgs.push('--scale', scale)
    }

    outro(clc.cyanBright([options.context?.config.bin, ...newArgs].join(' ')))
    return newArgs
  }

  return argv
}

export default hook
