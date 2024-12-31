import {expect} from 'chai'
import {sep} from 'node:path'

import {Cookie, SnapAppCookies} from '../../src/utils/cookies'
import {DirectoryPath, FilePath, URLPath} from '../../src/utils/path'

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

    expect(cookies1).deep.equal([
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie2', value: 'value2', domain: 'example.com'},
      {name: 'cookie3', value: 'value3', domain: '.example.com'},
    ])

    expect(cookies2).deep.equal([
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

    expect(cookiesString).equal('cookie1=value1; cookie2=value2; cookie3=value3')
  })

  it('cookies toKeyValues', async () => {
    const cookies: Cookie[] = [
      {name: 'cookie1', value: 'value1'},
      {name: 'cookie2', value: 'value2', domain: 'example.com'},
      {name: 'cookie3', value: 'value3', domain: '.example.com'},
    ]

    const snapAppCookies = new SnapAppCookies(cookies)
    const keyValues = snapAppCookies.toKeyValues()

    expect(keyValues).deep.equal({
      cookie1: 'value1',
      cookie2: 'value2',
      cookie3: 'value3',
    })
  })

  it('directory path from', async () => {
    const path = DirectoryPath.from('~/test')
    const home = process.env.HOME!.replaceAll(sep, '/')
    expect(path.path).equal(`${home}/test`)
    expect(path.toString()).equal(`${home}/test`)

    const path2 = DirectoryPath.from('test')
    expect(path2.path).equal('test')
    expect(path2.toString()).equal('test')

    const path3 = DirectoryPath.from('/test')
    expect(path3.path).equal('/test')
    expect(path3.toString()).equal('/test')

    const path4 = DirectoryPath.from('./test')
    expect(path4.path).equal('./test')
    expect(path4.toString()).equal('./test')

    const path5 = DirectoryPath.from('.')
    expect(path5.path).equal('.')
    expect(path5.toString()).equal('.')
  })

  it('file path from', async () => {
    const path = FilePath.from('~/test.txt')
    const home = process.env.HOME!.replaceAll(sep, '/')
    expect(path.dir).equal(home)
    expect(path.name).equal('test')
    expect(path.extension).equal('txt')
    expect(path.toString()).equal(`${home}/test.txt`)

    const path2 = FilePath.from('test.txt')
    expect(path2.dir).equal('.')
    expect(path2.name).equal('test')
    expect(path2.extension).equal('txt')
    expect(path2.toString()).equal('./test.txt')

    const path3 = FilePath.from('/test/test.txt')
    expect(path3.dir).equal('/test')
    expect(path3.name).equal('test')
    expect(path3.extension).equal('txt')
    expect(path3.toString()).equal('/test/test.txt')

    const path4 = FilePath.from('./test/test.txt')
    expect(path4.dir).equal('./test')
    expect(path4.name).equal('test')
    expect(path4.extension).equal('txt')
    expect(path4.toString()).equal('./test/test.txt')

    const path5 = FilePath.from('test')
    expect(path5.dir).equal('.')
    expect(path5.name).equal('test')
    expect(path5.extension).equal('')
    expect(path5.toString()).equal('./test')
  })

  it('file path fromDirectory', async () => {
    const path = FilePath.fromDirectory('~/test', 'test.txt')
    const home = process.env.HOME!.replaceAll(sep, '/')
    expect(path.dir).equal(`${home}/test`)
    expect(path.name).equal('test')
    expect(path.extension).equal('txt')
    expect(path.toString()).equal(`${home}/test/test.txt`)

    const path2 = FilePath.fromDirectory('test', 'test.txt')
    expect(path2.dir).equal('test')
    expect(path2.name).equal('test')
    expect(path2.extension).equal('txt')
    expect(path2.toString()).equal('test/test.txt')

    const path3 = FilePath.fromDirectory('/test', 'test.txt')
    expect(path3.dir).equal('/test')
    expect(path3.name).equal('test')
    expect(path3.extension).equal('txt')
    expect(path3.toString()).equal('/test/test.txt')

    const path4 = FilePath.fromDirectory('./test', 'test.txt')
    expect(path4.dir).equal('./test')
    expect(path4.name).equal('test')
    expect(path4.extension).equal('txt')
    expect(path4.toString()).equal('./test/test.txt')

    const path5 = FilePath.fromDirectory('test', 'test')
    expect(path5.dir).equal('test')
    expect(path5.name).equal('test')
    expect(path5.extension).equal('')
    expect(path5.toString()).equal('test/test')
  })

  it('file path update', async () => {
    const path = FilePath.from('~/test.txt')
    const path2 = path.update({dir: 'test', name: 'test', extension: 'txt'})
    const home = process.env.HOME!.replaceAll(sep, '/')
    expect(path2.dir).equal('test')
    expect(path2.name).equal('test')
    expect(path2.extension).equal('txt')
    expect(path2.toString()).equal('test/test.txt')

    const path3 = path.update({dir: 'test', name: 'test'})
    expect(path3.dir).equal('test')
    expect(path3.name).equal('test')
    expect(path3.extension).equal('txt')
    expect(path3.toString()).equal('test/test.txt')

    const path4 = path.update({name: 'test', extension: 'txt'})
    expect(path4.dir).equal(home)
    expect(path4.name).equal('test')
    expect(path4.extension).equal('txt')
    expect(path4.toString()).equal(`${home}/test.txt`)
  })

  it('url path from', async () => {
    const path = URLPath.fromURL('https://example.com/test/test.txt')
    expect(path.dir).equal('/test')
    expect(path.name).equal('test')
    expect(path.extension).equal('txt')
    expect(path.toString()).equal('https://example.com/test/test.txt')

    const path2 = URLPath.fromURL('https://example.com/test/test')
    expect(path2.dir).equal('/test')
    expect(path2.name).equal('test')
    expect(path2.extension).equal('')

    const path3 = URLPath.fromURL('https://example.com/test')
    expect(path3.dir).equal('')
    expect(path3.name).equal('test')
    expect(path3.extension).equal('')

    const path4 = URLPath.fromURL('https://example.com')
    expect(path4.dir).equal('')
    expect(path4.name).equal('')
    expect(path4.extension).equal('')
  })
})
