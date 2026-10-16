import os from 'node:os'
import {sep} from 'node:path'
import {describe, expect, it} from 'vitest'

import {type Cookie, SnapAppCookies} from '../../src/utils/cookies.js'
import {DirectoryPath, FilePath, URLPath} from '../../src/utils/path.js'

describe('Utils test', () => {
  it('cookies', async () => {
    const cookies: Cookie[] = [
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie2', value: 'value2', domain: 'example.com'},
      {name: 'cookie3', value: 'value3', domain: '.example.com'},
      {name: 'cookie4', value: 'value4', domain: 'sub.example.com'},
      {name: 'cookie5', value: 'value5', domain: 'example.net'},
    ]

    const snapAppCookies = new SnapAppCookies(cookies)
    const cookies1 = snapAppCookies.get(['example.com']).cookies
    const cookies2 = snapAppCookies.get(['sub.example.com']).cookies

    expect(cookies1).toEqual([
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie2', value: 'value2', domain: 'example.com'},
      {name: 'cookie3', value: 'value3', domain: '.example.com'},
    ])

    expect(cookies2).toEqual([
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie4', value: 'value4', domain: 'sub.example.com'},
    ])
  })

  it('cookies toString', async () => {
    const cookies: Cookie[] = [
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie2', value: 'value2', domain: 'example.com'},
      {name: 'cookie3', value: 'value3', domain: '.example.com'},
    ]

    const snapAppCookies = new SnapAppCookies(cookies)
    const cookiesString = snapAppCookies.toString()

    expect(cookiesString).toBe('cookie1=value1; cookie2=value2; cookie3=value3')
  })

  it('cookies toKeyValues', async () => {
    const cookies: Cookie[] = [
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie2', value: 'value2', domain: 'example.com'},
      {name: 'cookie3', value: 'value3', domain: '.example.com'},
    ]

    const snapAppCookies = new SnapAppCookies(cookies)
    const keyValues = snapAppCookies.toKeyValues()

    expect(keyValues).toEqual({
      cookie1: 'value1',
      cookie2: 'value2',
      cookie3: 'value3',
    })
  })

  it('directory path from', async () => {
    const path = DirectoryPath.from('~/test')
    const home = os.homedir().replaceAll(sep, '/')
    expect(path.path).toBe(`${home}/test`)
    expect(path.toString()).toBe(`${home}/test`)

    const path2 = DirectoryPath.from('test')
    expect(path2.path).toBe('test')
    expect(path2.toString()).toBe('test')

    const path3 = DirectoryPath.from('/test')
    expect(path3.path).toBe('/test')
    expect(path3.toString()).toBe('/test')

    const path4 = DirectoryPath.from('./test')
    expect(path4.path).toBe('./test')
    expect(path4.toString()).toBe('./test')

    const path5 = DirectoryPath.from('.')
    expect(path5.path).toBe('.')
    expect(path5.toString()).toBe('.')
  })

  it('file path from', async () => {
    const path = FilePath.from('~/test.txt')
    const home = os.homedir().replaceAll(sep, '/')
    expect(path.dir).toBe(home)
    expect(path.name).toBe('test')
    expect(path.extension).toBe('txt')
    expect(path.toString()).toBe(`${home}/test.txt`)

    const path2 = FilePath.from('test.txt')
    expect(path2.dir).toBe('.')
    expect(path2.name).toBe('test')
    expect(path2.extension).toBe('txt')
    expect(path2.toString()).toBe('./test.txt')

    const path3 = FilePath.from('/test/test.txt')
    expect(path3.dir).toBe('/test')
    expect(path3.name).toBe('test')
    expect(path3.extension).toBe('txt')
    expect(path3.toString()).toBe('/test/test.txt')

    const path4 = FilePath.from('./test/test.txt')
    expect(path4.dir).toBe('./test')
    expect(path4.name).toBe('test')
    expect(path4.extension).toBe('txt')
    expect(path4.toString()).toBe('./test/test.txt')

    const path5 = FilePath.from('test')
    expect(path5.dir).toBe('.')
    expect(path5.name).toBe('test')
    expect(path5.extension).toBe('')
    expect(path5.toString()).toBe('./test')
  })

  it('file path fromDirectory', async () => {
    const path = FilePath.fromDirectory('~/test', 'test.txt')
    const home = os.homedir().replaceAll(sep, '/')
    expect(path.dir).toBe(`${home}/test`)
    expect(path.name).toBe('test')
    expect(path.extension).toBe('txt')
    expect(path.toString()).toBe(`${home}/test/test.txt`)

    const path2 = FilePath.fromDirectory('test', 'test.txt')
    expect(path2.dir).toBe('test')
    expect(path2.name).toBe('test')
    expect(path2.extension).toBe('txt')
    expect(path2.toString()).toBe('test/test.txt')

    const path3 = FilePath.fromDirectory('/test', 'test.txt')
    expect(path3.dir).toBe('/test')
    expect(path3.name).toBe('test')
    expect(path3.extension).toBe('txt')
    expect(path3.toString()).toBe('/test/test.txt')

    const path4 = FilePath.fromDirectory('./test', 'test.txt')
    expect(path4.dir).toBe('./test')
    expect(path4.name).toBe('test')
    expect(path4.extension).toBe('txt')
    expect(path4.toString()).toBe('./test/test.txt')

    const path5 = FilePath.fromDirectory('test', 'test')
    expect(path5.dir).toBe('test')
    expect(path5.name).toBe('test')
    expect(path5.extension).toBe('')
    expect(path5.toString()).toBe('test/test')
  })

  it('file path update', async () => {
    const path = FilePath.from('~/test.txt')
    const path2 = path.update({dir: 'test', name: 'test', extension: 'txt'})
    const home = os.homedir().replaceAll(sep, '/')
    expect(path2.dir).toBe('test')
    expect(path2.name).toBe('test')
    expect(path2.extension).toBe('txt')
    expect(path2.toString()).toBe('test/test.txt')

    const path3 = path.update({dir: 'test', name: 'test'})
    expect(path3.dir).toBe('test')
    expect(path3.name).toBe('test')
    expect(path3.extension).toBe('txt')
    expect(path3.toString()).toBe('test/test.txt')

    const path4 = path.update({name: 'test', extension: 'txt'})
    expect(path4.dir).toBe(home)
    expect(path4.name).toBe('test')
    expect(path4.extension).toBe('txt')
    expect(path4.toString()).toBe(`${home}/test.txt`)
  })

  it('url path from', async () => {
    const path = URLPath.fromURL('https://example.com/test/test.txt')
    expect(path.dir).toBe('/test')
    expect(path.name).toBe('test')
    expect(path.extension).toBe('txt')
    expect(path.toString()).toBe('https://example.com/test/test.txt')

    const path2 = URLPath.fromURL('https://example.com/test/test')
    expect(path2.dir).toBe('/test')
    expect(path2.name).toBe('test')
    expect(path2.extension).toBe('')

    const path3 = URLPath.fromURL('https://example.com/test')
    expect(path3.dir).toBe('')
    expect(path3.name).toBe('test')
    expect(path3.extension).toBe('')

    const path4 = URLPath.fromURL('https://example.com')
    expect(path4.dir).toBe('')
    expect(path4.name).toBe('')
    expect(path4.extension).toBe('')
  })
})
